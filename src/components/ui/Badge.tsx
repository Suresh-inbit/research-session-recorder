import React from 'react';
import type { PageType } from '../../shared/types';
import { PAGE_TYPE_COLORS } from '../../shared/constants';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: 'solid' | 'subtle';
  size?: 'sm' | 'md';
  pageType?: PageType;
}

export const Badge: React.FC<BadgeProps> = ({ children, color, variant = 'subtle', size = 'sm', pageType }) => {
  const resolvedColor = pageType ? PAGE_TYPE_COLORS[pageType] : color || 'var(--accent-primary)';

  const styles: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: size === 'sm' ? '2px 8px' : '4px 10px',
    borderRadius: 'var(--radius-full)',
    fontSize: size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)',
    fontWeight: 500, whiteSpace: 'nowrap', lineHeight: 1.4,
    background: variant === 'solid' ? resolvedColor : `${resolvedColor}18`,
    color: variant === 'solid' ? 'white' : resolvedColor,
    border: variant === 'subtle' ? `1px solid ${resolvedColor}30` : 'none',
  };

  return <span style={styles}>{children}</span>;
};
