// ============================================================
// Content Script Entry
// ============================================================

import { extractPageMetadata } from './metadata-extractor';
import { extractPaperMetadata } from './paper-extractor';
import { extractGitHubMetadata } from './github-extractor';
import { initHighlightCapture } from './highlight-capture';

// Notify background of page visit
chrome.runtime.sendMessage({
  type: 'PAGE_VISIT',
  payload: {
    url: window.location.href,
    title: document.title,
  },
});

// Extract and send metadata based on page type
function extractAndSendMetadata(): void {
  const url = window.location.href;
  const pageMeta = extractPageMetadata();

  // Paper metadata
  const paperMeta = extractPaperMetadata(url);
  if (paperMeta) {
    chrome.runtime.sendMessage({
      type: 'PAGE_METADATA',
      payload: { url, metadata: paperMeta },
    });
  }

  // GitHub metadata
  const ghMeta = extractGitHubMetadata(url);
  if (ghMeta) {
    chrome.runtime.sendMessage({
      type: 'PAGE_METADATA',
      payload: { url, metadata: ghMeta },
    });
  }
}

// Initialize highlight capture
initHighlightCapture();

// Extract metadata after a small delay to ensure DOM is ready
setTimeout(extractAndSendMetadata, 1000);

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_PAGE_METADATA') {
    const meta = extractPageMetadata();
    sendResponse({ success: true, data: meta });
  }
  if (message.type === 'TOGGLE_NOTE_WIDGET') {
    toggleNoteWidget();
    sendResponse({ success: true });
  }
  return true;
});

// Keyboard shortcut handler
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+N — toggle note widget
  if (e.ctrlKey && e.shiftKey && e.key === 'N') {
    e.preventDefault();
    toggleNoteWidget();
  }
});

// ---------- Inline Note Widget ----------

let noteWidget: HTMLElement | null = null;

function toggleNoteWidget(): void {
  if (noteWidget) {
    noteWidget.remove();
    noteWidget = null;
    return;
  }

  noteWidget = document.createElement('div');
  noteWidget.id = 'rsr-note-widget';
  noteWidget.innerHTML = `
    <div style="
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 340px;
      background: #1a1d27;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      z-index: 2147483647;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      overflow: hidden;
    ">
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: rgba(124,92,252,0.1);
        border-bottom: 1px solid rgba(255,255,255,0.06);
      ">
        <span style="color: #e4e6ef; font-size: 14px; font-weight: 600;">📝 Quick Note</span>
        <button id="rsr-note-close" style="
          all: initial; cursor: pointer; color: #6b7084; font-size: 18px; line-height: 1;
        ">×</button>
      </div>
      <div style="padding: 12px 16px;">
        <textarea id="rsr-note-input" placeholder="Type your note... (Markdown supported)" style="
          width: 100%;
          min-height: 80px;
          background: #252836;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: #e4e6ef;
          font-family: inherit;
          font-size: 13px;
          line-height: 1.5;
          padding: 10px 12px;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
        "></textarea>
        <div style="display: flex; gap: 8px; margin-top: 10px;">
          <select id="rsr-note-type" style="
            flex: 1;
            background: #252836;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px;
            color: #9ca0b0;
            font-size: 12px;
            padding: 6px 8px;
            outline: none;
          ">
            <option value="note">📝 Note</option>
            <option value="question">❓ Question</option>
            <option value="hypothesis">🧪 Hypothesis</option>
            <option value="idea">💡 Idea</option>
          </select>
          <button id="rsr-note-save" style="
            all: initial;
            padding: 6px 16px;
            background: #7c5cfc;
            color: white;
            border-radius: 8px;
            font-family: inherit;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s;
          ">Save</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(noteWidget);

  // Event handlers
  noteWidget.querySelector('#rsr-note-close')?.addEventListener('click', () => toggleNoteWidget());

  noteWidget.querySelector('#rsr-note-save')?.addEventListener('click', () => {
    const input = noteWidget?.querySelector('#rsr-note-input') as HTMLTextAreaElement;
    const typeSelect = noteWidget?.querySelector('#rsr-note-type') as HTMLSelectElement;
    const content = input?.value.trim();
    if (!content) return;

    const noteType = typeSelect?.value || 'note';

    if (noteType === 'note') {
      chrome.runtime.sendMessage({
        type: 'SAVE_NOTE',
        payload: { content, url: window.location.href, pageTitle: document.title, tags: [] },
      });
    } else {
      chrome.runtime.sendMessage({
        type: 'SAVE_QUESTION',
        payload: { content, type: noteType as any, url: window.location.href, pageTitle: document.title },
      });
    }

    input.value = '';
    // Brief feedback
    const btn = noteWidget?.querySelector('#rsr-note-save') as HTMLElement;
    if (btn) {
      btn.textContent = '✓ Saved';
      btn.style.background = '#34d399';
      setTimeout(() => { btn.textContent = 'Save'; btn.style.background = '#7c5cfc'; }, 1500);
    }
  });

  // Focus the textarea
  setTimeout(() => {
    (noteWidget?.querySelector('#rsr-note-input') as HTMLTextAreaElement)?.focus();
  }, 100);
}
