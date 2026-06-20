import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', icon, loading, children, style, ...props
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    border: 'none', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-sans)',
    fontWeight: 500, cursor: props.disabled || loading ? 'default' : 'pointer',
    transition: 'all var(--transition-fast)', opacity: props.disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent-primary)', color: 'white' },
    secondary: { background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)' },
    danger: { background: 'var(--danger-subtle)', color: 'var(--danger)' },
  };

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '4px 10px', fontSize: 'var(--text-sm)' },
    md: { padding: '7px 14px', fontSize: 'var(--text-base)' },
    lg: { padding: '10px 20px', fontSize: 'var(--text-md)' },
  };

  return (
    <button
      style={{ ...baseStyle, ...variants[variant], ...sizes[size], ...style }}
      onMouseEnter={(e) => {
        if (variant === 'primary') (e.target as HTMLElement).style.background = 'var(--accent-primary-hover)';
        else if (variant === 'ghost') (e.target as HTMLElement).style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.background = variants[variant].background || '';
      }}
      {...props}
    >
      {loading ? <span className="animate-spin" style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} /> : icon}
      {children}
    </button>
  );
};
