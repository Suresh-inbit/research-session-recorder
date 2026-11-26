import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { SearchBar } from '../ui/SearchBar';
import { useNotes, useHighlights, useQuestions, usePages } from '../../hooks';
import { RelativeTime } from '../ui/RelativeTime';
import { truncate, openUrl } from '../../shared/utils';
import Fuse from 'fuse.js';

// ====== FUZZY SEARCH TAB ======
export const SearchTab: React.FC = () => {
  const [query, setQuery] = useState('');
  const { data: notes } = useNotes();
  const { data: highlights } = useHighlights();
  const { data: questions } = useQuestions();
  const { data: pages } = usePages();

  const allItems = [
    ...(notes?.map((n) => ({ id: n.id, type: 'note' as const, title: n.content.slice(0, 100), content: n.content, url: n.url, timestamp: n.createdAt })) || []),
    ...(highlights?.map((h) => ({ id: h.id, type: 'highlight' as const, title: h.text.slice(0, 100), content: h.text, url: h.url, timestamp: h.createdAt })) || []),
    ...(questions?.map((q) => ({ id: q.id, type: 'question' as const, title: q.content.slice(0, 100), content: q.content, url: q.url, timestamp: q.createdAt })) || []),
    ...(pages?.map((p) => ({ id: p.id, type: 'page' as const, title: p.title, content: p.title + ' ' + p.url, url: p.url, timestamp: p.visitedAt })) || []),
  ];

  const fuse = new Fuse(allItems, { keys: ['title', 'content', 'url'], threshold: 0.35, includeScore: true });
  const results = query ? fuse.search(query).slice(0, 30) : [];

  const typeIcons: Record<string, string> = {
    note: 'fi fi-rr-edit',
    highlight: 'fi fi-rr-marker',
    question: 'fi fi-rr-interrogation',
    page: 'fi fi-rr-globe',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Instant search across papers, notes, quotes, hypotheses..."
        showShortcut
      />

      {query && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          Indexed Match: {results.length} results found
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {results.map(({ item }, i) => (
          <div
            key={item.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 0.02}s`, animationFillMode: 'both' }}
          >
            <Card
              hover
              padding="14px"
              variant="glass"
              onClick={() => {
                if (item.url) {
                  openUrl(item.url);
                }
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent-primary)', fontSize: '16px', marginTop: '2px' }}>
                  <i className={typeIcons[item.type] || 'fi fi-rr-box'} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {truncate(item.title, 80)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    <RelativeTime timestamp={item.timestamp} />
                  </div>
                </div>
                <Badge size="xs" mono>{item.type.toUpperCase()}</Badge>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {!query && (
        <EmptyState
          icon={<i className="fi fi-rr-search" />}
          title="Search Knowledge Corpus"
          description="Instant fuzzy lookup indexed across all notes, highlighted snippets, active inquiries, and visited repositories."
        />
      )}
    </div>
  );
};
