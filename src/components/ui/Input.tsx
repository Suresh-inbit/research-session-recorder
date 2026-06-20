import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, style, ...props }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && <span style={{ position: 'absolute', left: '10px', color: 'var(--text-tertiary)', display: 'flex' }}>{icon}</span>}
        <input
          style={{
            width: '100%', padding: icon ? '8px 12px 8px 34px' : '8px 12px',
            background: 'var(--bg-tertiary)', border: `1px solid ${error ? 'var(--danger)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
            fontSize: 'var(--text-base)', outline: 'none', transition: 'border-color var(--transition-fast)',
            ...style,
          }}
          onFocus={(e) => (e.target as HTMLElement).style.borderColor = 'var(--accent-primary)'}
          onBlur={(e) => (e.target as HTMLElement).style.borderColor = error ? 'var(--danger)' : 'var(--border-default)'}
          {...props}
        />
      </div>
      {error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, style, ...props }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</label>}
      <textarea
        style={{
          width: '100%', minHeight: '80px', padding: '10px 12px',
          background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
          fontSize: 'var(--text-base)', lineHeight: 1.5, resize: 'vertical', outline: 'none',
          fontFamily: 'var(--font-sans)', transition: 'border-color var(--transition-fast)',
          ...style,
        }}
        onFocus={(e) => (e.target as HTMLElement).style.borderColor = 'var(--accent-primary)'}
        onBlur={(e) => (e.target as HTMLElement).style.borderColor = 'var(--border-default)'}
        {...props}
      />
    </div>
  );
};
