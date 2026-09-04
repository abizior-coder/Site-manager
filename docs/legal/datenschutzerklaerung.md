# Datenschutzerklärung Site Log (Baustellenprotokoll)

Stand: 4. September 2026

## 1. Verantwortliche Stelle und Kontakt

Betreiber der Anwendung Site Log (nachfolgend «App») ist:

**Andrzej Bizior, Si‑Ma**
Stallikonerstrasse 41
8903 Birmensdorf
Schweiz
E‑Mail: a.bizior@pm.me

Für Fragen zum Datenschutz, für Auskunfts‑, Berichtigungs‑ oder
Löschbegehren wenden Sie sich an diese Adresse. Wir antworten in der Regel
innert 30 Tagen.

## 2. Zwei Rollen: Ihre Firma und wir

Die App wird von Betrieben des Dach‑ und Spenglergewerbes (nachfolgend
«Firma») für ihre Baustellen eingesetzt. Dabei gilt:

- **Die Firma** entscheidet, welche Baustellen, Stunden, Materialien,
  Fotos, Kunden und Notizen erfasst werden. Für diese Daten ist die Firma
  Verantwortliche im Sinne des Datenschutzgesetzes (DSG). Fragen zu diesen
  Daten richten Sie bitte zuerst an Ihre Firma.
- **Wir** betreiben die App und die dazugehörige Infrastruktur und
  bearbeiten diese Daten im Auftrag der Firma (Auftragsbearbeitung nach
  Art. 9 DSG). Die Firma schliesst mit uns dafür einen
  Auftragsbearbeitungsvertrag ab.
- Für die **Plattformdaten** (Benutzerkonten, Anmeldungen, Nutzungszahlen)
  sind wir selbst Verantwortliche.

## 3. Welche Daten bearbeitet werden

**Kontodaten:** E‑Mail‑Adresse, Anzeigename, Rolle in der Firma (Inhaber,
Polier, Mitarbeiter), gewählte Sprache, Zeitpunkt der Anmeldung. Ein Konto
entsteht, wenn Sie sich registrieren; einer Firma treten Sie mit einem
Einladungscode bei.

**Baustellendaten (im Auftrag der Firma):** Arbeitszeiten und Pausen,
Materialien und Werkzeuge, Bestellungen, Fahrten, Dachinspektionen mit
Checkliste und ersetzten Ziegeln, Notizen und deren Übersetzungen, Fotos,
Pläne und Dokumente, Rapporte mit Unterschrift des Kunden, Offerten und
Rechnungen, Kunden‑ und Kontaktdaten der Firma, Abwesenheiten,
Einteilungen. Alle Einträge tragen die Kennung der erfassenden Person.

**Profilangaben, die Sie selbst hinterlegen können:** Notfallkontakt,
Versicherungskarten, Zertifikate. Sie sind nur für Ihr Konto sichtbar.

**Standort:** Für das Wetter auf der Baustelle fragt die App auf Wunsch
den Gerätestandort ab. Es werden nur Koordinaten oder ein Ortsname an den
Wetterdienst übermittelt (siehe Ziffer 6); die App speichert keine
Bewegungsprofile.

**Nutzungszahlen:** Die App zählt, wie oft Funktionen genutzt werden
(zum Beispiel «Eintrag erfasst», «Bericht gesendet»), pro Firma und Tag.
Aktive Personen werden als gekürzter Hash des Kontos gezählt; Namen,
Texte oder Baustellen sind in diesen Zahlen nicht enthalten. Aufbewahrung:
400 Tage.

**Technische Daten:** Zugriffe auf unsere Serverfunktionen erfolgen über
Cloudflare; dabei werden IP‑Adresse und Zeitpunkt kurzzeitig für den
Betrieb und die Missbrauchsabwehr verarbeitet. Es gibt keine Werbe‑ oder
Trackingcookies. Die Anmeldung wird im Speicher Ihres Browsers gehalten;
ein Offline‑Zwischenspeicher hält die App selbst und die Daten Ihrer
Firma für die Arbeit ohne Netz.

## 4. Wofür und auf welcher Grundlage

Wir bearbeiten Daten, um die App bereitzustellen, die Firma bei der
Baustellendokumentation zu unterstützen, Missbrauch zu verhindern und die
App zu verbessern. Die Bearbeitung von Baustellendaten erfolgt auf
Weisung der Firma. Die Bearbeitung von Kontodaten ist für die Nutzung der
App erforderlich; Nutzungszahlen bearbeiten wir aus überwiegendem
Interesse an einem tragfähigen Betrieb, in einer Form, die keine Person
erkennbar macht.

