import React, { useState, useEffect, useCallback } from 'react';
import { Tabs } from '../components/ui/Tabs';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { SearchBar } from '../components/ui/SearchBar';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { TextArea } from '../components/ui/Input';
import { useSession, usePages, useNotes, useHighlights, useQuestions, useTimeline, useTheme, useSaveNote, useSaveQuestion, useEndSession, useStats } from '../hooks';
import { formatDuration, formatTime, formatRelativeTime, truncate } from '../shared/utils';
import { PAGE_TYPE_LABELS, PAGE_TYPE_COLORS } from '../shared/constants';
import type { Note, Highlight, Question, Page, TimelineEvent } from '../shared/types';
import Fuse from 'fuse.js';

const TABS = [
  { id: 'session', label: 'Session', icon: '🔬' },
  { id: 'notes', label: 'Notes', icon: '📝' },
  { id: 'highlights', label: 'Highlights', icon: '🖍️' },
  { id: 'questions', label: 'Questions', icon: '❓' },
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'search', label: 'Search', icon: '🔍' },
];

export const SidePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('session');
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🔬</span>
          <span style={{ fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--text-primary)' }}>
            Research Recorder
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <Button variant="ghost" size="sm" onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/index.html') })}>
            📊
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '8px 12px 0' }}>
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {activeTab === 'session' && <SessionTab />}
        {activeTab === 'notes' && <NotesTab />}
        {activeTab === 'highlights' && <HighlightsTab />}
        {activeTab === 'questions' && <QuestionsTab />}
        {activeTab === 'timeline' && <TimelineTab />}
        {activeTab === 'search' && <SearchTab />}
      </div>
    </div>
  );
};

// ====== SESSION TAB ======
const SessionTab: React.FC = () => {
  const { data: session, refetch } = useSession();
  const { data: stats } = useStats();
  const { data: pages } = usePages(session?.id);
  const endSession = useEndSession();

  useEffect(() => { const t = setInterval(refetch, 10000); return () => clearInterval(t); }, [refetch]);

  if (!session) {
    return <EmptyState icon="🔬" title="No Active Session" description="Visit a research page (arXiv, GitHub, YouTube, etc.) to automatically start a session." />;
  }

  const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
  const sortedPages = pages?.sort((a, b) => b.activeTimeSeconds - a.activeTimeSeconds) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-fade-in">
      {/* Session header */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} className="animate-breathe" />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Active Session</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
              {formatDuration(elapsed)}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Started {formatTime(session.startTime)}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={async () => { await endSession(); refetch(); }}>
            End Session
          </Button>
        </div>
      </Card>

      {/* Today's Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { label: 'Papers', value: stats.todayPapers, color: 'var(--color-paper)' },
            { label: 'Repos', value: stats.todayRepos, color: 'var(--color-repository)' },
            { label: 'Notes', value: stats.todayNotes, color: 'var(--color-blog)' },
          ].map((s) => (
            <Card key={s.label} padding="10px 12px">
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{s.label}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Pages visited */}
      <div>
        <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
          Pages Visited ({sortedPages.length})
        </h4>
        {sortedPages.map((page, i) => (
          <div key={page.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s`, animationFillMode: 'both' }}>
            <PageItem page={page} />
          </div>
        ))}
        {sortedPages.length === 0 && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', padding: '12px 0' }}>No pages visited yet</div>}
      </div>
    </div>
  );
};

const PageItem: React.FC<{ page: Page }> = ({ page }) => (
  <Card hover style={{ marginBottom: '6px', padding: '10px 12px' }} onClick={() => chrome.tabs.create({ url: page.url })}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {page.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          <Badge pageType={page.type} size="sm">{PAGE_TYPE_LABELS[page.type]}</Badge>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            {formatDuration(page.activeTimeSeconds)}
          </span>
        </div>
      </div>
    </div>
  </Card>
);

// ====== NOTES TAB ======
const NotesTab: React.FC = () => {
  const { data: notes, refetch } = useNotes();
  const { save, saving } = useSaveNote();
  const [showEditor, setShowEditor] = useState(false);
  const [newNote, setNewNote] = useState('');

  const handleSave = async () => {
    if (!newNote.trim()) return;
    await save(newNote);
    setNewNote('');
    setShowEditor(false);
    setTimeout(refetch, 200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Notes ({notes?.length || 0})</h3>
        <Button size="sm" onClick={() => setShowEditor(!showEditor)} icon={<span>+</span>}>New</Button>
      </div>

      {showEditor && (
        <Card style={{ background: 'var(--bg-tertiary)' }}>
          <TextArea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Write your note... (Markdown supported)" style={{ marginBottom: '8px' }} />
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="sm" onClick={() => { setShowEditor(false); setNewNote(''); }}>Cancel</Button>
            <Button size="sm" onClick={handleSave} loading={saving} disabled={!newNote.trim()}>Save Note</Button>
          </div>
        </Card>
      )}

      {notes?.map((note, i) => (
        <div key={note.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s`, animationFillMode: 'both' }}>
          <NoteItem note={note} onDelete={() => { chrome.runtime.sendMessage({ type: 'DELETE_NOTE', payload: { id: note.id } }); setTimeout(refetch, 200); }} />
        </div>
      ))}

      {(!notes || notes.length === 0) && !showEditor && (
        <EmptyState icon="📝" title="No Notes Yet" description="Create notes on any page using Ctrl+Shift+N or click New above." action={<Button size="sm" onClick={() => setShowEditor(true)}>Create First Note</Button>} />
      )}
    </div>
  );
};

