// Files picked without signal wait on the phone and go up when the network
// is back. The store is IndexedDB (a Blob survives a reload there); the
// flow is pure so a test drives it with a fake store and a fake upload.

export const DB_NAME = "site-log-uploads";
export const STORE = "pending";
export const MAX_ATTEMPTS = 5;

// A browser fetch that never reached a server throws a TypeError.
export function isNetworkFailure(e) {
  return (
    e instanceof TypeError ||
    /failed to fetch|networkerror|network request failed|load failed/i.test(String((e && e.message) || e))
  );
}

// A 4xx that will not change on retry; 401/408/429 and every 5xx may.
export function isRefusal(status) {
  return status >= 400 && status < 500 && status !== 401 && status !== 408 && status !== 429;
}

export function memoryQueue(initial = []) {
  const map = new Map(initial.map((i) => [i.id, i]));
  return {
    async add(item) {
      map.set(item.id, item);
      return item;
    },
    async list() {
      return [...map.values()];
    },
    async remove(id) {
      map.delete(id);
    },
    async update(item) {
      map.set(item.id, item);
    },
  };
}

export function openUploadQueue(idb) {
  if (!idb) return Promise.resolve(memoryQueue());
  return new Promise((resolve) => {
    let req;
    try {
      req = idb.open(DB_NAME, 1);
    } catch {
      resolve(memoryQueue());
      return;
    }
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onerror = () => resolve(memoryQueue());
    req.onsuccess = () => {
      const db = req.result;
      const run = (mode, fn) =>
        new Promise((res, rej) => {
          const tx = db.transaction(STORE, mode);
          const r = fn(tx.objectStore(STORE));
          tx.oncomplete = () => res(r && "result" in r ? r.result : undefined);
          tx.onerror = () => rej(tx.error);
        });
      resolve({
        add: (item) => run("readwrite", (s) => s.put(item)).then(() => item),
        list: () => run("readonly", (s) => s.getAll()).then((v) => v || []),
        remove: (id) => run("readwrite", (s) => s.delete(id)),
        update: (item) => run("readwrite", (s) => s.put(item)),
      });
    };
  });
}

// Oldest first. `upload(item)` answers { ok: true, meta } or { ok: false,
// status }; a thrown network failure stops the drain and keeps the rest.
export async function drainQueue({ queue, upload, isOnline = () => true, onUploaded, onFailed }) {
  if (!isOnline()) return { uploaded: 0, kept: (await queue.list()).length, dropped: 0, stopped: "offline" };
  const items = (await queue.list()).sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
  let uploaded = 0,
    dropped = 0;
  for (const item of items) {
    let res;
    try {
      res = await upload(item);
    } catch (e) {
      if (isNetworkFailure(e))
        return { uploaded, kept: items.length - uploaded - dropped, dropped, stopped: "network" };
      res = { ok: false, status: 0, error: e };
    }
    if (res && res.ok) {
      await queue.remove(item.id);
      uploaded++;
      if (onUploaded) await onUploaded(item, res.meta);
      continue;
    }
    const attempts = (item.attempts || 0) + 1;
    if ((res && isRefusal(res.status)) || attempts >= MAX_ATTEMPTS) {
      await queue.remove(item.id);
      dropped++;
      if (onFailed) onFailed(item, res);
    } else {
      await queue.update({ ...item, attempts });
    }
  }
  return { uploaded, kept: items.length - uploaded - dropped, dropped, stopped: null };
}
