import React, { useState, useRef, useEffect } from 'react';
import { useDashboardStats, useReport, useTheme, useNotes, useHighlights, useQuestions, usePages, useSessions } from '../hooks';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDuration, formatDate, downloadFile, truncate } from '../shared/utils';
import { PAGE_TYPE_LABELS, PAGE_TYPE_COLORS } from '../shared/constants';
import type { DashboardStats } from '../shared/messages';
import type { Page } from '../shared/types';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'report', label: 'Daily Report', icon: '📋' },
  { id: 'export', label: 'Export', icon: '📦' },
];

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const { theme, toggle } = useTheme();
  const { data: stats, loading } = useDashboardStats(period);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Nav */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 32px', borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🔬</span>
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>Research Dashboard</h1>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>Research Session Recorder</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
            {(['week', 'month', 'all'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '4px 12px', border: 'none', borderRadius: 'var(--radius-sm)',
                background: period === p ? 'var(--accent-primary)' : 'transparent',
                color: period === p ? 'white' : 'var(--text-secondary)',
                fontSize: 'var(--text-sm)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}>
                {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px' }}>
        {activeTab === 'overview' && <OverviewTab stats={stats} loading={loading} />}
        {activeTab === 'report' && <ReportTab />}
        {activeTab === 'export' && <ExportTab />}
      </main>
    </div>
  );
};

// ====== OVERVIEW ======
const OverviewTab: React.FC<{ stats: DashboardStats | null; loading: boolean }> = ({ stats, loading }) => {
  if (loading || !stats) {
    return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      {[1,2,3,4].map(i => <div key={i} className="shimmer-loading" style={{ height: '100px', borderRadius: 'var(--radius-lg)' }} />)}
    </div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      {/* Hero Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
        {[
          { label: 'Research Hours', value: `${stats.totalResearchHours}h`, icon: '⏱️', color: 'var(--accent-primary)' },
          { label: 'Sessions', value: stats.totalSessions, icon: '🔬', color: 'var(--accent-secondary)' },
          { label: 'Notes', value: stats.totalNotes, icon: '📝', color: 'var(--color-blog)' },
          { label: 'Highlights', value: stats.totalHighlights, icon: '🖍️', color: 'var(--color-paper)' },
          { label: 'Streak', value: `${stats.currentStreak}d`, icon: '🔥', color: 'var(--danger)' },
        ].map((s) => (
          <Card key={s.label} padding="16px 20px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
              <span style={{ fontSize: '24px' }}>{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Weekly Activity Chart */}
        <Card padding="20px">
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: '16px' }}>Activity Trend</h3>
          <ActivityChart data={stats.weeklyData} />
        </Card>

        {/* Category Breakdown */}
        <Card padding="20px">
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: '16px' }}>Categories</h3>
          {stats.categoryBreakdown.map((cat) => (
            <div key={cat.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: PAGE_TYPE_COLORS[cat.type as keyof typeof PAGE_TYPE_COLORS] || 'var(--text-tertiary)' }} />
                <span style={{ fontSize: 'var(--text-sm)', textTransform: 'capitalize' }}>{cat.type}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                <span>{cat.count} pages</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{formatDuration(cat.time)}</span>
              </div>
            </div>
          ))}
          {stats.categoryBreakdown.length === 0 && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', padding: '20px 0', textAlign: 'center' }}>No data yet</div>}
        </Card>
      </div>

      {/* Topics + Papers + Repos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <Card padding="20px">
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: '12px' }}>🏷️ Top Topics</h3>
          {stats.topTopics.map((t, i) => (
            <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ fontSize: 'var(--text-sm)', textTransform: 'capitalize' }}>{t.name}</span>
              <Badge size="sm" color="var(--accent-primary)">{t.count}</Badge>
            </div>
          ))}
          {stats.topTopics.length === 0 && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No topics yet</div>}
        </Card>

        <Card padding="20px">
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: '12px' }}>📄 Top Papers</h3>
          {stats.topPapers.map((p) => (
            <div key={p.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{formatDuration(p.activeTimeSeconds)}</div>
            </div>
          ))}
          {stats.topPapers.length === 0 && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No papers yet</div>}
        </Card>

        <Card padding="20px">
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: '12px' }}>💻 Top Repos</h3>
          {stats.topRepos.map((p) => (
            <div key={p.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{formatDuration(p.activeTimeSeconds)}</div>
            </div>
          ))}
          {stats.topRepos.length === 0 && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No repos yet</div>}
        </Card>
      </div>
    </div>
  );
};

// ====== ACTIVITY CHART (Canvas) ======
const ActivityChart: React.FC<{ data: { date: string; hours: number; pages: number }[] }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const maxHours = Math.max(...data.map(d => d.hours), 1);
    const barWidth = (w - 40) / data.length - 4;
    const chartHeight = h - 30;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-subtle').trim() || 'rgba(255,255,255,0.06)';
    for (let i = 0; i <= 4; i++) {
      const y = chartHeight * (1 - i / 4);
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Bars
    data.forEach((d, i) => {
      const barH = (d.hours / maxHours) * (chartHeight - 10);
      const x = 35 + i * ((w - 40) / data.length);
      const y = chartHeight - barH;

      // Gradient bar
      const grad = ctx.createLinearGradient(x, y, x, chartHeight);
      grad.addColorStop(0, '#7c5cfc');
      grad.addColorStop(1, '#7c5cfc40');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, 3);
      ctx.fill();

      // Date label
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#6b7084';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.date.slice(5), x + barWidth / 2, h - 4);
    });
  }, [data]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '200px' }} />;
};

// ====== DAILY REPORT ======
const ReportTab: React.FC = () => {
  const { data: report, loading } = useReport();

  if (loading) return <div className="shimmer-loading" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />;
  if (!report) return <EmptyState icon="📋" title="No Report Available" description="Reports are generated from your daily research activity." />;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '700px' }}>
      <Card padding="24px" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Daily Report</h2>
          <Badge size="md" color="var(--accent-primary)">{report.date}</Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Research Time', value: formatDuration(report.totalResearchTime) },
            { label: 'Papers', value: report.paperCount },
            { label: 'Repos', value: report.repoCount },
            { label: 'Notes', value: report.noteCount },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--accent-primary)' }}>{s.value}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {report.topTopics.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '8px' }}>Top Topics</h4>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {report.topTopics.map(t => <Badge key={t} size="sm">{t}</Badge>)}
            </div>
          </div>
        )}

        {report.questions.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '8px' }}>Open Questions</h4>
            {report.questions.map((q, i) => (
              <div key={i} style={{ padding: '6px 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>• {q}</div>
            ))}
          </div>
        )}

        {report.actionItems.length > 0 && (
          <div>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '8px' }}>Action Items</h4>
            {report.actionItems.map((a, i) => (
              <div key={i} style={{ padding: '6px 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>☐ {a}</div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// ====== EXPORT ======
const ExportTab: React.FC = () => {
  const { data: notes } = useNotes();
  const { data: highlights } = useHighlights();
  const { data: questions } = useQuestions();
  const { data: pages } = usePages();
  const { data: sessions } = useSessions();

  const exportMarkdown = () => {
    let md = `# Research Session Export\n\n_Exported on ${new Date().toLocaleDateString()}_\n\n`;
    if (sessions?.length) {
      md += `## Sessions (${sessions.length})\n\n`;
      sessions.forEach(s => {
        md += `### Session — ${new Date(s.startTime).toLocaleString()}\n- Duration: ${formatDuration(s.duration)}\n- Pages: ${s.pageCount}\n\n`;
      });
    }
    if (notes?.length) {
      md += `## Notes (${notes.length})\n\n`;
      notes.forEach(n => { md += `- ${n.content}\n  _${n.pageTitle || ''} — ${new Date(n.createdAt).toLocaleString()}_\n\n`; });
    }
    if (highlights?.length) {
      md += `## Highlights (${highlights.length})\n\n`;
      highlights.forEach(h => { md += `> ${h.text}\n> — [${h.pageTitle}](${h.url})\n\n`; });
    }
    if (questions?.length) {
      md += `## Questions (${questions.length})\n\n`;
      questions.forEach(q => { md += `- **[${q.type}]** ${q.content} _(${q.status})_\n`; });
    }
    downloadFile(md, `research-export-${formatDate(Date.now())}.md`, 'text/markdown');
  };

  const exportJSON = () => {
    const data = { sessions, notes, highlights, questions, pages, exportedAt: new Date().toISOString() };
    downloadFile(JSON.stringify(data, null, 2), `research-export-${formatDate(Date.now())}.json`, 'application/json');
  };

  const exportCSV = () => {
    let csv = 'Type,Content,URL,Timestamp\n';
    notes?.forEach(n => csv += `note,"${n.content.replace(/"/g, '""')}","${n.url || ''}",${new Date(n.createdAt).toISOString()}\n`);
    highlights?.forEach(h => csv += `highlight,"${h.text.replace(/"/g, '""')}","${h.url}",${new Date(h.createdAt).toISOString()}\n`);
    questions?.forEach(q => csv += `${q.type},"${q.content.replace(/"/g, '""')}","${q.url || ''}",${new Date(q.createdAt).toISOString()}\n`);
    downloadFile(csv, `research-export-${formatDate(Date.now())}.csv`, 'text/csv');
  };

  const exportObsidian = () => {
    let md = `---\ntags: [research, export]\ndate: ${formatDate(Date.now())}\n---\n\n# Research Export\n\n`;
    notes?.forEach(n => { md += `## Note\n${n.content}\n\n${n.pageTitle ? `Source: [[${n.pageTitle}]](${n.url})\n` : ''}\n`; });
    highlights?.forEach(h => { md += `## Highlight\n> ${h.text}\n\nSource: [[${h.pageTitle}]](${h.url})\n\n`; });
    questions?.forEach(q => { md += `## ${q.type.charAt(0).toUpperCase() + q.type.slice(1)}\n${q.content}\nStatus: ${q.status}\n\n`; });
    downloadFile(md, `research-export-${formatDate(Date.now())}-obsidian.md`, 'text/markdown');
  };

  const formats = [
    { label: 'Markdown', desc: 'Human-readable document', icon: '📄', fn: exportMarkdown },
    { label: 'JSON', desc: 'Full data export', icon: '📦', fn: exportJSON },
    { label: 'CSV', desc: 'Spreadsheet compatible', icon: '📊', fn: exportCSV },
    { label: 'Obsidian', desc: 'With wikilinks & frontmatter', icon: '🔮', fn: exportObsidian },
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px' }}>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: '16px' }}>Export Data</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {formats.map(f => (
          <Card key={f.label} hover onClick={f.fn} padding="20px" style={{ cursor: 'pointer' }}>
            <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>{f.icon}</span>
            <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: '4px' }}>{f.label}</h4>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{f.desc}</p>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: '16px', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
        📊 Data: {notes?.length || 0} notes, {highlights?.length || 0} highlights, {questions?.length || 0} questions, {pages?.length || 0} pages
      </div>
    </div>
  );
};
