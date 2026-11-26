import { describe, it, expect, beforeEach } from 'vitest';
import { installChromeMock } from '../test/chrome-mock';
import { db } from '../db/database';
import { pageRepo } from '../db/repositories/page-repo';
import { initMessageHandler } from './message-handler';
import type { ExtensionMessage, MessageResponse } from '../shared/messages';

type Listener = (m: ExtensionMessage, s: unknown, send: (r: MessageResponse) => void) => boolean | void;
let listener: Listener;

/** Send a message through the real listener, like the UI does with chrome.runtime.sendMessage. */
const send = (message: ExtensionMessage) =>
  new Promise<MessageResponse>((resolve) => listener(message, {}, resolve));

beforeEach(async () => {
  installChromeMock();
  (globalThis as unknown as { chrome: { runtime: unknown } }).chrome.runtime = {
    onMessage: { addListener: (fn: Listener) => (listener = fn) },
  };
  await db.delete();
  await db.open();
  initMessageHandler();
});

const makePage = (url: string, activeTimeSeconds: number) =>
  pageRepo.create({
    sessionId: 's', url, title: url, type: 'unknown', typeConfidence: 0.5,
    activeTimeSeconds, visitedAt: 0, lastActiveAt: 600_000,
  });

describe('time maintenance messages', () => {
  it('RESET_TIME zeroes recorded time and reports how many pages changed', async () => {
    const a = await makePage('https://a.com', 500);
    await makePage('https://b.com', 0);

    const res = await send({ type: 'RESET_TIME' });
    expect(res).toEqual({ success: true, data: { pages: 1 } });
    expect((await pageRepo.getById(a.id))?.activeTimeSeconds).toBe(0);
  });

  it('REPAIR_TIME caps inflated pages and reports the count', async () => {
    const bad = await makePage('https://bad.com', 300 * 3600);

    const res = await send({ type: 'REPAIR_TIME' });
    expect(res).toEqual({ success: true, data: { pages: 1 } });
    expect((await pageRepo.getById(bad.id))?.activeTimeSeconds).toBeLessThanOrEqual(660);
  });
});
