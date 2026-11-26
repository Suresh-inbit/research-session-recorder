import React from 'react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
  /** Visual treatment: default bordered button, or white-on-accent for the popup header. */
  tone?: 'default' | 'on-accent' | 'bare';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle, tone = 'default' }) => {
  const next = theme === 'dark' ? 'light' : 'dark';
  const toneClass = tone === 'on-accent' ? 'icon-btn--on-accent' : tone === 'bare' ? 'icon-btn--bare' : theme === 'dark' ? 'icon-btn--sun' : 'icon-btn--moon';
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`icon-btn ${toneClass}`}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      <i className={theme === 'dark' ? 'fi fi-rr-sun' : 'fi fi-rr-moon'} />
    </button>
  );
};
