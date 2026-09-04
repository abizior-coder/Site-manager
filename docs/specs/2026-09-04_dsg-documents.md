# DSG documents: Datenschutzerklärung, AVV, Verzeichnis, Subprozessoren

**Status: implemented 2026-09-04** (owner named the operator: Andrzej Bizior,
Si‑Ma, Stallikonerstrasse 41, 8903 Birmensdorf, a.bizior@pm.me).

## Goal

A roofing firm that considers a pilot asks two questions before anything
else: *who is responsible for our data, and what do you do with it?* Both
must have a written answer that a Datenschutzberater can review in an
hour. The app itself must show a privacy notice before sign-in, as the
revised Swiss DSG (in force since 1 September 2023) expects of anyone
processing personal data professionally.

## Roles (this is the part that decides everything else)

- **Si‑Ma (the owner, as sole proprietor until a company exists)** is the
  *operator*: Verantwortlicher for platform data (accounts, sign-ins,
  usage counts) and **Auftragsbearbeiter** for every firm's site data
  (hours, entries, customers, photos, plans), which the firm decides to
  record. Address and e-mail above.
- **Each roofing firm** is Verantwortlicher for its own data and signs an
  Auftragsbearbeitungsvertrag (AVV) with the operator.
- **Sub-processors** (from the code, not from memory): Google Firebase
  (Auth, Firestore), Cloudflare (Worker, KV, R2), Anthropic (delivery-note
  scans, note translations, inspection reports), Open‑Meteo (coordinates
  only), GitHub Pages (static files, no personal data).

## Deliverables

1. `docs/legal/datenschutzerklaerung.md` — the public notice, German.
2. `docs/legal/avv.md` — AVV template with Anhang 1 (Gegenstand, Datenkategorien,
   betroffene Personen), Anhang 2 (Subprozessoren), Anhang 3 (TOM).
3. `docs/legal/verzeichnis-bearbeitungstaetigkeiten.md` — the operator's
   register (not mandatory under 250 employees, but the pilot firm's
   adviser will ask for it).
4. `docs/legal/subprozessoren.md` — the list, with purpose, data and place.
5. `datenschutz.html` — the notice as a page on the site, linked from the
   sign-in screen and from Mein Profil (i18n key `privacyLink`).

## Facts the documents must state truthfully

- Data stays in the firm's own Firestore space; only members of the firm
  can read it (security rules, audited 2026-09-03).
- Photos and notes go to Anthropic only when a person taps scan/translate;
  usage counts carry a truncated hash, never a name; the AI proxy needs a
  signed-in member and is capped per firm.
- Retention: site data while the firm's account exists; usage counts 400
  days; rate counters 48 h; a member the owner removes is deactivated at
  once and deleted on request.
- No cookies for tracking; Firebase keeps the sign-in in the browser's
  own storage; the offline cache holds the app, not personal data beyond
  what Firestore keeps for offline work.
- Region of the Firebase project: stated as "gemäss Projekteinstellung,
  Auskunft auf Anfrage" until the owner confirms it in the console.

## Definition of done

- The four documents exist, name the operator, and agree with the code
  on every fact above.
- `datenschutz.html` is reachable without sign-in; the sign-in screen and
  the profile show a link; a render test finds it.
- Journal notes the two follow-ups for the owner: confirm the Firebase
  region; have a Datenschutzberater read the set before the first pilot.

## Out of scope

- Translations of the legal texts (German only for now).
- GDPR-specific clauses for firms with an EU establishment.
- A self-service account deletion button (deletion by e-mail request).
