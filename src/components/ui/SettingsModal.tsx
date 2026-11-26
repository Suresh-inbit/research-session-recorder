import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { useSettings } from '../../hooks';
import { TextArea } from './Input';
import { normalizeDomain } from '../../shared/url-rules';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();

  const trackingEnabled = settings?.trackingEnabled ?? true;
  const highlightEnabled = settings?.highlightEnabled ?? true;

  // Edited as free text (one domain per line); saved when the field loses focus.
  const [blockedText, setBlockedText] = useState('');
  useEffect(() => {
    setBlockedText((settings?.blockedDomains ?? []).join('\n'));
  }, [settings?.blockedDomains]);

  const saveBlocked = () => {
    const domains = blockedText.split(/[\s,]+/).map(normalizeDomain).filter(Boolean);
    updateSettings({ blockedDomains: domains });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Preferences & Telemetry">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Master Tracking */}
        <div
          onClick={() => updateSettings({ trackingEnabled: !trackingEnabled })}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        >
          <div style={{ flex: 1, paddingRight: '12px' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
              Automatic Session Tracking
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
              Record active dwell times and auto-group research pages into sessions
            </div>
          </div>
          {/* Custom Switch */}
          <div
            style={{
              width: '42px',
              height: '24px',
              borderRadius: 'var(--radius-full)',
              background: trackingEnabled ? 'var(--accent-primary)' : 'var(--bg-hover)',
              padding: '2px',
              transition: 'background var(--transition-base)',
              display: 'flex',
              alignItems: 'center',
              boxShadow: trackingEnabled ? 'var(--shadow-glow)' : 'none',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#ffffff',
                transform: trackingEnabled ? 'translateX(18px)' : 'translateX(0)',
                transition: 'transform var(--transition-fast)',
                boxShadow: 'var(--shadow-sm)',
              }}
            />
          </div>
        </div>

        {/* Text Highlighting */}
        <div
          onClick={() => updateSettings({ highlightEnabled: !highlightEnabled })}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        >
          <div style={{ flex: 1, paddingRight: '12px' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
              Highlight Capture Overlay
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
              Display instant quick-save tooltip when selecting text across web pages
            </div>
          </div>
          {/* Custom Switch */}
          <div
            style={{
              width: '42px',
              height: '24px',
              borderRadius: 'var(--radius-full)',
              background: highlightEnabled ? 'var(--accent-primary)' : 'var(--bg-hover)',
              padding: '2px',
              transition: 'background var(--transition-base)',
              display: 'flex',
              alignItems: 'center',
              boxShadow: highlightEnabled ? 'var(--shadow-glow)' : 'none',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#ffffff',
                transform: highlightEnabled ? 'translateX(18px)' : 'translateX(0)',
                transition: 'transform var(--transition-fast)',
                boxShadow: 'var(--shadow-sm)',
              }}
            />
          </div>
        </div>

        {/* Blocklist */}
        <div
          style={{
            padding: '14px 16px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
            Never track these sites
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.4, marginBottom: '8px' }}>
            One domain per line (subdomains included), e.g. <code>intranet.example.com</code>. Webmail, social
            media and search results are always skipped. Private/incognito windows are never tracked.
          </div>
          <TextArea
            value={blockedText}
            onChange={(e) => setBlockedText(e.target.value)}
            onBlur={saveBlocked}
            placeholder={'mybank.com\nintranet.example.com'}
            rows={3}
          />
        </div>

        <div style={{ padding: '8px 4px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
          Research Session Recorder v1.0.0 · Everything stays on this device (unencrypted browser storage)
        </div>
      </div>
    </Modal>
  );
};

