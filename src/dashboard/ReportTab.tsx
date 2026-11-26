import React from 'react';
import { useReport } from '../hooks';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDuration } from '../shared/utils';

// ====== DAILY BRIEF (REPORT) ======
export const ReportTab: React.FC = () => {
  const { data: report, loading } = useReport();

  if (loading) return <div className="shimmer-loading skeleton" style={{ height: '320px' }} />;
  if (!report) {
    return (
      <EmptyState
        icon={<i className="fi fi-rr-clipboard-list" />}
        title="No Daily Brief Recorded"
        description="Daily summaries synthesize your active browsing trails, highlights, questions, and action items."
      />
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Card padding="28px" variant="glass">
        <div className="page-head" style={{ marginBottom: '24px' }}>
          <div>
            <h2 className="page-head__title">Daily Investigation Brief</h2>
            <span className="section-head__sub">Synthesized research report</span>
          </div>
          <Badge size="md" mono color="var(--accent-primary)">{report.date}</Badge>
        </div>

        <div className="grid-auto" style={{ ['--min' as string]: '130px', ['--gap' as string]: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Active Dwell', value: formatDuration(report.totalResearchTime), color: 'var(--accent-secondary)' },
            { label: 'Papers', value: report.paperCount, color: 'var(--color-paper)' },
            { label: 'Repositories', value: report.repoCount, color: 'var(--color-repository)' },
            { label: 'Notes', value: report.noteCount, color: 'var(--accent-amber)' },
          ].map((s) => (
            <div key={s.label} className="stat-tile" style={{ padding: '14px 10px' }}>
              <div className="stat-tile__value" style={{ color: s.color, fontSize: 'var(--text-xl)' }}>{s.value}</div>
              <div className="stat-tile__label">{s.label}</div>
            </div>
          ))}
        </div>

        {report.topTopics.length > 0 && (
          <section style={{ marginBottom: '20px' }}>
            <h4 className="eyebrow" style={{ marginBottom: '8px' }}>Investigated Topics</h4>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {report.topTopics.map((t) => (
                <Badge key={t} size="sm">{t}</Badge>
              ))}
            </div>
          </section>
        )}

        {report.questions.length > 0 && (
          <section style={{ marginBottom: '20px' }}>
            <h4 className="eyebrow" style={{ marginBottom: '8px' }}>Open Research Inquiries</h4>
            <ul className="stack stack--sm" style={{ listStyle: 'none' }}>
              {report.questions.map((q, i) => (
                <li key={i} className="row-item" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: 'var(--text-sm)' }}>
                  <i className="fi fi-rr-interrogation" style={{ color: 'var(--accent-rose)', marginTop: 3 }} aria-hidden="true" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {report.actionItems.length > 0 && (
          <section>
            <h4 className="eyebrow" style={{ marginBottom: '8px' }}>Action Items</h4>
            <ul className="stack stack--sm" style={{ listStyle: 'none' }}>
              {report.actionItems.map((a, i) => (
                <li key={i} className="row-item" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: 'var(--text-sm)' }}>
                  <i className="fi fi-rr-square" style={{ color: 'var(--text-tertiary)', marginTop: 3 }} aria-hidden="true" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Card>
    </div>
  );
};