## 5. KI‑Funktionen

Drei Funktionen senden Inhalte an einen KI‑Dienst (Anthropic, siehe
Ziffer 6), und zwar nur, wenn eine Person sie ausdrücklich auslöst:

- **Lieferschein und Vorher/Nachher scannen:** das gewählte Foto.
- **Notizen übersetzen:** der Text der Notiz. Beim Speichern einer Notiz
  wird sie automatisch in die Sprachen der Mannschaft übersetzt.
- **Dachinspektion an die Berater senden:** Beschreibung und Fotos der
  Inspektion.

Die Anfragen laufen über unsere eigene Serverfunktion, die den Zugang
prüft und die Anzahl Anfragen pro Konto und Firma begrenzt. Anthropic
verwendet Daten aus solchen Anfragen nach eigenen Angaben nicht zum
Training seiner Modelle. Wer die KI‑Funktionen nicht nutzen will, nutzt
sie nicht; die App funktioniert ohne sie.

## 6. Auftragsbearbeiter und Datenübermittlung ins Ausland

| Dienst | Zweck | Daten | Ort |
|---|---|---|---|
| Google Firebase (Google Ireland Ltd. / Google LLC) | Konten, Datenbank, Offline‑Synchronisation | Konto‑ und Baustellendaten | Google Cloud; Region gemäss Projekteinstellung, Auskunft auf Anfrage |
| Cloudflare, Inc. | Serverfunktionen (Zugangsprüfung, KI‑Weiterleitung, Nutzungszahlen, Pläne und Dokumente) | Anfragen, Nutzungszahlen, hochgeladene Dateien | weltweites Netz, Speicher mit Standortpräferenz EU |
| Anthropic, PBC | KI‑Funktionen nach Ziffer 5 | die jeweils gesendeten Fotos und Texte | USA |
| Open‑Meteo | Wetter | Koordinaten oder Ortsname, kein Konto | EU |
| GitHub, Inc. | Auslieferung der App‑Dateien | keine Personendaten | USA |

Für Übermittlungen in die USA stützen wir uns auf den Swiss‑U.S. Data
Privacy Framework, soweit der Anbieter zertifiziert ist, und andernfalls
auf Standarddatenschutzklauseln.

## 7. Wer Daten sehen kann

Baustellendaten sind nur für die Mitglieder der jeweiligen Firma sichtbar;
das wird auf dem Server durch Zugriffsregeln durchgesetzt, nicht nur in
der App. Inhaber und Poliere sehen die Daten aller Mitarbeiter ihrer Firma,
Mitarbeiter die Baustellen, auf denen sie arbeiten. Wer eine Firma
verlässt, wird vom Inhaber deaktiviert und verliert sofort den Zugriff.

## 8. Aufbewahrung und Löschung

- Baustellendaten: solange das Firmenkonto besteht, danach Löschung auf
  Verlangen der Firma.
- Kontodaten: bis zur Löschung des Kontos. Eine Löschung beantragen Sie
  per E‑Mail an die Adresse in Ziffer 1; wir löschen innert 30 Tagen.
- Unterschriebene Rapporte: sie sind nach der Unterschrift unveränderlich
  und werden nur zusammen mit dem Firmenkonto gelöscht.
- Nutzungszahlen: 400 Tage. Zähler zur Missbrauchsabwehr: 48 Stunden.

## 9. Ihre Rechte

Sie haben das Recht auf Auskunft, Berichtigung, Löschung und
Datenherausgabe nach DSG. Für Baustellendaten wenden Sie sich an Ihre
Firma, für Kontodaten an uns. Sie können sich zudem beim Eidgenössischen
Datenschutz‑ und Öffentlichkeitsbeauftragten (EDÖB) beschweren.

## 10. Sicherheit

Verbindungen sind verschlüsselt (TLS). Der Zugriff auf Daten ist an ein
angemeldetes Konto und die Mitgliedschaft in einer Firma gebunden und wird
serverseitig geprüft. Der Schlüssel zum KI‑Dienst liegt ausschliesslich in
unserer Serverfunktion. Die Zugriffsregeln wurden im September 2026
geprüft und werden bei jeder Änderung automatisch getestet.

## 11. Änderungen

Diese Erklärung wird bei Änderungen der App angepasst; die jeweils gültige
Fassung ist in der App verlinkt und trägt das Datum ihres Standes.
