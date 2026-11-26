import React from 'react';
import { EmptyState } from '../ui/EmptyState';
import { useTimeline } from '../../hooks';
import { formatTime, truncate, openUrl } from '../../shared/utils';
import { tint } from '../../shared/color';

// ====== TIMELINE TAB ======
export const TimelineTab: React.FC = () => {
  const { data: events } = useTimeline();

  const eventConfig: Record<string, { icon: string; color: string }> = {
    page_visit: { icon: 'fi fi-rr-globe', color: 'var(--accent-secondary)' },
    note_created: { icon: 'fi fi-rr-edit', color: 'var(--accent-amber)' },
    highlight_saved: { icon: 'fi fi-rr-marker', color: 'var(--color-paper)' },
    question_created: { icon: 'fi fi-rr-interrogation', color: 'var(--accent-rose)' },
    session_start: { icon: 'fi fi-rr-play', color: 'var(--success)' },
    session_end: { icon: 'fi fi-rr-stop', color: 'var(--danger)' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ marginBottom: '10px' }}>
        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, margin: 0 }}>
          Timeline
        </h3>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          Chronological trail of browser visits, notes, highlights, and milestones
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '8px' }}>
        {events?.map((ev, i) => {
          const cfg = eventConfig[ev.type] || { icon: 'fi fi-rr-thumbtack', color: 'var(--text-secondary)' };

          return (
            <div
              key={ev.id}
              className="animate-fade-in-up"
              style={{
                display: 'flex',
                gap: '16px',
                padding: '10px 0',
                position: 'relative',
                animationDelay: `${i * 0.02}s`,
                animationFillMode: 'both',
              }}
            >
              {/* Monospace Timestamp */}
              <div style={{ width: '60px', flexShrink: 0, textAlign: 'right', paddingTop: '3px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {formatTime(ev.timestamp)}
                </span>
              </div>

              {/* Central Telemetry Rail & Node */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, position: 'relative' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--bg-tertiary)',
                    border: `2px solid ${cfg.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    color: cfg.color,
                    boxShadow: `0 0 10px ${tint(cfg.color, 25)}`,
                    zIndex: 2,
                  }}
                >
                  <i className={cfg.icon} />
                </div>
                {i < (events?.length || 0) - 1 && (
                  <div
                    style={{
                      width: '2px',
                      flex: 1,
                      background: 'var(--border-default)',
                      marginTop: '4px',
                      marginBottom: '-4px',
                    }}
                  />
                )}
              </div>

              {/* Event Content */}
              <div
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {ev.title}
                </div>
                {ev.url && (
                  <a
                    href={ev.url}
                    onClick={(e) => {
                      e.preventDefault();
                      openUrl(ev.url!);
                    }}
                    style={{
                      fontSize: '11px',
                      color: 'var(--accent-secondary)',
                      textDecoration: 'none',
                      marginTop: '2px',
                      display: 'inline-block',
                      wordBreak: 'break-all',
                    }}
                  >
                    {truncate(ev.url, 60)}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(!events || events.length === 0) && (
        <EmptyState
          icon={<i className="fi fi-rr-calendar" />}
          title="Timeline Stream Empty"
          description="Browse research papers, repos, and documentation to build your chronological event stream."
        />
      )}
    </div>
  );
};
