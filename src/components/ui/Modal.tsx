import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, width = '420px' }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 10000,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width, maxWidth: '90vw', maxHeight: '80vh', background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          animation: 'scaleIn 0.2s ease',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-subtle)',
        }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-tertiary)',
            fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '2px',
          }}>×</button>
        </div>
        <div style={{ padding: 'var(--space-5)', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
};
