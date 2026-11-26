import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { useSettings, useResetTime, useRepairTime } from '../../hooks';
import { Button } from './Button';
import { TextArea } from './Input';
import { normalizeDomain } from '../../shared/url-rules';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Read from the manifest so the footer can't drift from the real version. */
const version = (() => {
  try {
    return chrome.runtime.getManifest().version;
  } catch {
    return '';
  }
})();

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();

  const trackingEnabled = settings?.trackingEnabled ?? true;
  const highlightEnabled = settings?.highlightEnabled ?? true;

  // Edited as free text (one domain per line); saved when the field loses focus.
  const [blockedText, setBlockedText] = useState('');
  useEffect(() => {
    setBlockedText((settings?.blockedDomains ?? []).join('\n'));
  }, [settings?.blockedDomains]);

  // Two-step reset: the first click arms it, the second performs it.
  const { reset: resetTime, resetting } = useResetTime();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);
  const doReset = async () => {
    const res = await resetTime();
    setConfirmReset(false);
    setResetResult(
      'error' in res ? `Could not reset time: ${res.error}.` : `Time reset on ${res.pages} ${res.pages === 1 ? 'page' : 'pages'}.`
    );
  };
  const { reset: repairTime, resetting: repairing } = useRepairTime();
  const doRepair = async () => {
    setConfirmReset(false);
    const res = await repairTime();
    setResetResult(
      'error' in res
        ? `Could not repair time: ${res.error}.`
        : res.pages === 0
          ? 'Nothing to fix: all recorded times are plausible.'
          : `Fixed unrealistic time on ${res.pages} ${res.pages === 1 ? 'page' : 'pages'}.`
    );
  };
  useEffect(() => {
    if (!isOpen) {
      setConfirmReset(false);
      setResetResult(null);
    }
  }, [isOpen]);

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

        {/* Reset tracked time */}
        <div
          style={{
            padding: '14px 16px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
            Tracked time
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.4, marginBottom: '10px' }}>
            <b>Repair</b> caps times that are longer than real time allows (left by older versions) and keeps the
            rest. <b>Reset</b> sets every page's recorded time to zero. Pages, sessions, notes and highlights are
            kept either way; reset cannot be undone.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<i className="fi fi-rr-wrench-simple" />}
              loading={repairing}
              disabled={resetting || confirmReset}
              onClick={doRepair}
            >
              Repair time
            </Button>
            {confirmReset ? (
              <>
                <Button variant="danger" size="sm" loading={resetting} onClick={doReset}>
                  Yes, reset all time
                </Button>
                <Button variant="ghost" size="sm" disabled={resetting} onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                icon={<i className="fi fi-rr-rotate-right" />}
                onClick={() => {
                  setResetResult(null);
                  setConfirmReset(true);
                }}
              >
                Reset time
              </Button>
            )}
            {resetResult && (
              <span role="status" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                {resetResult}
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: '8px 4px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
          Research Session Recorder v{version} · Everything stays on this device (unencrypted browser storage)
        </div>
      </div>
    </Modal>
  );
};

