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

export async function generateDailyReport(date?: Date): Promise<DailyReport> {
  const targetDate = date || new Date();
  const dateStr = formatDate(targetDate.getTime());
  const startOfDay = getStartOfDay(targetDate);
  const endOfDay = getEndOfDay(targetDate);

  const sessions = await sessionRepo.getByDateRange(startOfDay, endOfDay);
  const pages = await pageRepo.getByDateRange(startOfDay, endOfDay);
  const notes = await noteRepo.getByDateRange(startOfDay, endOfDay);
  const highlights = await highlightRepo.getByDateRange(startOfDay, endOfDay);
  const allQuestions = await questionRepo.getAll();
  const todayQuestions = allQuestions.filter(q => q.createdAt >= startOfDay && q.createdAt <= endOfDay);

  const totalResearchTime = sessions.reduce((sum, s) => {
    const end = s.endTime || Date.now();
    return sum + Math.floor((end - s.startTime) / 1000);
  }, 0);

  const paperCount = pages.filter(p => p.type === 'paper').length;
  const repoCount = pages.filter(p => p.type === 'repository').length;
  const videoCount = pages.filter(p => p.type === 'video').length;

  const allText = [...pages.map(p => p.title), ...notes.map(n => n.content), ...highlights.map(h => h.text)].join(' ');
  const topTopics = extractTopics(allText);
  const openQuestions = todayQuestions.filter(q => q.status === 'open').map(q => q.content);
  const actionItems = generateActions(pages, openQuestions);

  return reportRepo.upsert(dateStr, {
    totalResearchTime, paperCount, repoCount, videoCount,
    noteCount: notes.length, highlightCount: highlights.length,
    questionCount: todayQuestions.length, topTopics, questions: openQuestions,
    actionItems, sessions: sessions.map(s => s.id),
  });
}

function extractTopics(text: string): string[] {
  const stops = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','may','might','can','this','that','these','those','it','its','not','no','all','each','every','both','few','more','most','other','some','such','than','too','very','just','about','also','new','used','using','use','based','via','like','github','com','http','https','www','arxiv','org','pdf','abs','i','we','you','he','she','they','me','us','him','her','them','my','our','your','his','their','what','which','who','whom','when','where','why','how','yes']);
  const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stops.has(w));
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  return Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w);
}

function generateActions(pages: Array<{title: string; type: string; activeTimeSeconds: number}>, questions: string[]): string[] {
  const items: string[] = [];
  const brief = pages.filter(p => p.type === 'paper' && p.activeTimeSeconds < 120);
  for (const p of brief.slice(0, 3)) items.push(`Read in detail: ${p.title}`);
  for (const q of questions.slice(0, 3)) items.push(`Investigate: ${q}`);
  return items;
}
