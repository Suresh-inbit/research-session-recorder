// ============================================================
// Message Handler
// ============================================================

import type { ExtensionMessage, MessageResponse, StatsData, DashboardStats, GraphData, ExportData } from '../shared/messages';
import type { QuestionStatus } from '../shared/types';
import { sessionRepo } from '../db/repositories/session-repo';
import { pageRepo } from '../db/repositories/page-repo';
import { noteRepo } from '../db/repositories/note-repo';
import { highlightRepo } from '../db/repositories/highlight-repo';
import { questionRepo } from '../db/repositories/question-repo';
import { topicRepo } from '../db/repositories/topic-repo';
import { relationshipRepo } from '../db/repositories/relationship-repo';
import { db } from '../db/database';
import { getCurrentSession, getCurrentSessionId, endCurrentSession, startManualSession, initSessionManager } from './session-manager';
import { generateDailyReport } from './report-generator';
import { saveHighlight, saveNote, saveQuestion } from './capture';
import { buildDailyBuckets, computeStreak, startOfDayDaysAgo } from '../services/stats';
import { getStartOfDay, formatDate } from '../shared/utils';

export function initMessageHandler(): void {
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    // Only handle messages that are ours; leave the rest (e.g. replies meant for content scripts) alone.
    if (!message || typeof message.type !== 'string' || message.type === 'TOGGLE_NOTE_WIDGET' || message.type === 'GET_PAGE_METADATA') {
      return false;
    }
    handleMessage(message)
      .then((response) => sendResponse(response))
      .catch((error) => sendResponse({ success: false, error: error?.message ?? String(error) }));
    return true; // Keep the message channel open for async response
  });
}

