// The sentence behind each error code, German and English, loaded by the
// error panel when it opens (docs/ERROR_CODES.md is the reference). Kept out
// of the first paint on purpose.
export const ERROR_TEXT = {
  E10: {
    de: "Die Datenbank hat den Eintrag abgelehnt: kein Zugriff, oder das Foto ist grösser als 1 MB.",
    en: "The database refused the entry: no access, or the photo is over 1 MB.",
  },
  E11: {
    de: "Keine Verbindung zur Datenbank. Der Eintrag wird gesendet, sobald das Netz zurück ist.",
    en: "No connection to the database. The entry is sent once the network is back.",
  },
  E12: {
    de: "Der Eintrag ist zu gross für ein Datenbankdokument (1 MB).",
    en: "The entry is too large for a database document (1 MB).",
  },
  E13: { de: "Nicht mehr angemeldet. Abmelden und wieder anmelden.", en: "No longer signed in. Sign out and back in." },
  E14: { de: "Kein Firmenkonto geladen. App neu laden.", en: "No company loaded. Reload the app." },
  E19: {
    de: "Speichern fehlgeschlagen, Grund unbekannt. Code und Text melden.",
    en: "Saving failed for an unknown reason. Report the code and text.",
  },
  E20: {
    de: "Das Bild konnte nicht gelesen werden. Anderes Format wählen (JPEG) oder das Foto zuerst in der Galerie öffnen.",
    en: "The image could not be read. Try another format (JPEG) or open the photo in the gallery first.",
  },
  E21: { de: "Das Bild konnte nicht verkleinert werden.", en: "The image could not be re-encoded." },
  E30: {
    de: "Der Schlüssel zum KI-Dienst ist ungültig. Der Betreiber muss ihn erneuern.",
    en: "The AI service key is invalid. The operator must renew it.",
  },
  E31: {
    de: "Tageslimit für KI-Anfragen erreicht (Konto oder Firma). Morgen wieder.",
    en: "The daily limit for AI requests is reached (account or company). Try tomorrow.",
  },
  E32: {
    de: "Dieses Konto gehört nicht zur Firma, für die die Anfrage gestellt wurde.",
    en: "This account is not a member of the company the request was made for.",
  },
  E33: {
    de: "Die Anmeldung ist abgelaufen. Abmelden und wieder anmelden.",
    en: "The sign-in has expired. Sign out and back in.",
  },
  E34: {
    de: "Der KI-Dienst hat keine brauchbare Antwort geliefert. Nochmals versuchen.",
    en: "The AI service gave no usable answer. Try again.",
  },
  E35: {
    de: "Der KI-Dienst ist nicht erreichbar (Netz oder Dienst gestört).",
    en: "The AI service cannot be reached (network or service down).",
  },
  E36: {
    de: "Die Anfrage wurde abgelehnt (zu viele Bilder oder ungültiger Inhalt).",
    en: "The request was refused (too many images or invalid content).",
  },
  E40: {
    de: "Diese Sprache wurde noch nie geladen und braucht einmal eine Verbindung.",
    en: "This language was never loaded and needs a connection once.",
  },
  E50: {
    de: "Dieser Dateityp wird nicht angenommen (PDF und Bilder sind erlaubt).",
    en: "This file type is not accepted (PDF and images are allowed).",
  },
  E51: { de: "Die Datei ist zu gross für den Upload.", en: "The file is too large to upload." },
  E52: { de: "Kein Zugriff auf die Dateiablage dieser Firma.", en: "No access to this company's file store." },
  E53: {
    de: "Upload fehlgeschlagen. Verbindung prüfen und nochmals versuchen.",
    en: "Upload failed. Check the connection and try again.",
  },
  E91: {
    de: "Die App ist auf einen unerwarteten Fehler gelaufen. Der Fehler wurde gemeldet; die Seite neu laden.",
    en: "The app hit an unexpected error. It has been reported; reload the page.",
  },
  E92: {
    de: "Die geöffnete App ist eine Version hinter dem Server. Seite neu laden — dann passt es wieder.",
    en: "The open app is one version behind the server. Reload the page and it matches again.",
  },
  E90: { de: "Unerwarteter Fehler. Code und Text melden.", en: "Unexpected error. Report the code and text." },
};
