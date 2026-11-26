import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { TextArea, Input } from '../ui/Input';
import { useNotes, useSaveNote } from '../../hooks';
import { RelativeTime } from '../ui/RelativeTime';
import { truncate, openUrl } from '../../shared/utils';
import type { Note } from '../../shared/types';

// ====== NOTES TAB ======
export const NotesTab: React.FC = () => {
  const { data: notes, refetch } = useNotes();
  const { save, saving } = useSaveNote();
  const [showEditor, setShowEditor] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [tagInput, setTagInput] = useState('');

  const handleSave = async () => {
    if (!newNote.trim()) return;
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    await save(newNote, undefined, undefined, tags.length ? tags : undefined);
    setNewNote('');
    setTagInput('');
    setShowEditor(false);
    setTimeout(refetch, 200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="page-head">
        <div>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, margin: 0 }}>
            Notes ({notes?.length || 0})
          </h3>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            Captured thoughts, analysis, and paper summaries
          </span>
        </div>
        <Button
          size="sm"
          variant="glow"
          onClick={() => setShowEditor(!showEditor)}
          icon={<span style={{ fontSize: '14px', lineHeight: 1 }}>+</span>}
        >
          New Note
        </Button>
      </div>

      {showEditor && (
        <Card variant="glass" padding="16px" className="animate-scale-in">
          <TextArea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Document insights, findings, or code annotations..."
            style={{ marginBottom: '10px' }}
          />
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Tags (comma-separated, e.g. transformer, attention, memory)"
            style={{ marginBottom: '12px' }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowEditor(false);
                setNewNote('');
                setTagInput('');
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleSave}
              loading={saving}
              disabled={!newNote.trim()}
            >
              Save Note
            </Button>
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {notes?.map((note, i) => (
          <div
            key={note.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 0.03}s`, animationFillMode: 'both' }}
          >
            <NoteItem
              note={note}
              onDelete={() => {
                chrome.runtime?.sendMessage?.({ type: 'DELETE_NOTE', payload: { id: note.id } });
                setTimeout(refetch, 200);
              }}
            />
          </div>
        ))}
      </div>

      {(!notes || notes.length === 0) && !showEditor && (
        <EmptyState
          icon={<i className="fi fi-rr-edit" />}
          title="No Research Notes Yet"
          description="Synthesize key findings while reading papers or repos. Press Ctrl+Shift+N on any page to open quick-capture."
          action={
            <Button size="sm" variant="glow" onClick={() => setShowEditor(true)}>
              Create First Note
            </Button>
          }
        />
      )}
    </div>
  );
};

export const NoteItem: React.FC<{ note: Note; onDelete: () => void }> = ({ note, onDelete }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(note.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card variant="glass" padding="16px" hover>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
        {note.content}
      </div>

      {note.tags && note.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap' }}>
          {note.tags.map((t) => (
            <Badge key={t} size="xs" color="var(--accent-secondary)">
              #{t}
            </Badge>
          ))}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          {note.pageTitle && (
            <a
              href={note.url}
              onClick={(e) => {
                e.preventDefault();
                if (note.url) {
                  openUrl(note.url);
                }
              }}
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--accent-secondary)',
                textDecoration: 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '240px',
                fontWeight: 500,
              }}
              title={note.pageTitle}
            >
              <i className="fi fi-rr-document" style={{ marginRight: 4 }} />{truncate(note.pageTitle, 35)}
            </a>
          )}
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            <RelativeTime timestamp={note.createdAt} />
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            className={`icon-action${copied ? ' icon-action--success' : ''}`}
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Copy note'}
            aria-label={copied ? 'Copied' : 'Copy note'}
          >
            <i className={copied ? 'fi fi-rr-check' : 'fi fi-rr-copy'} />
          </button>
          <button type="button" className="icon-action icon-action--danger" onClick={onDelete} title="Delete note" aria-label="Delete note">
            <i className="fi fi-rr-trash" />
          </button>
        </div>
      </div>
    </Card>
  );
};
