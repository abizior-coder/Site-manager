# Changelog

All notable changes to Site Log are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/). Each version is tagged `vX.Y.Z`
by the deploy workflow once it is live.

## [Unreleased]

### Added
- Language picker on the sign-in and onboarding screens; the choice is kept on the device.

### Changed
- QR-bill generation loads only when a bill is printed (first paint stays under budget).

## [0.9.0] - 2026-09-05

The September 2026 foundation: the app went from one firm's tool to a
product base for Swiss roofing and Spengler crews.

### Added
- Phone tab bar with a «+» sheet, Rapport (day with GAV split, week with CSV, month), job hub with tabs and a translated chat.
- Roof inspection with tile reference and waste weight; transport log.
- Supplier article sheet: the whole imported price list, searchable and sortable, into the basket or onto a job.
- Accounting export for the Treuhänder and bexio: invoice journal and positions, hours per employee and per day, customers in bexio's contact layout.
- Self-service onboarding: invite links, first steps for the owner, customer import from CSV or bexio's contact export.
- Offline app shell (service worker, versioned per build, in-app restart).
- Error panel with documented codes; crash capture reported to the Worker and shown on the Cockpit.
- Usage metrics per company on the Cockpit.
- Data protection documents (Datenschutzerklärung, AVV, Verzeichnis, Subprozessoren).
- Fourteen complete interface languages.

### Changed
- Static Tailwind build; split bundle with a first-paint budget under test; Preact.
- Deploy to GitHub Pages runs only after a green CI.
- Day and month keys are local calendar dates; ids are UUIDs.
- Pickup QR and Code 128 barcode are drawn locally.
- Dialog semantics, accessible names, 44 px hit areas, 12 px minimum type, PNG icons.
- Firebase SDK bundled from npm and pinned instead of loaded from a CDN.

### Security
- Two audit rounds: rules by prefix and caller, single-use three-day invites, company caps in the Worker, import guard for pasted data.

[Unreleased]: https://github.com/abizior-coder/Site-manager/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/abizior-coder/Site-manager/releases/tag/v0.9.0
