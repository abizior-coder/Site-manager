# The Swiss field: who already sells this, and what is left

**Date:** 2026-09-06. **Why:** the research of 2026-09-04 compared Site Log
with plancraft and ToolTime, both German-market tools, and never looked at
Switzerland. The claims built on it ("functionally ahead of the
competition") were not supported. This is the correction, from the vendors'
own product pages (fetched today), not from marketing summaries.

## Who is there

| Vendor (CH) | Aimed at | What it covers | Crew app / offline | UI languages published | Price (public) |
|---|---|---|---|---|---|
| **ORBIT Informatik, ALBAU-Plus / ALBAU-Flex / OF-4000 / OF-Bau** ([branchensoftware](https://www.orbitag.ch/branchensoftware/)) | *by name* Sanitär, Heizung, Spenglerei, **Bedachung**, Fassadenbau | Ausschreibung (NPK/CRB), Offerte, Vertrag, Rechnung mit QR, Vor-/Nachkalkulation, Verbandsdaten (suissetec, **Gebäudehülle Schweiz**, CRB), Sage/Infoniqa accounting, on-premise or cloud | "mobile Rapporterfassung mit Tablet (iOS, Android)", Zeiterfassung app | German (nothing else published) | not published (classic ERP licence) |
| **SORBA** ([Leistungserfassung](https://www.sorba.ch/software/leistungserfassung)) | Bauhauptgewerbe and, *by name*, "Spengler, Photovoltaik-Installateure, **Dachdecker**" | Tagesrapport (Personal, Material, Inventar, Fremdleistungen), Stundenkarte with Zulagen/Spesen automation, Lieferscheinkontrolle, Wochenrapport, billing and accounting in one suite | mySORBA / SORBA Zeit / myRapport apps (App Store) | **Deutsch, Englisch, Französisch, Italienisch** (App Store listing) | not published |
| **Werkli** ([Dachdecker page](https://werkli.ch/branchen/dachdecker), [home](https://werkli.ch/)) | 16 trades incl. **Dachdecker**, Fassadenbau, Gerüstbau | Rapport, Zeiterfassung, Offerte, **QR-Rechnung aus dem Rapport**, Fotos, Material, Einsatzplanung, Kundenunterschrift, Buchhaltung + Mahnwesen, digitales Aufmass, **Blechabwicklungen**, Bautagebuch | app + web, **offline** ("speichert alles lokal") | German only visible | **Solo CHF 50**, **Trupp CHF 80** (1 office + 3 mobile), **Mannschaft CHF 170** (2 office + 7 mobile) per month; Swiss servers |
| **noovi** ([home](https://noovi.ch/), [Preise](https://noovi.ch/preise), [Rapporte](https://noovi.ch/funktionen/rapporte)) | 12 trades incl. **Dachdecker** | Rapporte mit Unterschrift + PDF-Mail, Zeiterfassung, Offerten, Rechnungen, Aufmass, Baustellenchat, Bautagebuch, Abnahmeprotokolle, Aufgaben, Lager/Werkzeug/Maschinen/Fahrzeuge, Material, Urlaub/Krankmeldung, **KI: dictate a Rapport, fields fill themselves** | iOS/Android + web, offline (App Store text), Swiss servers, "über 1000 KMUs" | App Store listing: **Deutsch, Englisch**; "multilingual support" sold in Pro/Premium, languages not published | **CHF 19 / 39 / 49 per user/month**; whitelabel app CHF 5,900 |
| **Baunex** ([Rapport](https://baunex.ch/features/rapport/), [FAQ](https://baunex.ch/faq/)) | all trades, pages for Sanitär, Elektro, Maler/Gipser | Rapport in 3 clicks, **voice in dialect**, **OCR of Lieferscheine**, Kundenunterschrift, AI customer pre-fill, "GAV-/ArG-konform", two-way **bexio**, Abacus/Lexware export, REST API, onboarding 1–2 weeks | iOS/Android, offline | **Deutsch, Français, Italiano** | "ab CHF 24 pro Benutzer/Monat" (Rapport page); FAQ: annual licence, price on request, migration CHF 349 |
| **BRIXX** ([home](https://brixx.ch/handwerkersoftware-die-rockt)) | Maler, Gipser, Plattenleger, Gartenbau, Bau, Bodenleger, Gerüstbau, Metallbau | Regierapport mit Unterschrift, Ausmass, SIA 451 / CRBX, QR-Rechnung, Baudokumentation (Pläne, Fotos, Lieferscheine), Zeiterfassung, Einsatzplanung; founded 2018, "über 500 Handwerksprofis" | web app on any device, hosted in CH | German | **CHF 150/month flat** (CHF 175 with SIA 451), any team size |
| **Technoova** (Techloom, Zürich; [article](https://techloom.ch/blog/erp-software-bau-schweiz)) | Bau- und Handwerksbetriebe | Personaleinsatzplanung, Fahrzeug-/Geräteverwaltung, Zeiterfassung, conflict detection | web + app, CH hosting | German | not published |
| *(not Swiss)* **Jobilino** ([languages page](https://www.jobilino.com/mehrsprachige-app-fuer-internationale-teams/)) | DACH construction/cleaning/service, developed in Austria | Zeiterfassung (NFC), Projektzeit, Bautagebuch | apps | **21 languages** incl. Albanisch, Portugiesisch, Polnisch, Rumänisch, Bulgarisch, Ungarisch, Slowakisch, Tschechisch | not published; no QR-Rechnung/GAV |

## What Site Log has, and whether anyone else shows it

| Site Log feature | Also in | Verdict |
|---|---|---|
| Rapport with signature, Zeiterfassung, Fotos, Material per job | every vendor above | table stakes |
| QR-Rechnung, Offerte → Rechnung, bexio push | Werkli, Baunex (two-way), BRIXX, ALBAU, SORBA | table stakes |
| Offline | Werkli, Baunex, noovi | table stakes |
| AI: scan a Lieferschein, dictate, translate | Baunex (OCR + dialect voice), noovi (voice) | **not a moat** |
| GAV break/hour logic | Baunex claims "GAV-/ArG-konform", SORBA automates Zulagen/Stundenkarte | claimed by others; ours is specific to GAV Gebäudehülle, unverified against theirs |
| Roof inspection with tile reference and waste weight, transport log with Mulden | not seen at any vendor (ALBAU has calculation, Werkli has Aufmass/Blechabwicklung) | niche, possibly unique, value unproven |
| **14 crew languages incl. Schwiizerdütsch, Albanisch, Portugiesisch, Polnisch, Rumänisch, Bulgarisch, Ungarisch, Slowakisch, Tschechisch; notes auto-translated for every reader** | SORBA DE/EN/FR/IT; Baunex DE/FR/IT; Werkli/BRIXX/ALBAU German; noovi DE/EN (App Store); Jobilino 21 languages but Austrian, time-tracking only, no Swiss billing | the only visible gap among the Swiss vendors — **and it is a gap only if firms will pay for it**, which nobody has asked them yet |
| Price idea in the value plan: CHF 290/firm/month up to 10 seats | Werkli Mannschaft CHF 170 for 9 licences, BRIXX CHF 150 flat, noovi CHF 39/user | **above the market** for less product and no support organisation |

## Market size (roofing and Spengler only)

- Gebäudehülle Schweiz: "über 700" member firms ([Bauenschweiz](https://www.bauenschweiz.ch/de/news/meldungen/Unsere-Mitglieder-Gebaeudehuelle-Schweiz.php)); the sector under the GAV counts roughly **850 firms and 4,000 employees** ([Syna](https://syna.ch/arbeit/branchen/gebaeudehuelle)). Spengler firms sit under suissetec on top of that; a few hundred more.
- Average firm: under five employees. Even an optimistic 10 % of the GAV sector at a market price of CHF 100 per firm and month is **≈ CHF 100,000 a year**. Roofing alone does not carry a multi-million product; growing beyond roofing means meeting the six vendors above head-on.

## What follows

1. The "ahead of the competition" line is withdrawn. PROJECT.md gets this
   file as the reference for any product or pricing decision.
2. The value plan's price (CHF 290/firm/month) is not defensible; if the
   product is ever sold it sits at Werkli/BRIXX level or below.
3. The one visible gap — a crew interface in the crews' own languages,
   with the office side left to whatever the firm already runs — is a
   **hypothesis**, to be tested by talking to roofing firms, not by more
   code. Ten conversations (owners and Poliere, Gebäudehülle Schweiz
   members, supplier reps) answer it in four weeks: what do you run, do
   your crews use it, in which language, what do you pay, what would you
   pay for a crew app that feeds it.
4. Until that answer exists: no billing, no landing page, no private
   server, no further features for sale. The app keeps running for the
   owner's own firm, where it already pays for itself.