const NoteItem: React.FC<{ note: Note; onDelete: () => void }> = ({ note, onDelete }) => (
  <Card>
    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
      {note.content}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {note.pageTitle && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{truncate(note.pageTitle, 30)}</span>}
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{formatRelativeTime(note.createdAt)}</span>
      </div>
      <button onClick={onDelete} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '14px', padding: '2px' }}>🗑</button>
    </div>
    {note.tags.length > 0 && (
      <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
        {note.tags.map(t => <Badge key={t} size="sm">{t}</Badge>)}
      </div>
    )}
  </Card>
);

// ====== HIGHLIGHTS TAB ======
const HighlightsTab: React.FC = () => {
  const { data: highlights, refetch } = useHighlights();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Highlights ({highlights?.length || 0})</h3>
      {highlights?.map((h, i) => (
        <div key={h.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s`, animationFillMode: 'both' }}>
          <Card>
            <div style={{ borderLeft: '3px solid var(--accent-primary)', paddingLeft: '12px' }}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                "{h.text}"
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
              <a href={h.url} onClick={(e) => { e.preventDefault(); chrome.tabs.create({ url: h.url }); }}
                style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                {h.pageTitle}
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{formatRelativeTime(h.createdAt)}</span>
                <button onClick={() => { chrome.runtime.sendMessage({ type: 'DELETE_HIGHLIGHT', payload: { id: h.id } }); setTimeout(refetch, 200); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '14px' }}>🗑</button>
              </div>
            </div>
          </Card>
        </div>
      ))}
      {(!highlights || highlights.length === 0) && (
        <EmptyState icon="🖍️" title="No Highlights Yet" description="Select text on any page and click 'Save Highlight' or right-click → 'Save to Research Notes'." />
      )}
    </div>
  );
};

// ====== QUESTIONS TAB ======
const QuestionsTab: React.FC = () => {
  const { data: questions, refetch } = useQuestions();
  const { save, saving } = useSaveQuestion();
  const [showEditor, setShowEditor] = useState(false);
  const [content, setContent] = useState('');
  const [qType, setQType] = useState<string>('question');

  const handleSave = async () => {
    if (!content.trim()) return;
    await save(content, qType);
    setContent('');
    setShowEditor(false);
    setTimeout(refetch, 200);
  };

  const typeIcons: Record<string, string> = { question: '❓', hypothesis: '🧪', idea: '💡' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Research Questions ({questions?.length || 0})</h3>
        <Button size="sm" onClick={() => setShowEditor(!showEditor)} icon={<span>+</span>}>New</Button>
      </div>

      {showEditor && (
        <Card style={{ background: 'var(--bg-tertiary)' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            {['question', 'hypothesis', 'idea'].map(t => (
              <button key={t} onClick={() => setQType(t)} style={{
                padding: '4px 10px', borderRadius: 'var(--radius-full)', border: 'none',
                background: qType === t ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                color: qType === t ? 'white' : 'var(--text-secondary)',
                fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'all var(--transition-fast)',
              }}>
                {typeIcons[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <TextArea value={content} onChange={(e) => setContent(e.target.value)} placeholder={`Enter your ${qType}...`} />
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} loading={saving} disabled={!content.trim()}>Save</Button>
          </div>
        </Card>
      )}

      {questions?.map((q, i) => (
        <div key={q.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s`, animationFillMode: 'both' }}>
          <Card>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px' }}>{typeIcons[q.type] || '❓'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.6 }}>{q.content}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <Badge size="sm" color={q.status === 'open' ? 'var(--warning)' : q.status === 'answered' ? 'var(--success)' : 'var(--text-tertiary)'}>
                    {q.status}
                  </Badge>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{formatRelativeTime(q.createdAt)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {q.status === 'open' && (
                  <button onClick={() => { chrome.runtime.sendMessage({ type: 'UPDATE_QUESTION', payload: { id: q.id, status: 'answered' } }); setTimeout(refetch, 200); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }} title="Mark answered">✅</button>
                )}
                <button onClick={() => { chrome.runtime.sendMessage({ type: 'DELETE_QUESTION', payload: { id: q.id } }); setTimeout(refetch, 200); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '14px' }}>🗑</button>
              </div>
            </div>
          </Card>
        </div>
      ))}

      {(!questions || questions.length === 0) && !showEditor && (
        <EmptyState icon="❓" title="No Research Questions" description="Track questions, hypotheses, and ideas as you research." action={<Button size="sm" onClick={() => setShowEditor(true)}>Ask a Question</Button>} />
      )}
    </div>
  );
};

