import { defineBackground } from "wxt/utils/define-background";
import { browser } from "wxt/browser";
import { makeQueue } from "../lib/queue";
import { isScrollMessage } from "../lib/messages";
import { applyPayload, dayKey, pruneOldDays } from "../lib/storage";
import { dateKey } from "../lib/streak";

// Thin wiring only — validated/queued logic lives in lib/ (queue, messages, storage).
const enqueue = makeQueue();

export default defineBackground(() => {
  void pruneOldDays(90, dateKey(new Date()));

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isScrollMessage(message)) return false;
    enqueue(dayKey(message.payload.dateKey), () => applyPayload(message.payload))
      .then(() => sendResponse({ ok: true }))
      .catch((e: unknown) =>
        sendResponse({ ok: false, error: e instanceof Error ? e.message : "persist failed" }),
      );
    return true; // keep the channel open for the async response
  });
});
