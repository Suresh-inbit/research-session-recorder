// ============================================================
// Keyboard commands (manifest "commands")
// ============================================================

export function initCommands(): void {
  chrome.commands.onCommand.addListener((command, tab) => {
    if (command === 'open-side-panel') {
      // sidePanel.open() must run inside the user-gesture handler: no awaiting before it.
      if (tab?.id !== undefined && chrome.sidePanel?.open) {
        chrome.sidePanel.open({ tabId: tab.id }).catch((e) => console.warn('[RSR] sidePanel.open failed:', e));
      }
      return;
    }

    if (command === 'toggle-note') {
      void (async () => {
        const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (active?.id === undefined) return;
        // Fails on pages without the content script (chrome://, store pages...): ignore.
        await chrome.tabs.sendMessage(active.id, { type: 'TOGGLE_NOTE_WIDGET' }).catch(() => undefined);
      })();
    }
  });
}
