// ============================================================
// Periodic wake-up
// ============================================================
// A service worker cannot rely on setTimeout/setInterval (it is killed when idle).
// chrome.alarms persists across worker restarts and wakes the worker to run the tick.

import { tick } from './time-tracker';
import { checkIdleTimeout } from './session-manager';

const TICK_ALARM = 'rsr-tick';

/** Must be called synchronously at worker start-up so the listener is always registered. */
export function initAlarms(): void {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== TICK_ALARM) return;
    void tick().then(checkIdleTimeout).catch((err) => console.error('[RSR] tick failed:', err));
  });

  chrome.alarms.get(TICK_ALARM, (existing) => {
    if (!existing) chrome.alarms.create(TICK_ALARM, { periodInMinutes: 0.5 });
  });
}
