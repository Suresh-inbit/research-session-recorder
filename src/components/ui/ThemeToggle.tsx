import React from 'react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{
        background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)', padding: '6px 8px',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-secondary)', fontSize: '16px',
        transition: 'all var(--transition-fast)',
      }}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};
