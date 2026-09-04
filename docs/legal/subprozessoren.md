# Unterauftragsbearbeiter (Subprozessoren) von Site Log

Stand 4. September 2026. Diese Liste ist Anhang 2 des AVV und wird bei
jeder Änderung mit 30 Tagen Vorlauf an die Inhaber der Firmenkonten
gemeldet. Die Liste ist aus dem Code abgeleitet, nicht aus dem
Gedächtnis: jeder Eintrag entspricht einer Stelle, an der die App oder
ihre Serverfunktion Daten an einen Dritten sendet.

| Anbieter | Leistung | Welche Daten | Wann | Ort | Grundlage |
|---|---|---|---|---|---|
| **Google** (Firebase Authentication, Cloud Firestore) — Google Ireland Ltd., Gordon House, Barrow Street, Dublin 4, Irland | Konten und Anmeldung; Datenbank mit Offline‑Cache | Konten; alle Firmendaten ausser hochgeladene Dateien | dauernd | Google Cloud, Region gemäss Projekteinstellung (Auskunft auf Anfrage) | Data Processing Terms von Google; DPF / Standardklauseln |
| **Cloudflare, Inc.**, 101 Townsend St, San Francisco, CA 94107, USA (Workers, KV, R2) | Serverfunktion: Prüfung der Anmeldung, Weiterleitung an die KI, Nutzungszähler, Ablage von Plänen und Dokumenten | Anfragen mit Kontokennung; Zähler; hochgeladene Dateien (Pläne, PDF, Bilder) | bei jeder KI‑Anfrage, jedem Datei‑Upload, jeder Nutzungsmeldung | weltweites Netz; R2 mit Standortpräferenz EU | Cloudflare DPA; DPF / Standardklauseln |
| **Anthropic, PBC**, 548 Market St, San Francisco, CA 94104, USA | KI‑Modell für Lieferschein‑Scan, Vorher/Nachher‑Vergleich, Übersetzung von Notizen, Inspektionsberichte | die jeweils gesendeten Fotos und Texte | nur bei ausgelöster Funktion | USA | Commercial Terms; keine Nutzung zum Training gemäss Anbieter; DPF / Standardklauseln |
| **Open‑Meteo** (Open‑Meteo.com, Schweiz/EU) | Wetter auf der Baustelle | Koordinaten oder Ortsname | bei geöffnetem Heute‑Tab | EU | keine Personendaten im engeren Sinn, kein Konto |
| **GitHub, Inc.** (GitHub Pages) | Auslieferung der App‑Dateien | keine Firmendaten; Zugriffsprotokolle des Anbieters | beim Laden der App | USA | Standardklauseln |

Nicht auf der Liste, weil keine Daten dorthin gehen: Tailwind (wird beim
Bauen der App erzeugt, kein Laufzeitdienst), Lucide (Icons im Bundle).

Vom Betreiber selbst genutzt, ohne Firmendaten: Proton (E‑Mail des
Betreibers, Schweiz).
