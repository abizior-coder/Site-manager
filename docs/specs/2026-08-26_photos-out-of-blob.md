# Photos out of the single-document blob

## Problem

Every photo is stored as a base64 data URL *inside* a JSON blob that lives in
one Firestore document. Firestore's limit is **1 MB per document**. A scaled
photo is ~200–500 KB, so **2–4 photos exceed the limit and every subsequent
save fails**. `persist()` updates React state before writing, so the app looks
saved until reload — silent loss of real work.

Three documents carry this defect:

| Document | Photos it holds |
|---|---|
| `site-data` | `type: "photo"` entries — the volume driver |
| `site-docs` | Insurance card and certificate photos |
| `site-tech-library` | Optional spec-sheet photo per item |

## Goal

Photos stop counting against those documents, so logging photos can never
break saving.

## Constraints

- **No Firebase Blaze plan** (PROJECT.md §3). The project bucket is named
  `site-log-ab6a9.firebasestorage.app`, the scheme used since Firebase began
  requiring Blaze to provision Cloud Storage — so **Firebase Storage is
  assumed unavailable** and must not be the solution.
- Must not require an `index.html` change. HTML and bundle cache
  independently, and depending on a new global there has already cost a full
  debugging cycle (PROJECT.md §6).
- Existing entries with inline photos must keep rendering.

## Approach

**One Firestore document per photo**, written through the existing
`window.storage` shim as key `photo-<id>`. A scaled photo is comfortably under
the 1 MB per-document limit, and the blobs then hold only a `photoId` string.

This needs no new service, no billing change, and no `index.html` edit.

## Definition of done

- Adding a photo writes a separate `photo-<id>` document; the entry stores
  `photoId`, not image bytes.
- `site-data` growth per photo entry is bytes, not hundreds of KB.
- Insurance, certificate and tech-library photos use the same path.
- Deleting an entry deletes its photo document (no orphans).
- Entries holding a legacy inline `photo` still display.
- Verified in a browser: add a photo, reload, confirm it renders and that
  `site-data` stayed small.

## Out of scope

- Backup codes and project-share codes will no longer carry photo *contents*
  (they reference ids). Acceptable now — no photos exist yet — but must be
  recorded in PROJECT.md as a known gap.
- Thumbnails, CDN delivery, and per-user auth scoping.
- Migrating already-stored inline photos: there are currently none, so
  backward-compatible rendering is enough.
