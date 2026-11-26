import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { TextArea, Input } from '../ui/Input';
import { useQuestions, useSaveQuestion } from '../../hooks';
import { RelativeTime } from '../ui/RelativeTime';
import { tint } from '../../shared/color';

// ====== INQUIRIES & QUESTIONS TAB ======
export const QuestionsTab: React.FC = () => {
  const { data: questions, refetch } = useQuestions();
  const { save, saving } = useSaveQuestion();
  const [showEditor, setShowEditor] = useState(false);
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [qType, setQType] = useState<string>('question');

  const handleSave = async () => {
    if (!content.trim()) return;
    await save(content, qType, undefined, undefined, description.trim() ? description : undefined);
    setContent('');
    setDescription('');
    setShowEditor(false);
    setTimeout(refetch, 200);
  };

  const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
    question: { icon: 'fi fi-rr-interrogation', color: 'var(--accent-rose)', label: 'Question' },
    hypothesis: { icon: 'fi fi-rr-flask', color: 'var(--accent-primary)', label: 'Hypothesis' },
    idea: { icon: 'fi fi-rr-bulb', color: 'var(--accent-amber)', label: 'Idea' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="page-head">
        <div>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, margin: 0 }}>
            Inquiries ({questions?.length || 0})
          </h3>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            Track hypotheses, open doubts, and emergent thoughts
          </span>
        </div>
        <Button
          size="sm"
          variant="glow"
          onClick={() => setShowEditor(!showEditor)}
          icon={<span style={{ fontSize: '14px', lineHeight: 1 }}>+</span>}
        >
          New Inquiry
        </Button>
      </div>

      {showEditor && (
        <Card variant="glass" padding="16px" className="animate-scale-in">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {['question', 'hypothesis', 'idea'].map((t) => {
              const cfg = typeConfig[t];
              const isSelected = qType === t;
              return (
                <button
                  key={t}
                  onClick={() => setQType(t)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: isSelected ? `1px solid ${cfg.color}` : '1px solid var(--border-default)',
                    background: isSelected ? `${cfg.color}1e` : 'var(--bg-tertiary)',
                    color: isSelected ? cfg.color : 'var(--text-secondary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <i className={cfg.icon} />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`State your ${qType}...`}
            style={{ marginBottom: '10px' }}
          />

          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Context, background details, or validation criteria (optional)..."
            style={{ minHeight: '70px', marginBottom: '12px' }}
          />

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={handleSave} loading={saving} disabled={!content.trim()}>
              Save Inquiry
            </Button>
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {questions?.map((q, i) => {
          const cfg = typeConfig[q.type] || typeConfig.question;
          const isAnswered = q.status === 'answered';

          return (
            <div
              key={q.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 0.03}s`, animationFillMode: 'both' }}
            >
              <Card variant="glass" padding="16px" hover>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-md)',
                      background: tint(cfg.color, 12),
                      color: cfg.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '15px',
                      flexShrink: 0,
                    }}
                  >
                    <i className={cfg.icon} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: isAnswered ? 'var(--text-secondary)' : 'var(--text-primary)',
                        textDecoration: isAnswered ? 'line-through' : 'none',
                        lineHeight: 1.5,
                        fontWeight: 600,
                      }}
                    >
                      {q.content}
                    </div>

                    {q.description && (
                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-tertiary)',
                          lineHeight: 1.5,
                          marginTop: '6px',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {q.description}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                      <Badge
                        size="xs"
                        variant="dot"
                        color={q.status === 'open' ? 'var(--warning)' : q.status === 'answered' ? 'var(--success)' : 'var(--text-tertiary)'}
                      >
                        {q.status.toUpperCase()}
                      </Badge>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        <RelativeTime timestamp={q.createdAt} />
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button
                      variant={isAnswered ? 'secondary' : 'primary'}
                      size="xs"
                      onClick={() => {
                        chrome.runtime?.sendMessage?.({
                          type: 'UPDATE_QUESTION',
                          payload: { id: q.id, status: isAnswered ? 'open' : 'answered' },
                        });
                        setTimeout(refetch, 200);
                      }}
                    >
                      {isAnswered ? 'Reopen' : 'Resolve'}
                    </Button>
                    <button
                      type="button"
                      className="icon-action icon-action--danger"
                      onClick={() => {
                        chrome.runtime?.sendMessage?.({ type: 'DELETE_QUESTION', payload: { id: q.id } });
                        setTimeout(refetch, 200);
                      }}
                      title="Delete inquiry"
                      aria-label="Delete inquiry"
                    >
                      <i className="fi fi-rr-trash" />
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {(!questions || questions.length === 0) && !showEditor && (
        <EmptyState
          icon={<i className="fi fi-rr-interrogation" />}
          title="No Open Inquiries"
          description="Log hypotheses, open questions, and research ideas to validate as you explore."
          action={
            <Button size="sm" variant="glow" onClick={() => setShowEditor(true)}>
              Formulate Inquiry
            </Button>
          }
        />
      )}
    </div>
  );
};
