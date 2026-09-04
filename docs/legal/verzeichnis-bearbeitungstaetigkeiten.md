# Verzeichnis der Bearbeitungstätigkeiten (Art. 12 DSG)

Verantwortlicher: Andrzej Bizior, Si‑Ma, Stallikonerstrasse 41,
8903 Birmensdorf, a.bizior@pm.me. Stand 4. September 2026.

Das Verzeichnis ist für Betriebe unter 250 Mitarbeitenden nicht
vorgeschrieben; es wird geführt, weil Kunden es verlangen und weil es die
Grundlage der Datenschutzerklärung und der AVV ist.

## 1. Benutzerkonten und Anmeldung

| | |
|---|---|
| Zweck | Zugang zur App, Zuordnung von Einträgen zu Personen |
| Kategorien betroffener Personen | Nutzer der App (Mitarbeitende und Inhaber der Kundenfirmen) |
| Datenkategorien | E‑Mail, Anzeigename, Rolle, Sprache, Firmenzugehörigkeit, Zeitpunkte der Anmeldung |
| Empfänger | Google Firebase (Auftragsbearbeiter) |
| Auslandübermittlung | Google Cloud, Region gemäss Projekteinstellung; DPF / Standardklauseln |
| Aufbewahrung | bis zur Löschung des Kontos |
| Sicherheit | siehe AVV Anhang 3 |

## 2. Baustellendaten der Kundenfirmen (Auftragsbearbeitung)

| | |
|---|---|
| Rolle | Auftragsbearbeiter für die jeweilige Firma |
| Zweck | Baustellendokumentation gemäss Weisung der Firma |
| Datenkategorien | Arbeitszeiten, Einträge, Fotos, Pläne, Rapporte, Offerten, Rechnungen, Kundenkontakte, Abwesenheiten, Einteilungen |
| Empfänger | Google Firebase, Cloudflare (Dateien), Anthropic (nur bei ausgelösten KI‑Funktionen) |
| Auslandübermittlung | siehe AVV Anhang 2 |
| Aufbewahrung | solange das Firmenkonto besteht |

## 3. KI‑Funktionen

| | |
|---|---|
| Zweck | Scannen von Lieferscheinen, Übersetzen von Notizen, Inspektionsberichte |
| Auslöser | ausdrückliche Handlung einer Person in der App (Übersetzung beim Speichern einer Notiz automatisch für die Mannschaftssprachen) |
| Datenkategorien | die gesendeten Fotos und Texte |
| Empfänger | Anthropic über die eigene Serverfunktion bei Cloudflare |
| Auslandübermittlung | USA; DPF / Standardklauseln |
| Aufbewahrung | keine eigene; Ergebnisse werden bei der Firma gespeichert |

## 4. Nutzungszahlen

| | |
|---|---|
| Zweck | Betrieb und Weiterentwicklung; Nachweis der Nutzung gegenüber der Firma |
| Datenkategorien | Zähler pro Firma und Tag je Ereignisart; aktive Personen als gekürzter Hash der Kontokennung |
| Empfänger | Cloudflare KV |
| Aufbewahrung | 400 Tage |
| Bemerkung | keine Namen, Texte oder Baustellen; keine Profilbildung |

## 5. Missbrauchsabwehr und technische Protokolle

| | |
|---|---|
| Zweck | Begrenzung der KI‑Anfragen, Abwehr von Missbrauch |
| Datenkategorien | Kontokennung, Firmenkennung, Zähler; IP‑Adresse und Zeitpunkt in den Zugriffsprotokollen von Cloudflare |
| Aufbewahrung | Zähler 48 Stunden; Protokolle gemäss Anbieter, kurzfristig |

## 6. Kontakt und Support

| | |
|---|---|
| Zweck | Beantwortung von Anfragen, Auskunfts‑ und Löschbegehren |
| Datenkategorien | Absender, Inhalt der Anfrage |
| Empfänger | E‑Mail‑Anbieter des Verantwortlichen (Proton, Schweiz) |
| Aufbewahrung | bis zur Erledigung, längstens zwei Jahre |
