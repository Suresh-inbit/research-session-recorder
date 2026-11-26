import React from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'pill' | 'underline' | 'compact';
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange, variant = 'pill' }) => (
  <div className={`tabs${variant === 'compact' ? ' tabs--compact' : ''}`} role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={activeTab === tab.id}
        className="tab"
        onClick={() => onTabChange(tab.id)}
      >
        {tab.icon && <span className="tab__icon">{tab.icon}</span>}
        <span>{tab.label}</span>
        {typeof tab.count === 'number' && <span className="tab__count">{tab.count}</span>}
      </button>
    ))}
  </div>
);
