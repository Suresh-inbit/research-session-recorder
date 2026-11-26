// ============================================================
// Ephemeral state that must survive service-worker restarts
// ============================================================
// MV3 workers are killed after ~30s idle, wiping module variables. Anything that must
// outlive that (active tab, last activity, tab→URL map) is kept in storage.session,
// which lives as long as the browser session. Falls back to memory if unavailable.

const memory = new Map<string, unknown>();
const PREFIX = 'rsr:';

export async function getState<T>(key: string): Promise<T | undefined> {
  try {
    if (chrome.storage?.session) {
      const result = await chrome.storage.session.get(PREFIX + key);
      return result[PREFIX + key] as T | undefined;
    }
  } catch {
    /* fall through to memory */
  }
  return memory.get(key) as T | undefined;
}

export async function setState<T>(key: string, value: T): Promise<void> {
  memory.set(key, value);
  try {
    if (chrome.storage?.session) await chrome.storage.session.set({ [PREFIX + key]: value });
  } catch {
    /* memory copy is already stored */
  }
}
