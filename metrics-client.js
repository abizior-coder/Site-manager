// Counts what people do in the app and sends the counts, batched, to the
// Worker -- names of events and how often, nothing else. The tracker never
// throws and never blocks: a failed send keeps the batch for the next try.
//
// Everything is injected so the batching can be tested without a browser.

export const MAX_DISTINCT = 40;
export const MAX_COUNT = 1000;

export function createTracker({
  send,
  flushMs = 120000,
  schedule = (fn, ms) => setTimeout(fn, ms),
  cancel = (h) => clearTimeout(h),
} = {}) {
  let pending = {};
  let timer = null;
  let sending = false;

  function track(name, n = 1) {
    if (typeof name !== "string" || !name) return;
    const count = Math.max(0, Math.floor(Number(n) || 0));
    if (!count) return;
    if (!(name in pending) && Object.keys(pending).length >= MAX_DISTINCT) return;
    pending[name] = Math.min(MAX_COUNT, (pending[name] || 0) + count);
    if (!timer)
      timer = schedule(() => {
        timer = null;
        flush();
      }, flushMs);
  }

  function mergeBack(batch) {
    for (const [k, v] of Object.entries(batch)) pending[k] = Math.min(MAX_COUNT, (pending[k] || 0) + v);
  }

  async function flush() {
    if (timer) {
      cancel(timer);
      timer = null;
    }
    if (sending) return false;
    const batch = pending;
    pending = {};
    if (Object.keys(batch).length === 0) return true;
    sending = true;
    try {
      const ok = await send(batch);
      if (!ok) mergeBack(batch);
      return !!ok;
    } catch {
      mergeBack(batch);
      return false;
    } finally {
      sending = false;
    }
  }

  function pendingEvents() {
    return { ...pending };
  }

  return { track, flush, pendingEvents };
}
