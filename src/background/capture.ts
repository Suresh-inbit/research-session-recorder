// ============================================================
// Capture — saving highlights / notes / questions
// ============================================================
// Shared by the message handler (content script + UI) and the context menu so the
// "which session/page does this belong to" logic lives in exactly one place.

import { highlightRepo } from '../db/repositories/highlight-repo';
import { noteRepo } from '../db/repositories/note-repo';
import { questionRepo } from '../db/repositories/question-repo';
import { db } from '../db/database';
import { UNTRACKED_ID } from '../shared/constants';
import { generateId } from '../shared/utils';
import type { Highlight, Note, Question, QuestionType, TimelineEvent } from '../shared/types';
import { getCurrentSessionId, handlePageVisit, initSessionManager } from './session-manager';

interface CaptureContext {
  sessionId: string;
  pageId?: string;
}

/**
 * Work out which session/page a capture belongs to. If the page isn't recorded yet
 * (and is trackable) it is recorded now; otherwise the item is stored as "untracked".
 */
async function resolveContext(url?: string, title?: string): Promise<CaptureContext> {
  await initSessionManager();
  if (url) {
    const page = await handlePageVisit(url, title || url);
    if (page) return { sessionId: page.sessionId, pageId: page.id };
  }
  return { sessionId: getCurrentSessionId() ?? UNTRACKED_ID };
}

function snippet(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max)}...` : flat;
}

function logEvent(event: Omit<TimelineEvent, 'id' | 'timestamp'>): Promise<unknown> {
  return db.timelineEvents.add({ id: generateId(), timestamp: Date.now(), ...event });
}

export async function saveHighlight(input: {
  text: string;
  surroundingText?: string;
  url: string;
  pageTitle: string;
}): Promise<Highlight> {
  const ctx = await resolveContext(input.url, input.pageTitle);
  const highlight = await highlightRepo.create({
    pageId: ctx.pageId ?? UNTRACKED_ID,
    sessionId: ctx.sessionId,
    text: input.text,
    surroundingText: input.surroundingText,
    url: input.url,
    pageTitle: input.pageTitle,
  });
  await logEvent({
    type: 'highlight_saved',
    title: `Highlighted: "${snippet(input.text, 80)}"`,
    url: input.url,
    entityId: highlight.id,
    entityType: 'highlight',
    sessionId: ctx.sessionId,
  });
  return highlight;
}

export async function saveNote(input: {
  content: string;
  url?: string;
  pageTitle?: string;
  tags?: string[];
}): Promise<Note> {
  const ctx = await resolveContext(input.url, input.pageTitle);
  const note = await noteRepo.create({
    pageId: ctx.pageId,
    sessionId: ctx.sessionId,
    content: input.content,
    url: input.url,
    pageTitle: input.pageTitle,
    tags: input.tags ?? [],
  });
  await logEvent({
    type: 'note_created',
    title: `Note: "${snippet(input.content, 80)}"`,
    url: input.url,
    entityId: note.id,
    entityType: 'note',
    sessionId: ctx.sessionId,
  });
  return note;
}

export async function saveQuestion(input: {
  content: string;
  description?: string;
  type: QuestionType;
  url?: string;
  pageTitle?: string;
}): Promise<Question> {
  const ctx = await resolveContext(input.url, input.pageTitle);
  const question = await questionRepo.create({
    pageId: ctx.pageId,
    sessionId: ctx.sessionId,
    content: input.content,
    description: input.description,
    type: input.type,
    status: 'open',
    url: input.url,
    pageTitle: input.pageTitle,
  });
  await logEvent({
    type: 'question_created',
    title: `${input.type}: "${snippet(input.content, 80)}"`,
    url: input.url,
    entityId: question.id,
    entityType: 'question',
    sessionId: ctx.sessionId,
  });
  return question;
}
