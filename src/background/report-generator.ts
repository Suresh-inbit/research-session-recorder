// ============================================================
// Report Generator
// ============================================================

import { sessionRepo } from '../db/repositories/session-repo';
import { pageRepo } from '../db/repositories/page-repo';
import { noteRepo } from '../db/repositories/note-repo';
import { highlightRepo } from '../db/repositories/highlight-repo';
import { questionRepo } from '../db/repositories/question-repo';
import { reportRepo } from '../db/repositories/report-repo';
import type { DailyReport } from '../shared/types';
import { getStartOfDay, getEndOfDay, formatDate } from '../shared/utils';
import { extractKeywords } from '../services/topic-extractor';

export async function generateDailyReport(date?: Date): Promise<DailyReport> {
  const targetDate = date || new Date();
  const dateStr = formatDate(targetDate.getTime());
  const startOfDay = getStartOfDay(targetDate);
  const endOfDay = getEndOfDay(targetDate);

  const sessions = await sessionRepo.getByDateRange(startOfDay, endOfDay);
  const pages = await pageRepo.getByDateRange(startOfDay, endOfDay);
  const notes = await noteRepo.getByDateRange(startOfDay, endOfDay);
  const highlights = await highlightRepo.getByDateRange(startOfDay, endOfDay);
  const todayQuestions = await questionRepo.getByDateRange(startOfDay, endOfDay);

  // Active (focused, non-idle) time, consistent with the popup and dashboard.
  const totalResearchTime = Math.round(pages.reduce((sum, p) => sum + p.activeTimeSeconds, 0));

  const paperCount = pages.filter(p => p.type === 'paper').length;
  const repoCount = pages.filter(p => p.type === 'repository').length;
  const videoCount = pages.filter(p => p.type === 'video').length;

  const allText = [...pages.map(p => p.title), ...notes.map(n => n.content), ...highlights.map(h => h.text)].join(' ');
  const topTopics = extractKeywords(allText, 10);
  const openQuestions = todayQuestions.filter(q => q.status === 'open').map(q => q.content);
  const actionItems = generateActions(pages, openQuestions);

  return reportRepo.upsert(dateStr, {
    totalResearchTime, paperCount, repoCount, videoCount,
    noteCount: notes.length, highlightCount: highlights.length,
    questionCount: todayQuestions.length, topTopics, questions: openQuestions,
    actionItems, sessions: sessions.map(s => s.id),
  });
}

function generateActions(pages: Array<{title: string; type: string; activeTimeSeconds: number}>, questions: string[]): string[] {
  const items: string[] = [];
  const brief = pages.filter(p => p.type === 'paper' && p.activeTimeSeconds < 120);
  for (const p of brief.slice(0, 3)) items.push(`Read in detail: ${p.title}`);
  for (const q of questions.slice(0, 3)) items.push(`Investigate: ${q}`);
  return items;
}
