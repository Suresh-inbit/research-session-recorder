import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, hint, style, onFocus, onBlur, ...props }) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
      {label && (
        <label
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              color: isFocused ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              transition: 'color var(--transition-fast)',
            }}
          >
            {icon}
          </span>
        )}
        <input
          style={{
            width: '100%',
            padding: icon ? '9px 12px 9px 36px' : '9px 12px',
            background: isFocused ? 'var(--bg-elevated)' : 'var(--bg-tertiary)',
            border: `1px solid ${error ? 'var(--danger)' : isFocused ? 'var(--accent-primary)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            transition: 'all var(--transition-fast)',
            boxShadow: isFocused ? `0 0 0 3px ${error ? 'var(--danger-subtle)' : 'var(--accent-primary-subtle)'}` : 'none',
            ...style,
          }}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
      </div>
      {error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', fontWeight: 500 }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  mono?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, mono = false, style, onFocus, onBlur, ...props }) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
      {label && (
        <label
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </label>
      )}
      <textarea
        style={{
          width: '100%',
          minHeight: '90px',
          padding: '10px 14px',
          background: isFocused ? 'var(--bg-elevated)' : 'var(--bg-tertiary)',
          border: `1px solid ${isFocused ? 'var(--accent-primary)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          fontSize: 'var(--text-sm)',
          lineHeight: 1.6,
          resize: 'vertical',
          outline: 'none',
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
          transition: 'all var(--transition-fast)',
          boxShadow: isFocused ? '0 0 0 3px var(--accent-primary-subtle)' : 'none',
          ...style,
        }}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
    </div>
  );
};

