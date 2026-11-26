import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatDuration, openUrl } from '../shared/utils';
import { PAGE_TYPE_LABELS, PAGE_TYPE_COLORS, PAGE_TYPE_ICONS } from '../shared/constants';
import type { DashboardStats } from '../shared/messages';
import type { Page, PageType } from '../shared/types';
import { ActivityChart, bucketPoints } from './ActivityChart';

type Period = 'week' | 'month' | 'all';

interface OverviewTabProps {
  stats: DashboardStats | null;
  loading: boolean;
  period: Period;
  onPeriodChange: (p: Period) => void;
}

const PERIODS: { id: Period; label: string; chartSub: string }[] = [
  { id: 'week', label: 'Week', chartSub: 'Research hours per day, last 7 days' },
  { id: 'month', label: 'Month', chartSub: 'Research hours per day, last 30 days' },
  { id: 'all', label: 'All Time', chartSub: 'Research hours per week, last 12 months' },
];

export const OverviewTab: React.FC<OverviewTabProps> = ({ stats, loading, period, onPeriodChange }) => {
  if (loading || !stats) {
    return (
      <div className="grid-auto" style={{ ['--min' as string]: '200px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="shimmer-loading skeleton" style={{ height: '110px' }} />
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      label: 'Research Dwell',
      value: `${stats.totalResearchHours}h`,
      sub: `${stats.totalSessions} ${stats.totalSessions === 1 ? 'session' : 'sessions'}`,
      icon: 'fi fi-rr-stopwatch',
      color: 'var(--accent-secondary)',
      bgSubtle: 'var(--accent-secondary-subtle)',
    },
    {
      label: 'Captured Notes',
      value: stats.totalNotes,
      sub: 'Synthesized insights',
      icon: 'fi fi-rr-edit',
      color: 'var(--accent-amber)',
      bgSubtle: 'var(--warning-subtle)',
    },
    {
      label: 'Highlights',
      value: stats.totalHighlights,
      sub: 'Saved passages',
      icon: 'fi fi-rr-marker',
      color: 'var(--color-paper)',
      bgSubtle: 'var(--accent-primary-subtle)',
    },
    {
      label: 'Pages Traversed',
      value: stats.totalPages,
      sub: 'Papers & sources',
      icon: 'fi fi-rr-browser',
      color: 'var(--success)',
      bgSubtle: 'var(--success-subtle)',
    },
    {
      label: 'Inquiry Streak',
      value: `${stats.currentStreak}d`,
      sub: 'Consecutive days',
      icon: 'fi fi-rr-flame',
      color: 'var(--danger)',
      bgSubtle: 'var(--danger-subtle)',
    },
  ];

  // The selected period drives the chart too (it used to be fixed at 7 days).
  const series = period === 'week' ? stats.weeklyData : period === 'month' ? stats.monthlyData : bucketPoints(stats.monthlyData, 7);
  const chartSub = PERIODS.find((p) => p.id === period)?.chartSub ?? '';
  const totalCategorySecs = stats.categoryBreakdown.reduce((a, b) => a + b.time, 0) || 1;

  return (
    <div className="stack stack--lg animate-fade-in">
      <div className="page-head">
        <div>
          <h2 className="page-head__title">Overview</h2>
          <p className="page-head__sub">Analysis of your investigation patterns and knowledge artifacts</p>
        </div>

        <div className="segmented" role="group" aria-label="Time period">
          {PERIODS.map((p) => (
            <button key={p.id} type="button" aria-pressed={period === p.id} onClick={() => onPeriodChange(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-auto" style={{ ['--min' as string]: '200px', ['--gap' as string]: '14px' }}>
        {metricCards.map((m) => (
          <Card key={m.label} padding="0" hover glow>
            <div className="metric">
              <div>
                <div className="metric__label">{m.label}</div>
                <div className="metric__value" style={{ color: m.color }}>{m.value}</div>
                <div className="metric__sub">{m.sub}</div>
              </div>
              <div className="metric__icon" style={{ background: m.bgSubtle, color: m.color }}>
                <i className={m.icon} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid-auto" style={{ ['--min' as string]: '420px', ['--gap' as string]: '18px' }}>
        <Card padding="22px" variant="glass" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="section-head">
            <div>
              <h3 className="section-head__title">Activity Trend</h3>
              <span className="section-head__sub">{chartSub}</span>
            </div>
          </div>
          <ActivityChart data={series} />
        </Card>

        <Card padding="22px" variant="glass">
          <div className="section-head">
            <div>
              <h3 className="section-head__title">Domain Spectrum</h3>
              <span className="section-head__sub">Dwell time distribution by resource type</span>
            </div>
            <span className="meta-mono">
              {stats.categoryBreakdown.length} {stats.categoryBreakdown.length === 1 ? 'category' : 'categories'}
            </span>
          </div>

          <div className="stack stack--sm">
            {stats.categoryBreakdown.map((cat) => {
              const type = cat.type as PageType;
              const color = PAGE_TYPE_COLORS[type] || 'var(--text-tertiary)';
              const percent = Math.round((cat.time / totalCategorySecs) * 100);
              return (
                <div key={cat.type} className="row-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{ color, fontSize: '14px', display: 'inline-flex' }}>
                        <i className={PAGE_TYPE_ICONS[type] || 'fi fi-rr-globe'} />
                      </span>
                      <span className="row-item__title">{PAGE_TYPE_LABELS[type] || cat.type}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline', flexShrink: 0 }}>
                      <span className="meta-mono">{cat.count} {cat.count === 1 ? 'page' : 'pages'}</span>
                      <span className="meta-mono" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                        {formatDuration(cat.time)}
                      </span>
                    </div>
                  </div>
                  <div className="progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${PAGE_TYPE_LABELS[type] || cat.type} share of time`}>
                    <div className="progress__bar" style={{ width: `${percent}%`, background: color }} />
                  </div>
                </div>
              );
            })}

            {stats.categoryBreakdown.length === 0 && <div className="empty-hint--block">No category data recorded yet</div>}
          </div>
        </Card>
      </div>

      <div className="grid-auto" style={{ ['--min' as string]: '320px', ['--gap' as string]: '18px' }}>
        <Card padding="20px">
          <div className="section-head section-head--icon">
            <span className="section-head__icon" style={{ color: 'var(--accent-amber)' }}>
              <i className="fi fi-rr-tags" />
            </span>
            <h3 className="section-head__title">Top Topics</h3>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {stats.topTopics.map((t) => (
              <Badge key={t.name} size="sm" color="var(--accent-primary)">
                {t.name} · <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.8 }}>{t.count}</span>
              </Badge>
            ))}
            {stats.topTopics.length === 0 && <span className="empty-hint">No topics extracted yet</span>}
          </div>
        </Card>

        <TopPages title="Top Papers" icon="fi fi-rr-document" color="var(--color-paper)" pages={stats.topPapers} empty="No research papers visited" />
        <TopPages title="Top Repositories" icon="fi fi-rr-code-branch" color="var(--color-repository)" pages={stats.topRepos} empty="No repositories visited" />
      </div>
    </div>
  );
};

const TopPages: React.FC<{ title: string; icon: string; color: string; pages: Page[]; empty: string }> = ({
  title,
  icon,
  color,
  pages,
  empty,
}) => (
  <Card padding="20px">
    <div className="section-head section-head--icon">
      <span className="section-head__icon" style={{ color }}>
        <i className={icon} />
      </span>
      <h3 className="section-head__title">{title}</h3>
    </div>
    <div className="stack stack--sm">
      {pages.map((p) => (
        <div key={p.id} className="row-item">
          <div className="row-item__title truncate">
            <a
              href={p.url}
              onClick={(e) => {
                e.preventDefault();
                openUrl(p.url);
              }}
              title={p.title}
              className="truncate"
            >
              {p.title}
            </a>
          </div>
          <div className="row-item__meta">
            <Badge pageType={p.type} size="xs">{PAGE_TYPE_LABELS[p.type] || p.type}</Badge>
            <span className="meta-mono">{formatDuration(p.activeTimeSeconds)}</span>
          </div>
        </div>
      ))}
      {pages.length === 0 && <span className="empty-hint">{empty}</span>}
    </div>
  </Card>
);
