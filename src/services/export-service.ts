// ============================================================
// Export Service
// ============================================================

import type { Session, Note, Highlight, Question, Page } from '../shared/types';
import { formatDuration, formatDate, downloadFile } from '../shared/utils';

/**
 * Quote a CSV cell. Cells starting with = + - @ (or tab/CR) are prefixed with a quote so
 * spreadsheet apps treat them as text instead of executing them as formulas.
 */
export function csvCell(value: string | number | undefined | null): string {
  let text = value === undefined || value === null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** Make a page title safe to use inside an Obsidian [[wikilink]]. */
export function wikiLink(title: string | undefined, fallback = 'Untitled'): string {
  const cleaned = (title ?? '').replace(/[[\]|#^\\/:]/g, ' ').replace(/\s+/g, ' ').trim();
  return `[[${cleaned || fallback}]]`;
}

/** Escape characters that would break a Markdown link label. */
export function mdLabel(text: string): string {
  return text.replace(/[[\]]/g, '\\$&');
}

/** Wrap a URL for Markdown link syntax (parentheses would end the link early). */
export function mdUrl(url: string | undefined): string {
  return (url ?? '').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\s/g, '%20');
}

export const exportService = {
  exportToMarkdown(sessions: Session[], notes: Note[], highlights: Highlight[], questions: Question[]) {
    let md = `# Research Session Export\n\n_Exported on ${new Date().toLocaleDateString()}_\n\n`;
    
    if (sessions?.length) {
      md += `## Sessions (${sessions.length})\n\n`;
      sessions.forEach(s => {
        md += `### Session — ${new Date(s.startTime).toLocaleString()}\n`;
        md += `- **Duration**: ${formatDuration(s.duration)}\n`;
        md += `- **Pages Visited**: ${s.pageCount}\n`;
        md += `- **Notes Created**: ${s.noteCount}\n`;
        md += `- **Highlights Saved**: ${s.highlightCount}\n`;
        md += `- **Questions Raised**: ${s.questionCount}\n\n`;
      });
    }

    if (notes?.length) {
      md += `## Notes (${notes.length})\n\n`;
      notes.forEach(n => {
        md += `### Note\n${n.content}\n\n`;
        if (n.pageTitle) md += `* **Source**: [${mdLabel(n.pageTitle)}](${mdUrl(n.url)})\n`;
        md += `* **Created**: ${new Date(n.createdAt).toLocaleString()}\n`;
        if (n.tags.length) md += `* **Tags**: ${n.tags.join(', ')}\n`;
        md += '\n---\n\n';
      });
    }

    if (highlights?.length) {
      md += `## Highlights (${highlights.length})\n\n`;
      highlights.forEach(h => {
        md += `> ${h.text}\n\n`;
        md += `— From [${mdLabel(h.pageTitle)}](${mdUrl(h.url)}) at ${new Date(h.createdAt).toLocaleString()}\n\n`;
      });
    }

    if (questions?.length) {
      md += `## Questions & Hypotheses (${questions.length})\n\n`;
      questions.forEach(q => {
        md += `### ${q.type.toUpperCase()}: ${q.content}\n`;
        md += `- **Status**: ${q.status}\n`;
        if (q.pageTitle) md += `- **Source**: [${mdLabel(q.pageTitle)}](${mdUrl(q.url)})\n`;
        md += `- **Created**: ${new Date(q.createdAt).toLocaleString()}\n\n`;
      });
    }

    downloadFile(md, `research-export-${formatDate(Date.now())}.md`, 'text/markdown');
  },

  exportToJSON(data: { sessions: Session[]; notes: Note[]; highlights: Highlight[]; questions: Question[]; pages: Page[] }) {
    const output = {
      ...data,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    downloadFile(JSON.stringify(output, null, 2), `research-export-${formatDate(Date.now())}.json`, 'application/json');
  },

  exportToCSV(notes: Note[], highlights: Highlight[], questions: Question[]) {
    const rows: string[] = ['Type,Content,URL,Source Title,Timestamp,Additional Info'];

    notes?.forEach((n) =>
      rows.push([
        csvCell('note'), csvCell(n.content), csvCell(n.url), csvCell(n.pageTitle),
        csvCell(new Date(n.createdAt).toISOString()), csvCell(`Tags: ${n.tags.join('; ')}`),
      ].join(','))
    );
    highlights?.forEach((h) =>
      rows.push([
        csvCell('highlight'), csvCell(h.text), csvCell(h.url), csvCell(h.pageTitle),
        csvCell(new Date(h.createdAt).toISOString()), csvCell(''),
      ].join(','))
    );
    questions?.forEach((q) =>
      rows.push([
        csvCell(q.type), csvCell(q.content), csvCell(q.url), csvCell(q.pageTitle),
        csvCell(new Date(q.createdAt).toISOString()), csvCell(`Status: ${q.status}`),
      ].join(','))
    );

    downloadFile(rows.join('\n') + '\n', `research-export-${formatDate(Date.now())}.csv`, 'text/csv');
  },

  exportToObsidian(notes: Note[], highlights: Highlight[], questions: Question[]) {
    let md = `---\ntags: [research, research-session-recorder]\ndate: ${formatDate(Date.now())}\ntype: research-export\n---\n\n# Research Session Export\n\n`;

    if (notes?.length) {
      md += `## Notes\n\n`;
      notes.forEach(n => {
        md += `### Note\n${n.content}\n\n`;
        if (n.pageTitle) md += `Source: ${wikiLink(n.pageTitle)}\nSource URL: ${n.url}\n`;
        if (n.tags.length) md += `Tags: ${n.tags.map(t => `#${t}`).join(' ')}\n`;
        md += '\n';
      });
    }

    if (highlights?.length) {
      md += `## Highlights\n\n`;
      highlights.forEach(h => {
        md += `> ${h.text}\n\n`;
        md += `Source: ${wikiLink(h.pageTitle)}\nSource URL: ${h.url}\n\n`;
      });
    }

    if (questions?.length) {
      md += `## Questions, Hypotheses & Ideas\n\n`;
      questions.forEach(q => {
        md += `### ${q.type.toUpperCase()}: ${q.content}\n`;
        md += `- Status: #${q.status}\n`;
        if (q.pageTitle) md += `- Source: ${wikiLink(q.pageTitle)}\n`;
        md += '\n';
      });
    }

    downloadFile(md, `research-export-${formatDate(Date.now())}-obsidian.md`, 'text/markdown');
  }
};
