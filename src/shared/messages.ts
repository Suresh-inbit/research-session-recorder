// ============================================================
// Typed Message Protocol
// ============================================================
// All messages between background, content scripts, popup, and sidepanel
// use this typed protocol for type-safe communication.

import type { PageType, PageMetadata, Note, Highlight, Question, Session, Page, DailyReport, SearchResult, TimelineEvent } from './types';

// ---------- Content → Background ----------

export interface PageVisitMessage {
  type: 'PAGE_VISIT';
  payload: {
    url: string;
    title: string;
  };
}

export interface PageMetadataMessage {
  type: 'PAGE_METADATA';
  payload: {
    url: string;
    metadata: PageMetadata;
  };
}

export interface SaveHighlightMessage {
  type: 'SAVE_HIGHLIGHT';
  payload: {
    text: string;
    surroundingText?: string;
    url: string;
    pageTitle: string;
  };
}

export interface SaveNoteMessage {
  type: 'SAVE_NOTE';
  payload: {
    content: string;
    url?: string;
    pageTitle?: string;
    tags?: string[];
  };
}

export interface SaveQuestionMessage {
  type: 'SAVE_QUESTION';
  payload: {
    content: string;
    type: 'question' | 'hypothesis' | 'idea';
    url?: string;
    pageTitle?: string;
  };
}

// ---------- Background → Content ----------

export interface GetPageMetadataMessage {
  type: 'GET_PAGE_METADATA';
}

export interface ToggleNoteWidgetMessage {
  type: 'TOGGLE_NOTE_WIDGET';
}

// ---------- UI → Background ----------

export interface GetSessionMessage {
  type: 'GET_CURRENT_SESSION';
}

export interface GetSessionsMessage {
  type: 'GET_SESSIONS';
  payload?: {
    limit?: number;
    offset?: number;
  };
}

export interface GetPagesMessage {
  type: 'GET_PAGES';
  payload?: {
    sessionId?: string;
  };
}

export interface GetNotesMessage {
  type: 'GET_NOTES';
  payload?: {
    sessionId?: string;
    pageId?: string;
  };
}

export interface GetHighlightsMessage {
  type: 'GET_HIGHLIGHTS';
  payload?: {
    sessionId?: string;
    pageId?: string;
  };
}

export interface GetQuestionsMessage {
  type: 'GET_QUESTIONS';
  payload?: {
    sessionId?: string;
    status?: string;
  };
}

export interface UpdateNoteMessage {
  type: 'UPDATE_NOTE';
  payload: {
    id: string;
    content?: string;
    tags?: string[];
  };
}

export interface DeleteNoteMessage {
  type: 'DELETE_NOTE';
  payload: { id: string };
}

export interface UpdateQuestionMessage {
  type: 'UPDATE_QUESTION';
  payload: {
    id: string;
    content?: string;
    status?: 'open' | 'answered' | 'archived';
  };
}

export interface DeleteQuestionMessage {
  type: 'DELETE_QUESTION';
  payload: { id: string };
}

export interface DeleteHighlightMessage {
  type: 'DELETE_HIGHLIGHT';
  payload: { id: string };
}

export interface SearchMessage {
  type: 'SEARCH';
  payload: { query: string };
}

export interface GetTimelineMessage {
  type: 'GET_TIMELINE';
  payload?: {
    sessionId?: string;
    date?: string;
  };
}

export interface GetDailyReportMessage {
  type: 'GET_DAILY_REPORT';
  payload?: { date?: string };
}

export interface GetStatsMessage {
  type: 'GET_STATS';
  payload?: { date?: string };
}

export interface ExportDataMessage {
  type: 'EXPORT_DATA';
  payload: {
    format: 'markdown' | 'json' | 'csv' | 'obsidian';
    sessionId?: string;
    dateRange?: { start: string; end: string };
  };
}

export interface GetTopicsMessage {
  type: 'GET_TOPICS';
}

export interface GetGraphDataMessage {
  type: 'GET_GRAPH_DATA';
}

export interface EndSessionMessage {
  type: 'END_SESSION';
}

export interface GetDashboardStatsMessage {
  type: 'GET_DASHBOARD_STATS';
  payload?: {
    period?: 'week' | 'month' | 'all';
  };
}

// ---------- Union Type ----------

export type ExtensionMessage =
  | PageVisitMessage
  | PageMetadataMessage
  | SaveHighlightMessage
  | SaveNoteMessage
  | SaveQuestionMessage
  | GetPageMetadataMessage
  | ToggleNoteWidgetMessage
  | GetSessionMessage
  | GetSessionsMessage
  | GetPagesMessage
  | GetNotesMessage
  | GetHighlightsMessage
  | GetQuestionsMessage
  | UpdateNoteMessage
  | DeleteNoteMessage
  | UpdateQuestionMessage
  | DeleteQuestionMessage
  | DeleteHighlightMessage
  | SearchMessage
  | GetTimelineMessage
  | GetDailyReportMessage
  | GetStatsMessage
  | ExportDataMessage
  | GetTopicsMessage
  | GetGraphDataMessage
  | EndSessionMessage
  | GetDashboardStatsMessage;

// ---------- Response Types ----------

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StatsData {
  activeSession: Session | null;
  todayPapers: number;
  todayRepos: number;
  todayVideos: number;
  todayNotes: number;
  todayHighlights: number;
  todayQuestions: number;
  todayResearchTime: number;
  totalSessions: number;
}

export interface DashboardStats {
  totalResearchHours: number;
  totalSessions: number;
  totalNotes: number;
  totalHighlights: number;
  totalQuestions: number;
  topTopics: { name: string; count: number }[];
  topPapers: Page[];
  topRepos: Page[];
  weeklyData: { date: string; hours: number; pages: number }[];
  monthlyData: { date: string; hours: number; pages: number }[];
  streakDays: number;
  currentStreak: number;
  categoryBreakdown: { type: string; count: number; time: number }[];
}

export interface GraphData {
  nodes: { id: string; type: string; label: string; data?: Record<string, unknown> }[];
  edges: { id: string; source: string; target: string; label?: string }[];
}
