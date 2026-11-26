import React, { useRef } from 'react';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  showShortcut?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search papers, notes, repos...',
  value,
  onChange,
  onSubmit,
  showShortcut = false,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke={isFocused ? 'var(--accent-secondary)' : 'var(--text-tertiary)'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          position: 'absolute',
          left: '12px',
          pointerEvents: 'none',
          transition: 'stroke var(--transition-fast)',
        }}
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px 36px 8px 36px',
          background: isFocused ? 'var(--bg-elevated)' : 'var(--bg-tertiary)',
          border: isFocused ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-sans)',
          outline: 'none',
          transition: 'all var(--transition-fast)',
          boxShadow: isFocused ? '0 0 0 3px var(--accent-primary-subtle)' : 'none',
        }}
      />
      {value ? (
        <button
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: '10px',
            background: 'var(--bg-hover)',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '12px',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
          }}
        >
          <i className="fi fi-rr-cross-small" />
        </button>
      ) : showShortcut ? (
        <span
          style={{
            position: 'absolute',
            right: '10px',
            padding: '2px 5px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xs)',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        >
          /
        </span>
      ) : null}
    </div>
  );
};