// ====== TIMELINE TAB ======
const TimelineTab: React.FC = () => {
  const { data: events } = useTimeline();

  const eventIcons: Record<string, string> = {
    page_visit: '🌐', note_created: '📝', highlight_saved: '🖍️',
    question_created: '❓', session_start: '▶️', session_end: '⏹️',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: '8px' }}>Today's Timeline</h3>
      {events?.map((ev, i) => (
        <div key={ev.id} className="animate-fade-in-up" style={{
          display: 'flex', gap: '12px', padding: '8px 0',
          animationDelay: `${i * 0.02}s`, animationFillMode: 'both',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '50px', flexShrink: 0 }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {formatTime(ev.timestamp)}
            </span>
          </div>
          <div style={{ width: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <span>{eventIcons[ev.type] || '📌'}</span>
            {i < (events?.length || 0) - 1 && <div style={{ flex: 1, width: '1px', background: 'var(--border-default)', marginTop: '4px' }} />}
          </div>
          <div style={{ flex: 1, paddingBottom: '8px' }}>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{ev.title}</div>
            {ev.url && (
              <a href={ev.url} onClick={(e) => { e.preventDefault(); chrome.tabs.create({ url: ev.url! }); }}
                style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-secondary)' }}>
                {truncate(ev.url, 50)}
              </a>
            )}
          </div>
        </div>
      ))}
      {(!events || events.length === 0) && <EmptyState icon="📅" title="No Activity Today" description="Start browsing research pages to build your timeline." />}
    </div>
  );
};

// ====== SEARCH TAB ======
const SearchTab: React.FC = () => {
  const [query, setQuery] = useState('');
  const { data: notes } = useNotes();
  const { data: highlights } = useHighlights();
  const { data: questions } = useQuestions();
  const { data: pages } = usePages();

  const allItems = [
    ...(notes?.map(n => ({ id: n.id, type: 'note' as const, title: n.content.slice(0, 100), content: n.content, url: n.url, timestamp: n.createdAt })) || []),
    ...(highlights?.map(h => ({ id: h.id, type: 'highlight' as const, title: h.text.slice(0, 100), content: h.text, url: h.url, timestamp: h.createdAt })) || []),
    ...(questions?.map(q => ({ id: q.id, type: 'question' as const, title: q.content.slice(0, 100), content: q.content, url: q.url, timestamp: q.createdAt })) || []),
    ...(pages?.map(p => ({ id: p.id, type: 'page' as const, title: p.title, content: p.title + ' ' + p.url, url: p.url, timestamp: p.visitedAt })) || []),
  ];

  const fuse = new Fuse(allItems, { keys: ['title', 'content', 'url'], threshold: 0.35, includeScore: true });
  const results = query ? fuse.search(query).slice(0, 30) : [];

  const typeIcons: Record<string, string> = { note: '📝', highlight: '🖍️', question: '❓', page: '🌐' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <SearchBar value={query} onChange={setQuery} placeholder="Search notes, highlights, questions, pages..." />
      {query && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{results.length} results</div>}
      {results.map(({ item }, i) => (
        <div key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s`, animationFillMode: 'both' }}>
          <Card hover onClick={() => item.url && chrome.tabs.create({ url: item.url })}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span>{typeIcons[item.type]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{truncate(item.title, 80)}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>{formatRelativeTime(item.timestamp)}</div>
              </div>
              <Badge size="sm">{item.type}</Badge>
            </div>
          </Card>
        </div>
      ))}
      {!query && <EmptyState icon="🔍" title="Search Your Research" description="Search across notes, highlights, questions, and pages." />}
    </div>
  );
};
