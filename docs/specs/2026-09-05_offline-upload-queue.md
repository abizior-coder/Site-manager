# Offline upload queue for plans and files

**Status: implemented 2026-09-05** (accepted the same day; engineering audit M3; owner: "wykonaj
wszystkie krok po kroku").

## Goal

A plan or document picked on a roof without signal is not lost: it waits
on the phone and goes up when the network is back, and the job's files
tab says how many are waiting.

## Design

- `upload-queue.js` (tested with a fake store): `openUploadQueue(idb)`
  over IndexedDB (`site-log-uploads`, store `pending`: id, cid, projectId,
  kind, name, type, size, blob, addedAt, attempts); `drainQueue({ queue,
  upload, isOnline, onUploaded, onFailed })` — pure flow: uploads in
  order, removes on success, stops at a network failure, drops with a
  message after a definite refusal (4xx/5xx) or five attempts.
- App: `uploadFiles` enqueues when the network is down (`fetch` throws or
  `navigator.onLine` is false) and says so; on `online` and after the
  company loads, the queue drains; a successful drain writes the `files`
  record exactly as a live upload does. `ProjectDetail` shows
  "n warten auf Netz" on the files tab.
- i18n ×14.

## Definition of done

- Logic: drain removes uploaded items, keeps the rest at a network
  failure, drops after a refusal, respects the attempt cap.
- Emulator: with `fetch` made to fail for the files route, a picked file
  lands in the queue and the tab shows it waiting; with the network back
  the queue drains (the Worker's answer decides success or a message).

## Out of scope

- Background sync while the app is closed (Background Sync API is not on
  iOS); the drain runs when the app is open.
