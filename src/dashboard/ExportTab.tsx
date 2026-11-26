import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { sendMessage } from '../shared/utils';
import { exportService } from '../services/export-service';
import type { ExportData } from '../shared/messages';

// ====== EXPORT HUB ======
export const ExportTab: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exports fetch the complete dataset on demand (the list views are capped).
  const run = (fn: (data: ExportData) => void) => async () => {
    setBusy(true);
    setError(null);
    try {
      fn(await sendMessage<ExportData>({ type: 'GET_EXPORT_DATA' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  const exportMarkdown = run((d) => exportService.exportToMarkdown(d.sessions, d.notes, d.highlights, d.questions));
  const exportJSON = run((d) => exportService.exportToJSON(d));
  const exportCSV = run((d) => exportService.exportToCSV(d.notes, d.highlights, d.questions));
  const exportObsidian = run((d) => exportService.exportToObsidian(d.notes, d.highlights, d.questions));

  const formats = [
    { label: 'Markdown Format', desc: 'Standard human-readable document (.md)', icon: <i className="fi fi-rr-document" />, fn: exportMarkdown },
    { label: 'Obsidian Vault', desc: 'With wikilinks [[Page]] & frontmatter', icon: <i className="fi fi-rr-magic-wand" />, fn: exportObsidian },
    { label: 'Raw JSON Payload', desc: 'Full entity schema dump with relationships', icon: <i className="fi fi-rr-box" />, fn: exportJSON },
    { label: 'CSV Spreadsheets', desc: 'Tabular notes, quotes, and inquiry records', icon: <i className="fi fi-rr-chart-pie-alt" />, fn: exportCSV },
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, margin: 0 }}>Export & Interoperability Hub</h2>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
          Port your captured knowledge into your local notes, Obsidian, or data pipeline
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        {formats.map((f) => (
          <Card key={f.label} hover onClick={f.fn} padding="22px" variant="glass" glow>
            <span style={{ fontSize: '28px', color: 'var(--accent-primary)', display: 'block', marginBottom: '10px' }}>
              {f.icon}
            </span>
            <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 700, margin: '0 0 4px 0' }}>{f.label}</h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.4 }}>{f.desc}</p>
          </Card>
        ))}
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '12px 16px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-xs)',
          color: error ? 'var(--danger, #f87171)' : 'var(--text-tertiary)',
        }}
      >
        {error ?? (busy ? 'Preparing export…' : 'Exports include everything stored locally, not just the recent items shown in the lists.')}
      </div>
    </div>
  );
};
