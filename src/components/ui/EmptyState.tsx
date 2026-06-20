import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = '📭', title, description, action }) => {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-10) var(--space-6)', textAlign: 'center', gap: 'var(--space-3)',
    }}>
      <span style={{ fontSize: '36px', marginBottom: 'var(--space-2)' }}>{icon}</span>
      <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
      {description && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', maxWidth: '280px', lineHeight: 1.5 }}>{description}</p>}
      {action && <div style={{ marginTop: 'var(--space-3)' }}>{action}</div>}
    </div>
  );
};
