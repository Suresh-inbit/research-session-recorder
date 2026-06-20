// ============================================================
// Message Handler
// ============================================================

import type { ExtensionMessage, MessageResponse, StatsData, DashboardStats, GraphData } from '../shared/messages';
import { sessionRepo } from '../db/repositories/session-repo';
import { pageRepo } from '../db/repositories/page-repo';
import { noteRepo } from '../db/repositories/note-repo';
import { highlightRepo } from '../db/repositories/highlight-repo';
import { questionRepo } from '../db/repositories/question-repo';
import { topicRepo } from '../db/repositories/topic-repo';
import { relationshipRepo } from '../db/repositories/relationship-repo';
import { reportRepo } from '../db/repositories/report-repo';
import { db } from '../db/database';
import { handlePageVisit, getCurrentSession, getCurrentSessionId, endCurrentSession } from './session-manager';
import { setActivePageId } from './time-tracker';
import { generateDailyReport } from './report-generator';
import { getStartOfDay, formatDate, generateId } from '../shared/utils';
import type { Page } from '../shared/types';

export function initMessageHandler(): void {
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    handleMessage(message)
      .then((response) => sendResponse(response))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  });
}

async function handleMessage(message: ExtensionMessage): Promise<MessageResponse> {
  switch (message.type) {
    case 'PAGE_VISIT': {
      const page = await handlePageVisit(message.payload.url, message.payload.title);
      if (page) setActivePageId(page.id);
      return { success: true, data: page };
    }

    case 'PAGE_METADATA': {
      const sessionId = getCurrentSessionId();
      if (!sessionId) return { success: false, error: 'No active session' };
      const page = await pageRepo.getByUrl(message.payload.url, sessionId);
      if (page) {
        await pageRepo.update(page.id, { metadata: { ...page.metadata, ...message.payload.metadata } });
      }
      return { success: true };
    }

    case 'SAVE_HIGHLIGHT': {
      const sessionId = getCurrentSessionId();
      if (!sessionId) return { success: false, error: 'No active session' };
      const page = await pageRepo.getByUrl(message.payload.url, sessionId);
      const highlight = await highlightRepo.create({
        pageId: page?.id || 'untracked',
        sessionId,
        text: message.payload.text,
        surroundingText: message.payload.surroundingText,
        url: message.payload.url,
        pageTitle: message.payload.pageTitle,
      });
      await db.timelineEvents.add({
        id: generateId(), timestamp: Date.now(), type: 'highlight_saved',
        title: `Highlighted: "${message.payload.text.slice(0, 60)}..."`,
        url: message.payload.url, entityId: highlight.id, entityType: 'highlight', sessionId,
      });
      return { success: true, data: highlight };
    }

    case 'SAVE_NOTE': {
      const sessionId = getCurrentSessionId();
      if (!sessionId) return { success: false, error: 'No active session' };
      let pageId: string | undefined;
      if (message.payload.url) {
        const page = await pageRepo.getByUrl(message.payload.url, sessionId);
        pageId = page?.id;
      }
      const note = await noteRepo.create({
        pageId, sessionId,
        content: message.payload.content,
        url: message.payload.url, pageTitle: message.payload.pageTitle,
        tags: message.payload.tags || [],
      });
      await db.timelineEvents.add({
        id: generateId(), timestamp: Date.now(), type: 'note_created',
        title: `Note: "${message.payload.content.slice(0, 60)}..."`,
        url: message.payload.url, entityId: note.id, entityType: 'note', sessionId,
      });
      return { success: true, data: note };
    }

    case 'SAVE_QUESTION': {
      const sessionId = getCurrentSessionId();
      if (!sessionId) return { success: false, error: 'No active session' };
      let pageId: string | undefined;
      if (message.payload.url) {
        const page = await pageRepo.getByUrl(message.payload.url, sessionId);
        pageId = page?.id;
      }
      const question = await questionRepo.create({
        pageId, sessionId,
        content: message.payload.content, type: message.payload.type,
        status: 'open', url: message.payload.url, pageTitle: message.payload.pageTitle,
      });
      await db.timelineEvents.add({
        id: generateId(), timestamp: Date.now(), type: 'question_created',
        title: `${message.payload.type}: "${message.payload.content.slice(0, 60)}..."`,
        entityId: question.id, entityType: 'question', sessionId,
      });
      return { success: true, data: question };
    }

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
      if (message.payload?.status) questions = await questionRepo.getByStatus(message.payload.status as any);
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
      const stats: StatsData = {
        activeSession: session,
        todayPapers: await pageRepo.countByType('paper', startOfDay),
        todayRepos: await pageRepo.countByType('repository', startOfDay),
        todayVideos: await pageRepo.countByType('video', startOfDay),
        todayNotes: await noteRepo.count(startOfDay),
        todayHighlights: await highlightRepo.count(startOfDay),
        todayQuestions: await questionRepo.count(startOfDay),
        todayResearchTime: 0,
        totalSessions: await sessionRepo.count(),
      };
      // Calculate today's research time
      const todaySessions = await sessionRepo.getByDateRange(startOfDay, Date.now());
      stats.todayResearchTime = todaySessions.reduce((sum, s) => {
        const end = s.endTime || Date.now();
        return sum + Math.floor((end - s.startTime) / 1000);
      }, 0);
      return { success: true, data: stats };
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

    case 'EXPORT_DATA': {
      // Handled by the export service in the UI context
      return { success: true, data: { message: 'Export handled by UI' } };
    }

    case 'SEARCH': {
      // Handled by the search engine in the UI context
      return { success: true, data: [] };
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
  const days = period === 'month' ? 30 : period === 'all' ? 365 : 7;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const sessions = await sessionRepo.getRecentSessions(days);
  const pages = await pageRepo.getAll(500);
  const recentPages = pages.filter(p => p.visitedAt >= cutoff);
  const topics = await topicRepo.getTop(10);
  const notes = await noteRepo.getAll(500);
  const highlights = await highlightRepo.getAll(500);
  const questions = await questionRepo.getAll(500);

  const totalHours = sessions.reduce((sum, s) => {
    const end = s.endTime || Date.now();
    return sum + (end - s.startTime) / 3600000;
  }, 0);

  const topPapers = recentPages.filter(p => p.type === 'paper').sort((a, b) => b.activeTimeSeconds - a.activeTimeSeconds).slice(0, 5);
  const topRepos = recentPages.filter(p => p.type === 'repository').sort((a, b) => b.activeTimeSeconds - a.activeTimeSeconds).slice(0, 5);

  // Build daily data
  const dailyData = new Map<string, { hours: number; pages: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86400000);
    dailyData.set(formatDate(d.getTime()), { hours: 0, pages: 0 });
  }
  for (const s of sessions) {
    const key = formatDate(s.startTime);
    const entry = dailyData.get(key);
    if (entry) {
      const end = s.endTime || Date.now();
      entry.hours += (end - s.startTime) / 3600000;
    }
  }
  for (const p of recentPages) {
    const key = formatDate(p.visitedAt);
    const entry = dailyData.get(key);
    if (entry) entry.pages++;
  }

  const weeklyData = Array.from(dailyData.entries()).slice(0, 7).map(([date, d]) => ({ date, ...d })).reverse();
  const monthlyData = Array.from(dailyData.entries()).map(([date, d]) => ({ date, ...d })).reverse();

  // Streak calculation
  let streak = 0;
  const sortedDates = Array.from(dailyData.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  for (const [, data] of sortedDates) {
    if (data.hours > 0) streak++;
    else break;
  }

  const typeBreakdown = ['paper', 'repository', 'documentation', 'video', 'blog', 'forum', 'dataset'].map(type => {
    const filtered = recentPages.filter(p => p.type === type);
    return { type, count: filtered.length, time: filtered.reduce((s, p) => s + p.activeTimeSeconds, 0) };
  }).filter(b => b.count > 0);

  return {
    totalResearchHours: Math.round(totalHours * 10) / 10,
    totalSessions: sessions.length,
    totalNotes: notes.length,
    totalHighlights: highlights.length,
    totalQuestions: questions.length,
    topTopics: topics.map(t => ({ name: t.name, count: t.frequency })),
    topPapers, topRepos,
    weeklyData, monthlyData,
    streakDays: streak,
    currentStreak: streak,
    categoryBreakdown: typeBreakdown,
  };
}
