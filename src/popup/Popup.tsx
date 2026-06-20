import React, { useEffect } from 'react';
import { useStats, useTheme } from '../hooks';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatDuration, formatTime } from '../shared/utils';

export const Popup: React.FC = () => {
  const { data: stats, loading } = useStats();
  const { theme, toggle } = useTheme();

  if (loading) {
    return (
      <div style={{ width: '320px', padding: '20px', background: 'var(--bg-primary)', textAlign: 'center' }}>
        <div className="shimmer-loading" style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  const statItems = [
    { icon: '📄', label: 'Papers', value: stats?.todayPapers || 0, color: 'var(--color-paper)' },
    { icon: '💻', label: 'Repos', value: stats?.todayRepos || 0, color: 'var(--color-repository)' },
    { icon: '🎬', label: 'Videos', value: stats?.todayVideos || 0, color: 'var(--color-video)' },
    { icon: '📝', label: 'Notes', value: stats?.todayNotes || 0, color: 'var(--color-blog)' },
    { icon: '🖍️', label: 'Highlights', value: stats?.todayHighlights || 0, color: 'var(--accent-primary)' },
    { icon: '❓', label: 'Questions', value: stats?.todayQuestions || 0, color: 'var(--color-forum)' },
  ];

  return (
    <div style={{ width: '320px', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--accent-primary) 0%, #5b3cc4 100%)',
        padding: '16px 20px', color: 'white',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🔬</span>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>Research Recorder</span>
          </div>
          <button onClick={toggle} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '4px 6px', color: 'white', cursor: 'pointer', fontSize: '14px' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        {stats?.activeSession ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} className="animate-breathe" />
              <span style={{ fontSize: 'var(--text-sm)', opacity: 0.85 }}>Active Session</span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {formatDuration(Math.floor((Date.now() - stats.activeSession.startTime) / 1000))}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', opacity: 0.7, marginTop: '2px' }}>
              Since {formatTime(stats.activeSession.startTime)} · {stats.totalSessions} total sessions
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 'var(--text-sm)', opacity: 0.85, marginBottom: '4px' }}>No Active Session</div>
            <div style={{ fontSize: 'var(--text-xs)', opacity: 0.6 }}>Visit a research page to start</div>
          </div>
        )}
      </div>

      {/* Today's Stats */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '10px' }}>
          Today · {formatDuration(stats?.todayResearchTime || 0)} research
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {statItems.map((s) => (
            <div key={s.label} style={{
              textAlign: 'center', padding: '10px 6px', background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ fontSize: '16px', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: '8px' }}>
        <Button variant="secondary" size="sm" style={{ flex: 1 }}
          onClick={() => {
            chrome.windows.getCurrent().then((win) => {
              if (win.id && chrome.sidePanel?.open) {
                chrome.sidePanel.open({ windowId: win.id }).catch(() => chrome.runtime.openOptionsPage?.());
              }
            });
          }}>
          📋 Side Panel
        </Button>
        <Button variant="secondary" size="sm" style={{ flex: 1 }}
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/index.html') })}>
          📊 Dashboard
        </Button>
      </div>
    </div>
  );
};
