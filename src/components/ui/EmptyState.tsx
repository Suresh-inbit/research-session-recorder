import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <i className="fi fi-rr-box"></i>,
  title,
  description,
  action,
}) => {
  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-10) var(--space-6)',
        textAlign: 'center',
        gap: 'var(--space-3)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: 'var(--accent-primary)',
          boxShadow: '0 0 20px var(--accent-primary-subtle)',
          marginBottom: 'var(--space-2)',
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: 'var(--text-md)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          margin: 0,
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-tertiary)',
            maxWidth: '320px',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 'var(--space-3)' }}>{action}</div>}
    </div>
  );
};

