import React, { useState } from 'react';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ placeholder = 'Search...', value, onChange, onSubmit }) => {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <svg
        width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }}
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '8px 12px 8px 34px',
          background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
          fontSize: 'var(--text-base)', outline: 'none',
          transition: 'border-color var(--transition-fast)',
        }}
        onFocus={(e) => (e.target as HTMLElement).style.borderColor = 'var(--accent-primary)'}
        onBlur={(e) => (e.target as HTMLElement).style.borderColor = 'var(--border-default)'}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute', right: '8px', background: 'none', border: 'none',
            color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '16px', lineHeight: 1,
            display: 'flex', padding: '2px',
          }}
        >×</button>
      )}
    </div>
  );
};
