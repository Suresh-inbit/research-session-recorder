import React from 'react';
import type { PageType } from '../../shared/types';
import { PAGE_TYPE_COLORS } from '../../shared/constants';
import { tint } from '../../shared/color';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: 'solid' | 'subtle' | 'outline' | 'dot';
  size?: 'xs' | 'sm' | 'md';
  pageType?: PageType;
  mono?: boolean;
  dotPulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  color,
  variant = 'subtle',
  size = 'sm',
  pageType,
  mono = false,
  dotPulse = false,
}) => {
  const resolvedColor = pageType ? PAGE_TYPE_COLORS[pageType] : color || 'var(--accent-primary)';

  const getPadding = () => {
    if (size === 'xs') return '1px 6px';
    if (size === 'md') return '4px 12px';
    return '2.5px 8px';
  };

  const getFontSize = () => {
    if (size === 'xs') return '10px';
    if (size === 'md') return 'var(--text-sm)';
    return 'var(--text-xs)';
  };

  const getBackground = () => {
    if (variant === 'solid') return resolvedColor;
    if (variant === 'outline') return 'transparent';
    return tint(resolvedColor, 12);
  };

  const getBorder = () => {
    if (variant === 'outline') return `1px solid ${resolvedColor}`;
    if (variant === 'solid') return 'none';
    return `1px solid ${tint(resolvedColor, 28)}`;
  };

  const getTextColor = () => {
    if (variant === 'solid') return '#ffffff';
    return resolvedColor;
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: getPadding(),
        borderRadius: 'var(--radius-full)',
        fontSize: getFontSize(),
        fontWeight: 600,
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
        background: getBackground(),
        color: getTextColor(),
        border: getBorder(),
        letterSpacing: mono ? '-0.02em' : '0.01em',
      }}
    >
      {variant === 'dot' && (
        <span
          className={dotPulse ? 'animate-breathe' : undefined}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: resolvedColor,
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </span>
  );
};

