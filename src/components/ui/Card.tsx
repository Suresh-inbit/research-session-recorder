import React from 'react';

interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  onClick?: () => void;
  padding?: string;
  variant?: 'default' | 'glass' | 'elevated' | 'instrument';
  glow?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  onClick,
  padding = 'var(--space-4)',
  variant = 'default',
  glow = false,
  style,
  className,
}) => {
  const classes = [
    'card',
    variant !== 'default' && `card--${variant}`,
    hover && 'card--hover',
    hover && glow && 'card--glow',
    onClick && 'card--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={{ padding, ...style }}
      onClick={onClick}
      // Clickable cards must be reachable and operable from the keyboard too.
      {...(onClick && {
        role: 'button',
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        },
      })}
    >
      {children}
    </div>
  );
};
