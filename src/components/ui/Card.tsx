import React from 'react';

interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  onClick?: () => void;
  padding?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, hover = false, onClick, padding = 'var(--space-4)', style, className }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered && hover ? 'var(--bg-hover)' : 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding,
        transition: 'all var(--transition-fast)',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: isHovered && hover ? 'var(--shadow-md)' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