async function handleMessage(message: ExtensionMessage): Promise<MessageResponse> {
  await initSessionManager();
  switch (message.type) {
    case 'PAGE_METADATA': {
      const sessionId = getCurrentSessionId();
      if (!sessionId) return { success: false, error: 'No active session' };
      const page = await pageRepo.getByUrl(message.payload.url, sessionId);
      if (!page) return { success: false, error: 'Page not tracked (yet)' };
      await pageRepo.update(page.id, { metadata: { ...page.metadata, ...message.payload.metadata } });
      return { success: true };
    }

    case 'SAVE_HIGHLIGHT':
      return { success: true, data: await saveHighlight(message.payload) };

    case 'SAVE_NOTE':
      return { success: true, data: await saveNote(message.payload) };

    case 'SAVE_QUESTION':
      return { success: true, data: await saveQuestion(message.payload) };

    case 'GET_CURRENT_SESSION': {
      const session = await getCurrentSession();
      return { success: true, data: session };
    }

    case 'GET_SESSIONS': {
      const sessions = await sessionRepo.getAll(message.payload?.limit, message.payload?.offset);
      return { success: true, data: sessions };
    }

    case 'GET_PAGES': {
      const pages = message.payload?.sessionId
        ? await pageRepo.getBySession(message.payload.sessionId)
        : await pageRepo.getAll();
      return { success: true, data: pages };
    }

    case 'GET_NOTES': {
      let notes;
      if (message.payload?.sessionId) notes = await noteRepo.getBySession(message.payload.sessionId);
      else if (message.payload?.pageId) notes = await noteRepo.getByPage(message.payload.pageId);
      else notes = await noteRepo.getAll();
      return { success: true, data: notes };
    }

    case 'GET_HIGHLIGHTS': {
      let highlights;
      if (message.payload?.sessionId) highlights = await highlightRepo.getBySession(message.payload.sessionId);
      else if (message.payload?.pageId) highlights = await highlightRepo.getByPage(message.payload.pageId);
      else highlights = await highlightRepo.getAll();
      return { success: true, data: highlights };
    }

    case 'GET_QUESTIONS': {
      let questions;
      if (message.payload?.status) questions = await questionRepo.getByStatus(message.payload.status as QuestionStatus);
      else if (message.payload?.sessionId) questions = await questionRepo.getBySession(message.payload.sessionId);
      else questions = await questionRepo.getAll();
      return { success: true, data: questions };
    }

    case 'UPDATE_NOTE': {
      await noteRepo.update(message.payload.id, {
        content: message.payload.content,
        tags: message.payload.tags,
      });
      return { success: true };
    }

    case 'DELETE_NOTE': {
      await noteRepo.delete(message.payload.id);
      return { success: true };
    }

    case 'UPDATE_QUESTION': {
      await questionRepo.update(message.payload.id, {
        content: message.payload.content,
        status: message.payload.status,
      });
      return { success: true };
    }

    case 'DELETE_QUESTION': {
      await questionRepo.delete(message.payload.id);
      return { success: true };
    }

    case 'DELETE_HIGHLIGHT': {
      await highlightRepo.delete(message.payload.id);
      return { success: true };
    }

    case 'GET_TIMELINE': {
      let events;
      if (message.payload?.sessionId) {
        events = await db.timelineEvents.where('sessionId').equals(message.payload.sessionId).reverse().toArray();
      } else {
        const start = message.payload?.date ? getStartOfDay(new Date(message.payload.date)) : getStartOfDay();
        events = await db.timelineEvents.where('timestamp').aboveOrEqual(start).reverse().toArray();
      }
      return { success: true, data: events };
    }

    case 'GET_DAILY_REPORT': {
      const report = await generateDailyReport(message.payload?.date ? new Date(message.payload.date) : undefined);
      return { success: true, data: report };
    }

    case 'GET_STATS': {
      const startOfDay = getStartOfDay();
      const session = await getCurrentSession();
      const todayPages = await pageRepo.getVisitedToday(startOfDay);
      const stats: StatsData = {
        activeSession: session,
        todayPapers: todayPages.filter((p) => p.type === 'paper').length,
        todayRepos: todayPages.filter((p) => p.type === 'repository').length,
        todayVideos: todayPages.filter((p) => p.type === 'video').length,
        todayNotes: await noteRepo.count(startOfDay),
        todayHighlights: await highlightRepo.count(startOfDay),
        todayQuestions: await questionRepo.count(startOfDay),
        // Active (focused, non-idle) time — not wall-clock session length.
        todayResearchTime: Math.round(todayPages.reduce((sum, p) => sum + p.activeTimeSeconds, 0)),
        totalSessions: await sessionRepo.count(),
      };
      return { success: true, data: stats };
    }

    case 'GET_EXPORT_DATA': {
      // Unlike the list endpoints (capped for the UI), exports must contain everything.
      const data: ExportData = {
        sessions: await db.sessions.orderBy('startTime').reverse().toArray(),
        pages: await db.pages.orderBy('visitedAt').reverse().toArray(),
        notes: await db.notes.orderBy('createdAt').reverse().toArray(),
        highlights: await db.highlights.orderBy('createdAt').reverse().toArray(),
        questions: await db.questions.orderBy('createdAt').reverse().toArray(),
      };
      return { success: true, data };
    }

    case 'GET_TOPICS': {
      const topics = await topicRepo.getAll();
      return { success: true, data: topics };
    }

    case 'GET_GRAPH_DATA': {
      const graphData = await buildGraphData();
      return { success: true, data: graphData };
    }

    case 'END_SESSION': {
      await endCurrentSession();
      return { success: true };
    }

    case 'START_SESSION': {
      await startManualSession();
      return { success: true };
    }

    case 'GET_DASHBOARD_STATS': {
      const dashStats = await buildDashboardStats(message.payload?.period || 'week');
      return { success: true, data: dashStats };
    }

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

async function buildGraphData(): Promise<GraphData> {
  const pages = await pageRepo.getAll(50);
  const topics = await topicRepo.getTop(20);
  const relationships = await relationshipRepo.getAll();

  const nodes = [
    ...pages.map(p => ({ id: p.id, type: p.type, label: p.title, data: { url: p.url } })),
    ...topics.map(t => ({ id: t.id, type: 'topic', label: t.name, data: { frequency: t.frequency } })),
  ];

  const edges = relationships.map(r => ({
    id: r.id, source: r.sourceId, target: r.targetId, label: r.relationType,
  }));

  return { nodes, edges };
}

async function buildDashboardStats(period: string): Promise<DashboardStats> {
  const now = Date.now();
  const days = period === 'month' ? 30 : period === 'all' ? 365 : 7;
  const windowStart = startOfDayDaysAgo(days - 1, now);

  const [sessions, pages, topics, noteCount, highlightCount, questionCount] = await Promise.all([
    sessionRepo.getByDateRange(windowStart, now + 1),
    pageRepo.getByDateRange(windowStart, now + 1),
    topicRepo.getTop(10),
    noteRepo.count(windowStart),
    highlightRepo.count(windowStart),
    questionRepo.count(windowStart),
  ]);

  const totalHours = pages.reduce((sum, p) => sum + p.activeTimeSeconds / 3600, 0);
  const byTime = (type: string) =>
    pages.filter((p) => p.type === type).sort((a, b) => b.activeTimeSeconds - a.activeTimeSeconds).slice(0, 5);

  const monthlyData = buildDailyBuckets(pages, days, now);
  const weeklyData = monthlyData.slice(-7);

  // Streak looks back a year regardless of the selected period; only index keys are read.
  const visitKeys = await db.pages.where('visitedAt').aboveOrEqual(startOfDayDaysAgo(364, now)).keys();
  const streak = computeStreak(new Set(visitKeys.map((k) => formatDate(Number(k)))), now);

  const categoryBreakdown = ['paper', 'repository', 'documentation', 'video', 'blog', 'forum', 'dataset']
    .map((type) => {
      const filtered = pages.filter((p) => p.type === type);
      return { type, count: filtered.length, time: filtered.reduce((s, p) => s + p.activeTimeSeconds, 0) };
    })
    .filter((b) => b.count > 0);

  return {
    totalResearchHours: Math.round(totalHours * 10) / 10,
    totalSessions: sessions.length,
    totalNotes: noteCount,
    totalHighlights: highlightCount,
    totalQuestions: questionCount,
    topTopics: topics.map((t) => ({ name: t.name, count: t.frequency })),
    topPapers: byTime('paper'),
    topRepos: byTime('repository'),
    weeklyData,
    monthlyData,
    streakDays: streak,
    currentStreak: streak,
    categoryBreakdown,
  };
}
