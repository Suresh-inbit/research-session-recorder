// ============================================================
// Highlight Capture
// ============================================================
// Captures text selections and shows a floating save button.

let floatingButton: HTMLElement | null = null;

export function initHighlightCapture(): void {
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mousedown', hideFloatingButton);
}

function handleMouseUp(e: MouseEvent): void {
  // Small delay to ensure selection is finalized
  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (!text || text.length < 3) {
      hideFloatingButton();
      return;
    }

    showFloatingButton(e.clientX, e.clientY, text, selection);
  }, 10);
}

function showFloatingButton(x: number, y: number, text: string, selection: Selection | null): void {
  hideFloatingButton();

  floatingButton = document.createElement('div');
  floatingButton.id = 'rsr-highlight-btn';
  floatingButton.innerHTML = `
    <button id="rsr-save-highlight" style="
      all: initial;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #7c5cfc;
      color: white;
      border: none;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(124,92,252,0.4);
      transition: all 0.15s ease;
      white-space: nowrap;
    ">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
      Save Highlight
    </button>
  `;

  floatingButton.style.cssText = `
    position: fixed;
    left: ${Math.min(x, window.innerWidth - 160)}px;
    top: ${Math.max(y - 45, 10)}px;
    z-index: 2147483647;
    pointer-events: auto;
  `;

  document.body.appendChild(floatingButton);

  const btn = floatingButton.querySelector('#rsr-save-highlight');
  btn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    saveHighlight(text, selection);
    hideFloatingButton();
  });

  // Hover effect
  btn?.addEventListener('mouseenter', () => {
    (btn as HTMLElement).style.background = '#6b4ce0';
    (btn as HTMLElement).style.transform = 'scale(1.03)';
  });
  btn?.addEventListener('mouseleave', () => {
    (btn as HTMLElement).style.background = '#7c5cfc';
    (btn as HTMLElement).style.transform = 'scale(1)';
  });
}

function hideFloatingButton(): void {
  if (floatingButton) {
    floatingButton.remove();
    floatingButton = null;
  }
}

function saveHighlight(text: string, selection: Selection | null): void {
  // Get surrounding context
  let surroundingText: string | undefined;
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const parentEl = container.nodeType === Node.ELEMENT_NODE
      ? container as HTMLElement
      : container.parentElement;
    if (parentEl) {
      surroundingText = parentEl.textContent?.trim().slice(0, 500);
    }
  }

  // Send to background
  chrome.runtime.sendMessage({
    type: 'SAVE_HIGHLIGHT',
    payload: {
      text,
      surroundingText,
      url: window.location.href,
      pageTitle: document.title,
    },
  });

  // Brief visual feedback
  showSavedFeedback();
}

function showSavedFeedback(): void {
  const feedback = document.createElement('div');
  feedback.textContent = '✓ Saved to Research Notes';
  feedback.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 10px 20px;
    background: #1a1d27;
    color: #34d399;
    border: 1px solid rgba(52, 211, 153, 0.3);
    border-radius: 10px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: rsr-fade-in 0.2s ease;
  `;

  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes rsr-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes rsr-fade-out { from { opacity: 1; } to { opacity: 0; transform: translateY(10px); } }
  `;
  document.head.appendChild(style);
  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.style.animation = 'rsr-fade-out 0.3s ease forwards';
    setTimeout(() => {
      feedback.remove();
      style.remove();
    }, 300);
  }, 2000);
}
