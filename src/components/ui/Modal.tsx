import React, { useEffect, useId, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = '460px',
}) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Move focus into the dialog when it opens and give it back to the trigger when it closes.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previous?.focus?.();
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--scrim)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="animate-scale-in"
        style={{
          outline: 'none',
          width,
          maxWidth: '94vw',
          maxHeight: '85vh',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg), 0 0 30px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-tertiary)',
          }}
        >
          <h3
            id={titleId}
            style={{
              fontSize: 'var(--text-md)',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              margin: 0,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="icon-btn icon-btn--bare" style={{ borderRadius: 'var(--radius-full)', width: 28, height: 28 }}>
            <i className="fi fi-rr-cross-small" />
          </button>
        </div>
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

