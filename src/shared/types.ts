// ============================================================
// Shared Type Definitions
// ============================================================

export type PageType =
  | 'paper'
  | 'repository'
  | 'documentation'
  | 'video'
  | 'blog'
  | 'forum'
  | 'dataset'
  | 'unknown';

export type QuestionType = 'question' | 'hypothesis' | 'idea';
export type QuestionStatus = 'open' | 'answered' | 'archived';
export type EntityType = 'page' | 'note' | 'highlight' | 'question' | 'topic' | 'session';
export type RelationType = 'references' | 'related_to' | 'derived_from' | 'part_of' | 'answers';
export type Theme = 'dark' | 'light';

export interface PaperMetadata {
  authors?: string[];
  abstract?: string;
  venue?: string;
  year?: number;
  arxivId?: string;
}

export interface GitHubMetadata {
  owner?: string;
  repoName?: string;
  description?: string;
  stars?: number;
  language?: string;
  topics?: string[];
}

export type PageMetadata = PaperMetadata & GitHubMetadata;

export interface Session {
  id: string;
  startTime: number;
  endTime?: number;
  duration: number;
  pageCount: number;
  noteCount: number;
  highlightCount: number;
  questionCount: number;
  topics: string[];
  isActive: boolean;
}

export interface Page {
  id: string;
  sessionId: string;
  url: string;
  title: string;
  type: PageType;
  typeConfidence: number;
  activeTimeSeconds: number;
  visitedAt: number;
  lastActiveAt: number;
  metadata?: PageMetadata;
}

export interface Note {
  id: string;
  pageId?: string;
  sessionId: string;
  content: string;
  url?: string;
  pageTitle?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Highlight {
  id: string;
  pageId: string;
  sessionId: string;
  text: string;
  surroundingText?: string;
  url: string;
  pageTitle: string;
  createdAt: number;
}

export interface Question {
  id: string;
  pageId?: string;
  sessionId: string;
  content: string;
  type: QuestionType;
  status: QuestionStatus;
  url?: string;
  pageTitle?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Topic {
  id: string;
  name: string;
  frequency: number;
  firstSeen: number;
  lastSeen: number;
  parentId?: string;
}

export interface Relationship {
  id: string;
  sourceId: string;
  sourceType: EntityType;
  targetId: string;
  targetType: EntityType;
  relationType: RelationType;
  createdAt: number;
}

export interface DailyReport {
  id: string;
  date: string;
  totalResearchTime: number;
  paperCount: number;
  repoCount: number;
  videoCount: number;
  noteCount: number;
  highlightCount: number;
  questionCount: number;
  topTopics: string[];
  questions: string[];
  actionItems: string[];
  sessions: string[];
  createdAt: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'page_visit' | 'note_created' | 'highlight_saved' | 'question_created' | 'session_start' | 'session_end';
  title: string;
  description?: string;
  url?: string;
  entityId: string;
  entityType: EntityType;
  sessionId: string;
}

export interface SearchResult {
  id: string;
  type: EntityType;
  title: string;
  snippet: string;
  url?: string;
  timestamp: number;
  score: number;
}
