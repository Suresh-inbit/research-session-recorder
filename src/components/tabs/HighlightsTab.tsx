import React from 'react';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { useHighlights } from '../../hooks';
import { formatRelativeTime, openUrl } from '../../shared/utils';

// ====== HIGHLIGHTS TAB ======
export const HighlightsTab: React.FC = () => {
  const { data: highlights, refetch } = useHighlights();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, margin: 0 }}>
          Saved Passages & Quotes ({highlights?.length || 0})
        </h3>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          High-signal quotes captured directly from papers, repos, and documentation
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {highlights?.map((h, i) => (
          <div
            key={h.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 0.03}s`, animationFillMode: 'both' }}
          >
            <Card variant="glass" padding="16px" hover>
              <div
                style={{
                  borderLeft: '3px solid var(--accent-primary)',
                  paddingLeft: '14px',
                  background: 'var(--accent-primary-subtle)',
                  padding: '10px 14px',
                  borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                }}
              >
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                    lineHeight: 1.6,
                    fontStyle: 'italic',
                  }}
                >
                  "{h.text}"
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <a
                  href={h.url}
                  onClick={(e) => {
                    e.preventDefault();
                    openUrl(h.url);
                  }}
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--accent-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '300px',
                    fontWeight: 500,
                  }}
                  title={h.pageTitle}
                >
                  <i className="fi fi-rr-link" style={{ marginRight: 4 }} />{h.pageTitle}
                </a>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {formatRelativeTime(h.createdAt)}
                  </span>
                  <button
                    type="button"
                    className="icon-action icon-action--danger"
                    onClick={() => {
                      chrome.runtime?.sendMessage?.({ type: 'DELETE_HIGHLIGHT', payload: { id: h.id } });
                      setTimeout(refetch, 200);
                    }}
                    title="Delete highlight"
                    aria-label="Delete highlight"
                  >
                    <i className="fi fi-rr-trash" />
                  </button>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {(!highlights || highlights.length === 0) && (
        <EmptyState
          icon={<i className="fi fi-rr-marker" />}
          title="No Passages Highlighted"
          description="Highlight text on any arXiv paper or web page, then click 'Save to Research' to catalog key passages."
        />
      )}
    </div>
  );
};
