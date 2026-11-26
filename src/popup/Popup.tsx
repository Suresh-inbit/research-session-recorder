import React, { useState, useEffect } from 'react';
import { useStats, useTheme } from '../hooks';
import { Button } from '../components/ui/Button';
import { SettingsModal } from '../components/ui/SettingsModal';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { openSidePanel, formatDuration, formatTime, openExtensionPage } from '../shared/utils';

export const Popup: React.FC = () => {
  const { data: stats, loading } = useStats();
  const { theme, toggle } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [timer, setTimer] = useState('00:00');

  useEffect(() => {
    if (!stats?.activeSession) return;
    const update = () => {
      const elapsed = Math.floor((Date.now() - stats.activeSession!.startTime) / 1000);
      setTimer(formatDuration(elapsed));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [stats?.activeSession]);

  if (loading) {
    return (
      <div style={{ width: '330px', padding: '24px', background: 'var(--bg-primary)', boxSizing: 'border-box' }}>
        <div className="shimmer-loading skeleton" style={{ height: '220px' }} />
      </div>
    );
  }

  const statItems = [
    { icon: <i className="fi fi-rr-document" />, label: 'Papers', value: stats?.todayPapers || 0, color: 'var(--color-paper)' },
    { icon: <i className="fi fi-rr-code-branch" />, label: 'Repos', value: stats?.todayRepos || 0, color: 'var(--color-repository)' },
    { icon: <i className="fi fi-rr-play-alt" />, label: 'Videos', value: stats?.todayVideos || 0, color: 'var(--color-video)' },
    { icon: <i className="fi fi-rr-edit" />, label: 'Notes', value: stats?.todayNotes || 0, color: 'var(--accent-amber)' },
    { icon: <i className="fi fi-rr-marker" />, label: 'Passages', value: stats?.todayHighlights || 0, color: 'var(--accent-primary)' },
    { icon: <i className="fi fi-rr-interrogation" />, label: 'Inquiries', value: stats?.todayQuestions || 0, color: 'var(--accent-rose)' },
  ];

  return (
    <div
      style={{
        width: '330px',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Cockpit Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(13, 148, 136, 0.95) 100%)',
          padding: '16px 18px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img className="brand__mark brand__mark--sm" src="/icons/icon.svg" alt="" aria-hidden="true" style={{ boxShadow: '0 0 0 1.5px rgba(255, 255, 255, 0.45)' }} />
            <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)', letterSpacing: '-0.01em' }}>
              Observatory
            </span>
          </div>

          <div style={{ display: 'flex', gap: '5px' }}>
            <button type="button" className="icon-btn icon-btn--on-accent" onClick={() => setShowSettings(true)} aria-label="Settings" title="Settings">
              <i className="fi fi-rr-settings" />
            </button>
            <ThemeToggle theme={theme} onToggle={toggle} tone="on-accent" />
          </div>
        </div>

        {stats?.activeSession ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span className="live-dot live-dot--sm animate-breathe" aria-hidden="true" />
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9, fontWeight: 700 }}>
                Live Investigation
              </span>
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
              {timer}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
              Since {formatTime(stats.activeSession.startTime)} · {stats.totalSessions} total sessions
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, opacity: 0.95, marginBottom: '2px' }}>
              Standby Mode
            </div>
            <div style={{ fontSize: '11px', opacity: 0.75 }}>
              Visit research papers or repos to trigger recording
            </div>
          </div>
        )}
      </div>

      {/* Today's Stats Grid */}
      <div style={{ padding: '14px 16px' }}>
        <div className="eyebrow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span>Today's Spectrum</span>
          <span className="meta-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {formatDuration(stats?.todayResearchTime || 0)}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {statItems.map((s) => (
            <div key={s.label} className="stat-tile">
              <div className="stat-tile__icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="stat-tile__value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-tile__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Launch Buttons */}
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: '8px' }}>
        <Button
          variant="secondary"
          size="sm"
          style={{ flex: 1 }}
          icon={<i className="fi fi-rr-sidebar" style={{ fontSize: '12px' }} />}
          onClick={() => {
            openSidePanel().then(() => window.close()).catch((e) => console.warn('[RSR] could not open side panel:', e));
          }}
        >
          Side Panel
        </Button>
        <Button
          variant="glow"
          size="sm"
          style={{ flex: 1 }}
          icon={<i className="fi fi-rr-chart-pie-alt" style={{ fontSize: '12px' }} />}
          onClick={() => {
            openExtensionPage('src/dashboard/index.html');
          }}
        >
          Dashboard
        </Button>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

