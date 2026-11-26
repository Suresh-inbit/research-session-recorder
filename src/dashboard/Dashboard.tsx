import React, { useState, useEffect } from 'react';
import {
  useDashboardStats,
  useTheme,
  useGraphData,
  useSession,
  useStartSession,
  useEndSession,
} from '../hooks';
import { Button } from '../components/ui/Button';
import { Tabs, Tab } from '../components/ui/Tabs';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { SettingsModal } from '../components/ui/SettingsModal';
import { KnowledgeGraph } from '../components/graph/KnowledgeGraph';
import { formatDuration } from '../shared/utils';
import {
  NotesTab,
  HighlightsTab,
  QuestionsTab,
  TimelineTab,
  SearchTab,
} from '../components/tabs';
import { OverviewTab } from './OverviewTab';
import { ReportTab } from './ReportTab';
import { ExportTab } from './ExportTab';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [showSettings, setShowSettings] = useState(false);
  const { theme, toggle } = useTheme();
  const { data: stats, loading } = useDashboardStats(period);
  const { data: graphData, loading: graphLoading } = useGraphData();
  const { data: session, refetch: refetchSession } = useSession();
  const startSession = useStartSession();
  const endSession = useEndSession();

  const [sessionTimer, setSessionTimer] = useState<string>('00:00');

  useEffect(() => {
    if (!session) return;
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
      setSessionTimer(formatDuration(elapsed));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview', icon: <i className="fi fi-rr-chart-pie-alt" /> },
    { id: 'report', label: 'Daily Brief', icon: <i className="fi fi-rr-clipboard-list" /> },
    { id: 'notes', label: 'Notes', icon: <i className="fi fi-rr-edit" />, count: stats?.totalNotes },
    { id: 'highlights', label: 'Highlights', icon: <i className="fi fi-rr-marker" />, count: stats?.totalHighlights },
    { id: 'questions', label: 'Inquiries', icon: <i className="fi fi-rr-interrogation" /> },
    { id: 'timeline', label: 'Timeline', icon: <i className="fi fi-rr-calendar" /> },
    { id: 'search', label: 'Search', icon: <i className="fi fi-rr-search" /> },
    { id: 'graph', label: 'Knowledge Graph', icon: <i className="fi fi-rr-diagram-project" /> },
    { id: 'export', label: 'Export Hub', icon: <i className="fi fi-rr-box" /> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      <header className="app-header glass-panel">
        <div className="brand">
          <img className="brand__mark" src="/icons/icon.svg" alt="" aria-hidden="true" />
          <div style={{ minWidth: 0 }}>
            <h1 className="brand__title">
              Observatory
              <span className="chip-pro">PRO</span>
            </h1>
            <p className="brand__tagline">Research Session Recorder & Knowledge Synthesis</p>
          </div>
        </div>

        <nav className="app-header__nav" aria-label="Dashboard sections">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </nav>

        <div className="app-header__actions">
          {session ? (
            <div className="session-pill">
              <span className="live-dot animate-breathe" aria-hidden="true" />
              <span className="session-pill__time" aria-label="Session duration">{sessionTimer}</span>
              <Button
                variant="danger"
                size="xs"
                onClick={async () => {
                  await endSession();
                  refetchSession();
                }}
              >
                End Session
              </Button>
            </div>
          ) : (
            <Button
              variant="telemetry"
              size="sm"
              icon={<i className="fi fi-rr-play" style={{ fontSize: '11px' }} />}
              onClick={async () => {
                await startSession();
                refetchSession();
              }}
            >
              Start Session
            </Button>
          )}

          <span className="app-header__divider" aria-hidden="true" />

          <button type="button" className="icon-btn" onClick={() => setShowSettings(true)} aria-label="Settings" title="Settings">
            <i className="fi fi-rr-settings" />
          </button>
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            loading={loading}
            period={period}
            onPeriodChange={setPeriod}
          />
        )}
        {activeTab === 'report' && <ReportTab />}
        {activeTab === 'notes' && <NotesTab />}
        {activeTab === 'highlights' && <HighlightsTab />}
        {activeTab === 'questions' && <QuestionsTab />}
        {activeTab === 'timeline' && <TimelineTab />}
        {activeTab === 'search' && <SearchTab />}
        {activeTab === 'graph' && <KnowledgeGraph data={graphData} loading={graphLoading} />}
        {activeTab === 'export' && <ExportTab />}
      </main>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};
