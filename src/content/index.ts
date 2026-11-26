// ============================================================
// Content Script Entry
// ============================================================

import { extractPageMetadata } from './metadata-extractor';
import { extractPaperMetadata } from './paper-extractor';
import { extractGitHubMetadata } from './github-extractor';
import { initHighlightCapture, disableHighlightCapture } from './highlight-capture';

// Page visits are tracked by the background worker (tab events), not reported from here.

import type { Settings } from '../shared/types';
import { SETTINGS_KEY, normalizeSettings } from '../shared/settings';
import { isExcludedUrl } from '../shared/url-rules';

/**
 * Send extracted metadata to the background. The page record may not exist yet (the
 * background creates it when the tab finishes loading), so retry a few times.
 */
function sendMetadata(metadata: object, attempt = 0): void {
  const url = window.location.href;
  chrome.runtime.sendMessage({ type: 'PAGE_METADATA', payload: { url, metadata } }, (response) => {
    const failed = chrome.runtime.lastError || !response?.success;
    if (failed && attempt < 3) setTimeout(() => sendMetadata(metadata, attempt + 1), 2000);
  });
}

// Extract and send metadata based on page type
function extractAndSendMetadata(): void {
  const url = window.location.href;
  const paperMeta = extractPaperMetadata(url);
  if (paperMeta) sendMetadata(paperMeta);
  const ghMeta = extractGitHubMetadata(url);
  if (ghMeta) sendMetadata(ghMeta);
}

// ---------- Settings-driven behaviour ----------
// Excluded/blocked sites (webmail, banking, user blocklist...) get no UI and no metadata.

let siteAllowed = false;
let metadataSent = false;

function applySettings(settings: Settings): void {
  siteAllowed = !isExcludedUrl(window.location.href, settings.blockedDomains);

  if (siteAllowed && settings.highlightEnabled) {
    initHighlightCapture();
  } else {
    disableHighlightCapture();
  }

  if (!siteAllowed && noteWidget) toggleNoteWidget();

  if (siteAllowed && !metadataSent) {
    metadataSent = true;
    // Small delay so the DOM (and the background's page record) is ready
    setTimeout(extractAndSendMetadata, 1000);
  }
}

chrome.storage.local.get(SETTINGS_KEY, (result) => {
  applySettings(normalizeSettings(result[SETTINGS_KEY]));
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[SETTINGS_KEY]) {
    applySettings(normalizeSettings(changes[SETTINGS_KEY].newValue));
  }
});

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!siteAllowed) return false;
  if (message?.type === 'GET_PAGE_METADATA') {
    sendResponse({ success: true, data: extractPageMetadata() });
  } else if (message?.type === 'TOGGLE_NOTE_WIDGET') {
    toggleNoteWidget();
    sendResponse({ success: true });
  }
  return false; // all responses above are synchronous
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
        payload: { content, type: noteType as 'question' | 'hypothesis' | 'idea', url: window.location.href, pageTitle: document.title },
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
