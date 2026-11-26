import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'telemetry' | 'glow';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  children,
  className,
  disabled,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    className={['btn', `btn--${variant}`, `btn--${size}`, className].filter(Boolean).join(' ')}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...props}
  >
    {loading ? (
      <span className="btn__spinner animate-spin" aria-hidden="true" />
    ) : (
      icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
    )}
    {children}
  </button>
);
