// Shared React hooks for communicating with the background service worker

import { useState, useEffect, useCallback } from 'react';
import type { Session, Note, Highlight, Question, Page, Topic, DailyReport, TimelineEvent } from '../shared/types';
import type { StatsData, DashboardStats, GraphData } from '../shared/messages';

/** Dispatched on `window` after an action changes stored data; data hooks refetch when they see it. */
export const DATA_CHANGED_EVENT = 'rsr:data-changed';

function useSendMessage<T>(type: string, payload?: unknown, autoFetch = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  // Serialised so callers can pass inline object literals without retriggering the fetch.
  const payloadKey = JSON.stringify(payload);

  const fetch = useCallback(async (overridePayload?: unknown) => {
    setLoading(true);
    setError(null);
    try {
      const response = await chrome.runtime.sendMessage({ type, payload: overridePayload ?? (payloadKey === undefined ? undefined : JSON.parse(payloadKey)) });
      if (response?.success) {
        setData(response.data);
      } else {
        setError(response?.error || 'Unknown error');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
  }, [type, payloadKey]);

  useEffect(() => {
    if (autoFetch) fetch();
  }, [fetch, autoFetch]);

  // Lets an action elsewhere on the page (e.g. "Reset time" in Settings) refresh every list.
  useEffect(() => {
    if (!autoFetch) return;
    const onChanged = () => void fetch();
    window.addEventListener(DATA_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, onChanged);
  }, [fetch, autoFetch]);

  return { data, loading, error, refetch: fetch, setData };
}

export function useSession() {
  return useSendMessage<Session | null>('GET_CURRENT_SESSION');
}

export function useSessions(limit = 50, offset = 0) {
  return useSendMessage<Session[]>('GET_SESSIONS', { limit, offset });
}

export function usePages(sessionId?: string) {
  return useSendMessage<Page[]>('GET_PAGES', sessionId ? { sessionId } : undefined);
}

export function useNotes(sessionId?: string, pageId?: string) {
  return useSendMessage<Note[]>('GET_NOTES', { sessionId, pageId });
}

export function useHighlights(sessionId?: string) {
  return useSendMessage<Highlight[]>('GET_HIGHLIGHTS', sessionId ? { sessionId } : undefined);
}

export function useQuestions(sessionId?: string, status?: string) {
  return useSendMessage<Question[]>('GET_QUESTIONS', { sessionId, status });
}

export * from './useSettings';

export function useStats() {
  return useSendMessage<StatsData>('GET_STATS');
}

export function useTimeline(sessionId?: string, date?: string) {
  return useSendMessage<TimelineEvent[]>('GET_TIMELINE', { sessionId, date });
}

export function useReport(date?: string) {
  return useSendMessage<DailyReport>('GET_DAILY_REPORT', date ? { date } : undefined);
}

export function useTopics() {
  return useSendMessage<Topic[]>('GET_TOPICS');
}

export function useGraphData() {
  return useSendMessage<GraphData>('GET_GRAPH_DATA');
}

export function useDashboardStats(period: 'week' | 'month' | 'all' = 'week') {
  return useSendMessage<DashboardStats>('GET_DASHBOARD_STATS', { period });
}

const THEME_KEY = 'rsr-theme';

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem(THEME_KEY) as 'dark' | 'light') || 'dark';
    } catch { return 'dark'; }
  });

  // The popup, side panel and dashboard share one origin (and so one localStorage), but each is a
  // separate document. `storage` fires in the *other* documents, which keeps open views in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY && (e.newValue === 'dark' || e.newValue === 'light')) setTheme(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  return { theme, toggle };
}

// Action hooks
function useTimeAction(type: 'RESET_TIME' | 'REPAIR_TIME') {
  const [resetting, setResetting] = useState(false);
  /** Returns the number of pages changed, or null on failure. */
  const reset = async (): Promise<number | null> => {
    setResetting(true);
    try {
      const res = await chrome.runtime.sendMessage({ type });
      if (!res?.success) return null;
      window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
      return res.data.pages as number;
    } catch {
      return null;
    } finally {
      setResetting(false);
    }
  };
  return { reset, resetting };
}

export const useResetTime = () => useTimeAction('RESET_TIME');
export const useRepairTime = () => useTimeAction('REPAIR_TIME');

export function useSaveNote() {
  const [saving, setSaving] = useState(false);
  const save = async (content: string, url?: string, pageTitle?: string, tags?: string[]) => {
    setSaving(true);
    try {
      await chrome.runtime.sendMessage({ type: 'SAVE_NOTE', payload: { content, url, pageTitle, tags: tags || [] } });
    } finally { setSaving(false); }
  };
  return { save, saving };
}

export function useSaveQuestion() {
  const [saving, setSaving] = useState(false);
  const save = async (content: string, qType: string, url?: string, pageTitle?: string, description?: string) => {
    setSaving(true);
    try {
      await chrome.runtime.sendMessage({ type: 'SAVE_QUESTION', payload: { content, description, type: qType, url, pageTitle } });
    } finally { setSaving(false); }
  };
  return { save, saving };
}

export function useDeleteNote() {
  return async (id: string) => {
    await chrome.runtime.sendMessage({ type: 'DELETE_NOTE', payload: { id } });
  };
}

export function useDeleteHighlight() {
  return async (id: string) => {
    await chrome.runtime.sendMessage({ type: 'DELETE_HIGHLIGHT', payload: { id } });
  };
}

export function useDeleteQuestion() {
  return async (id: string) => {
    await chrome.runtime.sendMessage({ type: 'DELETE_QUESTION', payload: { id } });
  };
}

export function useUpdateQuestion() {
  return async (id: string, changes: { content?: string; status?: string }) => {
    await chrome.runtime.sendMessage({ type: 'UPDATE_QUESTION', payload: { id, ...changes } });
  };
}

export function useEndSession() {
  return async () => {
    await chrome.runtime.sendMessage({ type: 'END_SESSION' });
  };
}

export function useStartSession() {
  return async () => {
    await chrome.runtime.sendMessage({ type: 'START_SESSION' });
  };
}
