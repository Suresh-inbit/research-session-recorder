import React, { useState, useEffect } from 'react';
import { Tabs, Tab } from '../components/ui/Tabs';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SettingsModal } from '../components/ui/SettingsModal';
import {
  useSession,
  usePages,
  useTheme,
  useEndSession,
  useStartSession,
  useStats,
} from '../hooks';
import { formatDuration, formatTime, openUrl, openExtensionPage } from '../shared/utils';
import { PAGE_TYPE_LABELS, PAGE_TYPE_ICONS } from '../shared/constants';
import type { Page } from '../shared/types';
import {
  NotesTab,
  HighlightsTab,
  QuestionsTab,
  TimelineTab,
  SearchTab,
} from '../components/tabs';

const TABS: Tab[] = [
  { id: 'session', label: 'Live', icon: <i className="fi fi-rr-pulse" /> },
  { id: 'notes', label: 'Notes', icon: <i className="fi fi-rr-edit" /> },
  { id: 'highlights', label: 'Quotes', icon: <i className="fi fi-rr-marker" /> },
  { id: 'questions', label: 'Inquiries', icon: <i className="fi fi-rr-interrogation" /> },
  { id: 'timeline', label: 'Rail', icon: <i className="fi fi-rr-calendar" /> },
  { id: 'search', label: 'Search', icon: <i className="fi fi-rr-search" /> },
];

export const SidePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('session');
  const [showSettings, setShowSettings] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      <header className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
        <div className="brand" style={{ gap: '8px' }}>
          <img className="brand__mark brand__mark--sm" src="/icons/icon.svg" alt="" aria-hidden="true" />
          <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)', letterSpacing: '-0.01em' }}>Observatory</span>
        </div>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button type="button" className="icon-btn icon-btn--bare" onClick={() => setShowSettings(true)} aria-label="Settings" title="Settings">
            <i className="fi fi-rr-settings" />
          </button>
          <ThemeToggle theme={theme} onToggle={toggleTheme} tone="bare" />
          <button type="button" className="icon-btn icon-btn--bare" title="Open Dashboard" aria-label="Open Dashboard" onClick={() => openExtensionPage('src/dashboard/index.html')}>
            <i className="fi fi-rr-expand" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ padding: '8px 10px 4px 10px' }}>
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} variant="compact" />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {activeTab === 'session' && <SessionTab />}
        {activeTab === 'notes' && <NotesTab />}
        {activeTab === 'highlights' && <HighlightsTab />}
        {activeTab === 'questions' && <QuestionsTab />}
        {activeTab === 'timeline' && <TimelineTab />}
        {activeTab === 'search' && <SearchTab />}
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

// ====== SESSION TAB ======
const SessionTab: React.FC = () => {
  const { data: session, refetch } = useSession();
  const { data: stats } = useStats();
  const { data: pages } = usePages(session?.id);
  const endSession = useEndSession();
  const startSession = useStartSession();

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(refetch, 5000);
    return () => clearInterval(t);
  }, [refetch]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - session.startTime) / 1000));
    }, 1000);
    setElapsed(Math.floor((Date.now() - session.startTime) / 1000));
    return () => clearInterval(interval);
  }, [session]);

  if (!session) {
    return (
      <EmptyState
        icon={<i className="fi fi-rr-microscope" />}
        title="Session Standby"
        description="Navigate to research resources (arXiv, GitHub, docs) to auto-record, or initiate manually."
        action={
          <Button
            variant="glow"
            size="sm"
            onClick={async () => {
              await startSession();
              refetch();
            }}
          >
            Start Research Session
          </Button>
        }
      />
    );
  }

  const sortedPages = pages?.sort((a, b) => b.activeTimeSeconds - a.activeTimeSeconds) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-fade-in">
      {/* Session Status HUD */}
      <Card variant="glass" padding="16px" glow>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span className="live-dot animate-breathe" aria-hidden="true" />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--success)' }}>
                Active Telemetry
              </span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {formatDuration(elapsed)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Started {formatTime(session.startTime)}
            </div>
          </div>
          <Button
            variant="danger"
            size="xs"
            onClick={async () => {
              await endSession();
              refetch();
            }}
          >
            End
          </Button>
        </div>
      </Card>

      {/* Today's Tally Matrix */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { label: 'Papers', value: stats.todayPapers, color: 'var(--color-paper)' },
            { label: 'Repos', value: stats.todayRepos, color: 'var(--color-repository)' },
            { label: 'Notes', value: stats.todayNotes, color: 'var(--accent-amber)' },
          ].map((s) => (
            <div key={s.label} className="stat-tile" style={{ padding: '8px 10px' }}>
              <div className="stat-tile__value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-tile__label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Visited Dwell Trail */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h4 className="eyebrow">
            Active Dwell Trail ({sortedPages.length})
          </h4>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sortedPages.map((page, i) => (
            <div key={page.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s`, animationFillMode: 'both' }}>
              <PageItem page={page} />
            </div>
          ))}
        </div>
        {sortedPages.length === 0 && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', padding: '16px 0', textAlign: 'center' }}>
            No research pages visited in this session
          </div>
        )}
      </div>
    </div>
  );
};

const PageItem: React.FC<{ page: Page }> = ({ page }) => (
  <Card
    hover
    padding="10px 12px"
    variant="glass"
    onClick={() => {
      openUrl(page.url);
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {page.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          <Badge pageType={page.type} size="xs">
            <i className={PAGE_TYPE_ICONS[page.type] || PAGE_TYPE_ICONS.unknown} style={{ marginRight: '3px' }} />
            {PAGE_TYPE_LABELS[page.type] || page.type}
          </Badge>
          <span className="meta-mono">
            {formatDuration(page.activeTimeSeconds)}
          </span>
        </div>
      </div>
    </div>
  </Card>
);

