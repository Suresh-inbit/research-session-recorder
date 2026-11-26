// Minimal in-memory stand-in for the parts of chrome.* the background code touches.

type Store = Record<string, unknown>;
type Listener = (...args: never[]) => unknown;

function area(store: Store) {
  return {
    async get(keys?: string | string[] | null) {
      if (keys == null) return { ...store };
      const list = Array.isArray(keys) ? keys : [keys];
      const out: Store = {};
      for (const k of list) if (k in store) out[k] = store[k];
      return out;
    },
    async set(items: Store) {
      Object.assign(store, JSON.parse(JSON.stringify(items)));
    },
  };
}

function createEvent() {
  const listeners: Listener[] = [];
  return {
    addListener: (fn: Listener) => void listeners.push(fn),
    emit: (...args: unknown[]) => listeners.forEach((fn) => (fn as (...a: unknown[]) => unknown)(...args)),
  };
}

export interface FakeTab {
  id: number;
  windowId: number;
  url: string;
  title?: string;
  active?: boolean;
  status?: string;
  incognito?: boolean;
  openerTabId?: number;
}

export function installChromeMock() {
  const local: Store = {};
  const session: Store = {};
  const tabs = new Map<number, FakeTab>();
  const state = { focusedWindowId: 1, idle: 'active' as 'active' | 'idle' | 'locked' };

  const events = {
    tabActivated: createEvent(),
    tabUpdated: createEvent(),
    tabRemoved: createEvent(),
    windowFocus: createEvent(),
    idleChanged: createEvent(),
  };

  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: { local: area(local), session: area(session) },
    tabs: {
      get: async (id: number) => {
        const t = tabs.get(id);
        if (!t) throw new Error('No tab');
        return { status: 'complete', ...t };
      },
      query: async (q: { active?: boolean; windowId?: number }) =>
        [...tabs.values()].filter((t) => (q.active ? t.active : true) && (q.windowId ? t.windowId === q.windowId : true)),
      onActivated: events.tabActivated,
      onUpdated: events.tabUpdated,
      onRemoved: events.tabRemoved,
    },
    windows: {
      WINDOW_ID_NONE: -1,
      getLastFocused: async () => ({ id: state.focusedWindowId, focused: state.focusedWindowId !== -1 }),
      onFocusChanged: events.windowFocus,
    },
    idle: {
      queryState: async () => state.idle,
      setDetectionInterval: () => undefined,
      onStateChanged: events.idleChanged,
    },
  };

  return { local, session, tabs, state, events };
}

/** Let queued promise chains (and Dexie's IndexedDB round-trips) settle. */
export async function settle(times = 20): Promise<void> {
  for (let i = 0; i < times; i++) await new Promise((r) => setTimeout(r, 0));
}
