# A direct "+" on the job's Fotos tab

**Status: proposed 2026-09-11, implemented same day.**

Supersedes an earlier draft of this same file, which targeted the wrong
feature (the `files`/R2 "Pläne" tab's `kind` categories). Corrected after
the owner pointed at the actual target: the job hub's **Fotos** tab
(`hubTab === "photos"`, entry-type `type: "photo"`, `tabs/
ProjectDetail.jsx`) — the tab whose own empty-state copy currently reads
"Fotos vom Dach kommen über «+» › Foto oder aus dem Chat hierher." ("roof
photos arrive here via the «+» sheet › Photo, or from chat") — i.e. today
there is **no way to add a photo from this tab itself**; a person must
leave it for the app-level quick-add sheet or a chat attachment. This
spec fixes that.

## Goal

A "+" lives directly on the Fotos tab, in both states:

1. **Empty**: the empty-state card gets an action button in place of the
   now-stale hint pointing elsewhere.
2. **Filled**: the same action is offered next to the section header,
   above the existing photo grid.

Tapping either takes a photo or picks one from the gallery and saves it
as a new `type: "photo"` entry **on this project**, through the
already-existing photo-entry path — no redirect to the app-level
quick-add sheet (`[data-quick-add]`) and no detour through chat.

## Constraints

- PROJECT.md §2b, §3 (24 px touch targets, accessible names, 350 KB
  budget, no Blaze).
- **Reuse the existing photo-entry path exactly as it stands — no new
  one.** `ProjectDetail` already receives an `onAdd` prop
  (`onAdd={(type) => openAdd(type, selectedProject)}`,
  `roofing-site-manager.jsx`) already bound to the current project, and
  already used by the Übersicht tab's own "Foto" shortcut button
  (`onClick={() => onAdd("photo")}`, same file). `openAdd("photo",
  projectId)` opens the existing add-entry modal in its photo mode
  (camera-or-gallery `<input type="file" accept="image/*">`, optional
  caption, `submitAdd` → `savePhoto` → a `type: "photo"` entry via
  `newEntry()`) — the same modal `docs/specs/2026-08-26_photos-out-of-
  blob.md`'s `photo-<id>` kv path already serves. This spec adds a button
  that calls the already-passed `onAdd("photo")`; it adds no new modal,
  no new save function, no new kv shape.
- **Not the `files`/R2 "Pläne" tab.** That tab's per-`kind` categories
  (`plan`/`offer`/`contract`/`delivery`/`photo`/`other`,
  `uploadFiles(projectId, fileList, kind)`) are a different, unrelated
  photo path and are untouched by this spec.
- **Demo mode already stays local, verified rather than assumed.**
  `openAdd`/`submitAdd`/`savePhoto`/`persist` all go through
  `window.storage`/`company-store.js`, which is already backed by
  `demo-store.js`'s in-memory SDK whenever `isDemoMode()` is true —
  unlike the R2 files path (a raw `fetch()` to the Worker, which needed
  its own demo branch in the sibling spec), this path never leaves the
  demo SDK today. No new demo-mode code is needed; this is checked live
  in `?demo=1` as part of verification, not taken on faith.
- The stale hint (`emptyPhotosHint`, all 14 `i18n/*.json`: "Fotos vom
  Dach kommen über «+» › Foto oder aus dem Chat hierher.") describes
  exactly the indirection this spec removes. Rather than rewrite it in
  14 languages to describe a new indirection that no longer exists, it
  is **dropped** from this one `EmptyState` call — `ui/empty-state.jsx`
  already renders `hint` only `{hint && ...}`, so omitting the prop is a
  one-line change, not a translation change. `emptyPhotosTitle` ("Noch
  keine Fotos") stays; it is still true.
- No new `i18n` keys: the action button's label and the header "+"'s
  accessible name both reuse the existing `t.photoLabel` ("Foto"),
  already used for exactly this action elsewhere in the same file
  (Übersicht tab's shortcut, `roofing-site-manager.jsx:412`).

## Design

- `ui/empty-state.jsx` already supports an optional action button
  (`action`/`onAction` props, unused anywhere in the app so far — this
  is its first caller). `tabs/ProjectDetail.jsx`'s
  `photos.length === 0` branch changes from
  `<EmptyState name="photos" icon={Camera} title={t.emptyPhotosTitle} hint={t.emptyPhotosHint} compact />`
  to the same call with `hint` dropped and
  `action={t.photoLabel} onAction={() => onAdd("photo")}` added.
- The `photos.length > 0` branch's header row (currently just the
  `{t.photoLabel}` label above the grid) gains a small square icon
  button (`data-photo-add`, `Plus` icon — already imported in this file
  — `aria-label`/`title={t.photoLabel}`, `tap` class, `w-8 h-8`, the same
  size/idiom the week view's prev/next controls already use) calling
  `onAdd("photo")`, placed at the row's trailing edge
  (`flex items-center justify-between`).
- Both controls call the identical existing `onAdd("photo")` — one
  code path, one modal, whether the tab is empty or full.

## Definition of done

- The Fotos tab's empty state shows a real action button, not a hint
  describing an indirect path; tapping it opens the existing photo-entry
  modal scoped to this project.
- The Fotos tab's filled grid shows the same "+" next to its header;
  tapping it opens the same modal.
- Saving through either produces a normal `type: "photo"` entry on this
  project — visible in the grid immediately, present in `reportSiteGroups`'s
  `photos` bucket like any other photo entry, unaffected by this change.
- Both controls meet the 24 px touch-target floor.
- Verified live in `?demo=1`: adding a photo from either state stays in
  the demo's own in-memory data — no request reaches Firestore or the
  Worker.
- Render test (`render.test.mjs`): `[data-photo-add]` is present and
  clickable in the empty Fotos tab and, separately, in a Fotos tab that
  already has a photo; both reach the same add-entry modal
  (`addModal.type === "photo"`).

## Out of scope

- The `files`/R2 "Pläne" tab and its `kind` categories — a different
  feature, covered (if ever needed) by a separate spec.
- Any change to how photos are viewed, marked up, or deleted
  (`PhotoViewer`, `PhotoEditor`, `savePhotoEdit`, the per-photo delete
  button already in the grid) — untouched.
- Rewriting `emptyPhotosHint` into new copy in 14 languages — dropped,
  not replaced, per Constraints.
- Removing the Übersicht tab's own "Foto" shortcut or the app-level
  quick-add sheet's photo composer — both keep working exactly as
  today; this spec only adds a third, more direct way in.
