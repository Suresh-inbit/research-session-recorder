// ============================================================
// Export Service
// ============================================================

import type { Session, Note, Highlight, Question, Page } from '../shared/types';
import { formatDuration, formatDate, downloadFile } from '../shared/utils';

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
        if (n.pageTitle) md += `* **Source**: [${n.pageTitle}](${n.url})\n`;
        md += `* **Created**: ${new Date(n.createdAt).toLocaleString()}\n`;
        if (n.tags.length) md += `* **Tags**: ${n.tags.join(', ')}\n`;
        md += '\n---\n\n';
      });
    }

    if (highlights?.length) {
      md += `## Highlights (${highlights.length})\n\n`;
      highlights.forEach(h => {
        md += `> ${h.text}\n\n`;
        md += `— From [${h.pageTitle}](${h.url}) at ${new Date(h.createdAt).toLocaleString()}\n\n`;
      });
    }

    if (questions?.length) {
      md += `## Questions & Hypotheses (${questions.length})\n\n`;
      questions.forEach(q => {
        md += `### ${q.type.toUpperCase()}: ${q.content}\n`;
        md += `- **Status**: ${q.status}\n`;
        if (q.pageTitle) md += `- **Source**: [${q.pageTitle}](${q.url})\n`;
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
    let csv = 'Type,Content,URL,Source Title,Timestamp,Additional Info\n';

    notes?.forEach(n => {
      const escapedContent = n.content.replace(/"/g, '""');
      const escapedTitle = (n.pageTitle || '').replace(/"/g, '""');
      csv += `note,"${escapedContent}","${n.url || ''}","${escapedTitle}",${new Date(n.createdAt).toISOString()},"Tags: ${n.tags.join('; ')}"\n`;
    });

    highlights?.forEach(h => {
      const escapedText = h.text.replace(/"/g, '""');
      const escapedTitle = h.pageTitle.replace(/"/g, '""');
      csv += `highlight,"${escapedText}","${h.url}","${escapedTitle}",${new Date(h.createdAt).toISOString()},\n`;
    });

    questions?.forEach(q => {
      const escapedContent = q.content.replace(/"/g, '""');
      const escapedTitle = (q.pageTitle || '').replace(/"/g, '""');
      csv += `${q.type},"${escapedContent}","${q.url || ''}","${escapedTitle}",${new Date(q.createdAt).toISOString()},"Status: ${q.status}"\n`;
    });

    downloadFile(csv, `research-export-${formatDate(Date.now())}.csv`, 'text/csv');
  },

  exportToObsidian(notes: Note[], highlights: Highlight[], questions: Question[]) {
    let md = `---\ntags: [research, research-session-recorder]\ndate: ${formatDate(Date.now())}\ntype: research-export\n---\n\n# Research Session Export\n\n`;

    if (notes?.length) {
      md += `## Notes\n\n`;
      notes.forEach(n => {
        md += `### Note\n${n.content}\n\n`;
        if (n.pageTitle) md += `Source: [[${n.pageTitle}]]\nSource URL: ${n.url}\n`;
        if (n.tags.length) md += `Tags: ${n.tags.map(t => `#${t}`).join(' ')}\n`;
        md += '\n';
      });
    }

    if (highlights?.length) {
      md += `## Highlights\n\n`;
      highlights.forEach(h => {
        md += `> ${h.text}\n\n`;
        md += `Source: [[${h.pageTitle}]]\nSource URL: ${h.url}\n\n`;
      });
    }

    if (questions?.length) {
      md += `## Questions, Hypotheses & Ideas\n\n`;
      questions.forEach(q => {
        md += `### ${q.type.toUpperCase()}: ${q.content}\n`;
        md += `- Status: #${q.status}\n`;
        if (q.pageTitle) md += `- Source: [[${q.pageTitle}]]\n`;
        md += '\n';
      });
    }

    downloadFile(md, `research-export-${formatDate(Date.now())}-obsidian.md`, 'text/markdown');
  }
};
