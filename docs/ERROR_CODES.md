# Fehlercodes in Site Log

Jeder Fehler, den die App einer Person zeigt, trägt einen Code (gross, in
der Mitte des Bildschirms). Der Code ist das, was man am Telefon vorliest
oder mit «Code kopieren» in eine Nachricht einfügt. Die Zuordnung steht
in `errors.js`; diese Liste wird von einem Test gegen die Datei geprüft.

Aufbau: **E1x** Speichern in der Datenbank, **E2x** Fotos, **E3x**
KI‑Dienst (Scans, Übersetzungen, Inspektionsberater), **E4x** Sprachen,
**E5x** Pläne und Dokumente, **E9x** Übriges.

| Code | Kürzel | Bedeutung | Was tun |
|---|---|---|---|
| E10 | SAVE-DENIED | Die Datenbank hat den Eintrag abgelehnt (Regeln). Häufigste Ursache: ein Foto über 1 MB, oder das Konto gehört nicht (mehr) zur Firma. | Foto kleiner aufnehmen oder neu aufnehmen; sonst Inhaber fragen, ob das Konto aktiv ist. |
| E11 | SAVE-OFFLINE | Keine Verbindung zur Datenbank. | Nichts. Der Eintrag ist lokal gespeichert und wird gesendet, sobald das Netz zurück ist. |
| E12 | SAVE-TOO-BIG | Der Eintrag ist grösser als ein Datenbankdokument (1 MB). | Foto neu aufnehmen; Text kürzen. Sollte seit Build 2026-09-04 nicht mehr vorkommen (Fotos werden auf 900 KB gebracht). |
| E13 | SAVE-SIGNIN | Die Anmeldung ist abgelaufen. | Abmelden, wieder anmelden. |
| E14 | SAVE-NO-COMPANY | Kein Firmenkonto geladen. | App neu laden («Mein Profil» → «App neu laden»). |
| E19 | SAVE-UNKNOWN | Speichern fehlgeschlagen, Grund nicht zuzuordnen. | Code, Text und Build melden. |
| E20 | PHOTO-DECODE | Das Bild konnte nicht gelesen werden (Format, defekte Datei, HEIC ohne Umwandlung). | Foto als JPEG wählen oder zuerst in der Galerie öffnen und teilen. |
| E21 | PHOTO-ENCODE | Das Bild konnte nicht verkleinert werden. | Anderes Foto versuchen; Code melden. |
| E30 | AI-KEY | Der Schlüssel zum KI‑Dienst ist ungültig. | Nur der Betreiber kann das beheben (`wrangler secret put ANTHROPIC_API_KEY`). |
| E31 | AI-LIMIT | Tageslimit erreicht: 200 Anfragen pro Konto, 600 pro Firma, 20 pro Minute. | Morgen wieder, oder Betreiber um höhere Grenzen bitten. |
| E32 | AI-MEMBER | Das Konto gehört nicht zur Firma, für die die Anfrage gestellt wurde. | Inhaber fragen; App neu laden. |
| E33 | AI-SIGNIN | Die Anmeldung ist abgelaufen oder ungültig. | Abmelden, wieder anmelden. |
| E34 | AI-ANSWER | Der KI‑Dienst hat geantwortet, aber nichts Brauchbares. | Nochmals versuchen; bei Scans ein schärferes Foto. |
| E35 | AI-UNREACHABLE | Der KI‑Dienst oder unser Proxy ist nicht erreichbar. | Verbindung prüfen; später nochmals. Hält es an: Betreiber melden. |
| E36 | AI-REQUEST | Die Anfrage wurde abgelehnt (zu viele Bilder, ungültiger Inhalt). | Weniger Bilder (max. 4) pro Scan. |
| E40 | LANG-OFFLINE | Die gewählte Sprache wurde noch nie geladen und braucht einmal Netz. | Mit Verbindung nochmals wählen; danach geht es offline. |
| E50 | FILE-TYPE | Dateityp wird nicht angenommen. | PDF oder Bild hochladen. |
| E51 | FILE-TOO-BIG | Datei zu gross für den Upload. | Kleiner speichern (PDF komprimieren). |
| E52 | FILE-DENIED | Kein Zugriff auf die Dateiablage der Firma. | Inhaber fragen, ob das Konto aktiv ist. |
| E53 | FILE-UPLOAD | Upload fehlgeschlagen. | Verbindung prüfen, nochmals versuchen. |
| E90 | UNKNOWN | Unerwarteter Fehler. | Code, Text und Build melden. |
| E91 | CRASH | Ein nicht abgefangener Fehler in der App (Absturz). Wird automatisch mit Build und Fehlertext an den Server gemeldet; der Inhaber sieht ihn im Cockpit unter «Fehler». | Seite neu laden; wenn es wiederkommt, Code und Build melden. |

## Was eine Meldung enthalten soll

«Code kopieren» im Fehlerfeld liefert eine Zeile wie
`E10 SAVE-DENIED · permission-denied: Missing or insufficient permissions · build 1b3c663020`.
Diese Zeile genügt.

## Woher der Build kommt

Die Nummer steht unter «Mein Profil» und unten auf dem Anmeldebildschirm.
Zeigt ein Telefon eine ältere Nummer als die im Repository (`index.html`,
`<meta name="site-log-build">`), hat es die neue Version noch nicht geladen:
«Mein Profil» → «App neu laden».
