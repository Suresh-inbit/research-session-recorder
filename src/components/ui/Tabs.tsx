import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div style={{
      display: 'flex', gap: '2px', padding: '3px',
      background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
      overflow: 'auto', flexShrink: 0,
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: 1, padding: '6px 10px', border: 'none',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
            color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontSize: 'var(--text-sm)', fontWeight: activeTab === tab.id ? 600 : 400,
            fontFamily: 'var(--font-sans)', cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          }}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
};
