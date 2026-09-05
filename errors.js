// Every failure the app shows a person gets a code. The code is what a
// Polier reads off a phone over the phone, and what docs/ERROR_CODES.md
// explains. Classification is by the error's shape (Firestore codes, HTTP
// statuses, the Worker's messages), never by guessing at the cause.
//
// Pure: no DOM, no i18n. The panel adds the person's language on top.

export const ERROR_CODES = {
  // --- saving to the database --------------------------------------------
  E10: {
    tag: "SAVE-DENIED",
    group: "save",
    de: "Die Datenbank hat den Eintrag abgelehnt: kein Zugriff, oder das Foto ist grösser als 1 MB.",
    en: "The database refused the entry: no access, or the photo is over 1 MB.",
  },
  E11: {
    tag: "SAVE-OFFLINE",
    group: "save",
    de: "Keine Verbindung zur Datenbank. Der Eintrag wird gesendet, sobald das Netz zurück ist.",
    en: "No connection to the database. The entry is sent once the network is back.",
  },
  E12: {
    tag: "SAVE-TOO-BIG",
    group: "save",
    de: "Der Eintrag ist zu gross für ein Datenbankdokument (1 MB).",
    en: "The entry is too large for a database document (1 MB).",
  },
  E13: {
    tag: "SAVE-SIGNIN",
    group: "save",
    de: "Nicht mehr angemeldet. Abmelden und wieder anmelden.",
    en: "No longer signed in. Sign out and back in.",
  },
  E14: {
    tag: "SAVE-NO-COMPANY",
    group: "save",
    de: "Kein Firmenkonto geladen. App neu laden.",
    en: "No company loaded. Reload the app.",
  },
  E19: {
    tag: "SAVE-UNKNOWN",
    group: "save",
    de: "Speichern fehlgeschlagen, Grund unbekannt. Code und Text melden.",
    en: "Saving failed for an unknown reason. Report the code and text.",
  },
  // --- photos --------------------------------------------------------------
  E20: {
    tag: "PHOTO-DECODE",
    group: "photo",
    de: "Das Bild konnte nicht gelesen werden. Anderes Format wählen (JPEG) oder das Foto zuerst in der Galerie öffnen.",
    en: "The image could not be read. Try another format (JPEG) or open the photo in the gallery first.",
  },
  E21: {
    tag: "PHOTO-ENCODE",
    group: "photo",
    de: "Das Bild konnte nicht verkleinert werden.",
    en: "The image could not be re-encoded.",
  },
  // --- the AI proxy (scans, translations, inspection advisers) --------------
  E30: {
    tag: "AI-KEY",
    group: "ai",
    de: "Der Schlüssel zum KI-Dienst ist ungültig. Der Betreiber muss ihn erneuern.",
    en: "The AI service key is invalid. The operator must renew it.",
  },
  E31: {
    tag: "AI-LIMIT",
    group: "ai",
    de: "Tageslimit für KI-Anfragen erreicht (Konto oder Firma). Morgen wieder.",
    en: "The daily limit for AI requests is reached (account or company). Try tomorrow.",
  },
  E32: {
    tag: "AI-MEMBER",
    group: "ai",
    de: "Dieses Konto gehört nicht zur Firma, für die die Anfrage gestellt wurde.",
    en: "This account is not a member of the company the request was made for.",
  },
  E33: {
    tag: "AI-SIGNIN",
    group: "ai",
    de: "Die Anmeldung ist abgelaufen. Abmelden und wieder anmelden.",
    en: "The sign-in has expired. Sign out and back in.",
  },
  E34: {
    tag: "AI-ANSWER",
    group: "ai",
    de: "Der KI-Dienst hat keine brauchbare Antwort geliefert. Nochmals versuchen.",
    en: "The AI service gave no usable answer. Try again.",
  },
  E35: {
    tag: "AI-UNREACHABLE",
    group: "ai",
    de: "Der KI-Dienst ist nicht erreichbar (Netz oder Dienst gestört).",
    en: "The AI service cannot be reached (network or service down).",
  },
  E36: {
    tag: "AI-REQUEST",
    group: "ai",
    de: "Die Anfrage wurde abgelehnt (zu viele Bilder oder ungültiger Inhalt).",
    en: "The request was refused (too many images or invalid content).",
  },
  // --- languages ----------------------------------------------------------
  E40: {
    tag: "LANG-OFFLINE",
    group: "lang",
    de: "Diese Sprache wurde noch nie geladen und braucht einmal eine Verbindung.",
    en: "This language was never loaded and needs a connection once.",
  },
  // --- plans and documents (R2) ---------------------------------------------
  E50: {
    tag: "FILE-TYPE",
    group: "file",
    de: "Dieser Dateityp wird nicht angenommen (PDF und Bilder sind erlaubt).",
    en: "This file type is not accepted (PDF and images are allowed).",
  },
  E51: {
    tag: "FILE-TOO-BIG",
    group: "file",
    de: "Die Datei ist zu gross für den Upload.",
    en: "The file is too large to upload.",
  },
  E52: {
    tag: "FILE-DENIED",
    group: "file",
    de: "Kein Zugriff auf die Dateiablage dieser Firma.",
    en: "No access to this company's file store.",
  },
  E53: {
    tag: "FILE-UPLOAD",
    group: "file",
    de: "Upload fehlgeschlagen. Verbindung prüfen und nochmals versuchen.",
    en: "Upload failed. Check the connection and try again.",
  },
  // --- anything else --------------------------------------------------------
  E91: {
    tag: "CRASH",
    group: "other",
    de: "Die App ist auf einen unerwarteten Fehler gelaufen. Der Fehler wurde gemeldet; die Seite neu laden.",
    en: "The app hit an unexpected error. It has been reported; reload the page.",
  },
  E90: {
    tag: "UNKNOWN",
    group: "other",
    de: "Unerwarteter Fehler. Code und Text melden.",
    en: "Unexpected error. Report the code and text.",
  },
};

const FIRESTORE = {
  "permission-denied": "E10",
  unavailable: "E11",
  "deadline-exceeded": "E11",
  "resource-exhausted": "E12",
  "invalid-argument": "E12",
  unauthenticated: "E13",
};

function text(e) {
  if (!e) return "";
  if (typeof e === "string") return e;
  return String(e.message || e.error || e.code || "");
}

// { code, tag, group, detail } for an error thrown in a given context:
// "save" | "photo" | "ai" | "lang" | "file". The detail is the raw text,
// cut short, for the panel's small print and the report.
export function classifyError(e, context = "save") {
  const msg = text(e);
  const code = e && typeof e === "object" && typeof e.code === "string" ? e.code.replace(/^firestore\//, "") : "";
  const status = e && typeof e === "object" && Number(e.status) ? Number(e.status) : 0;
  let id = null;

  if (context === "photo") {
    if (/decode/i.test(msg)) id = "E20";
    else if (/encode/i.test(msg)) id = "E21";
  }
  if (!id && context === "lang") id = "E40";
  if (!id && context === "ai") {
    if (/Anthropic API error 401/.test(msg)) id = "E30";
    else if (/Anthropic API error 429|limit reached|too many requests/i.test(msg) || status === 429) id = "E31";
    else if (/not a member/i.test(msg) || status === 403) id = "E32";
    else if (/sign-in required|invalid or expired sign-in/i.test(msg) || status === 401) id = "E33";
    else if (/^empty$|JSON|no usable/i.test(msg)) id = "E34";
    else if (/Anthropic API error|proxy error 5|Failed to fetch|NetworkError|Load failed/i.test(msg)) id = "E35";
    else if (/proxy error 4|content|company missing|too many images/i.test(msg) || status === 400) id = "E36";
    else id = "E35";
  }
  if (!id && context === "file") {
    if (status === 415 || /type|refused/i.test(msg)) id = "E50";
    else if (status === 413 || /too large|too big/i.test(msg)) id = "E51";
    else if (status === 403 || /not a member|denied/i.test(msg)) id = "E52";
    else id = "E53";
  }
  if (!id) {
    if (code && FIRESTORE[code]) id = FIRESTORE[code];
    else if (/no company/i.test(msg)) id = "E14";
    else if (/Failed to fetch|NetworkError|offline|Load failed/i.test(msg)) id = "E11";
    else if (/exceeds|too large|maximum size|1048487/i.test(msg)) id = "E12";
    else id = context === "save" ? "E19" : context === "crash" ? "E91" : "E90";
  }
  const meta = ERROR_CODES[id];
  return { code: id, tag: meta.tag, group: meta.group, detail: (code ? `${code}: ` : "") + msg.slice(0, 160) };
}

// The one line to read out or paste when reporting.
export function errorReport({ code, tag, detail }, build) {
  return `${code} ${tag}${detail ? ` · ${detail}` : ""}${build ? ` · build ${build}` : ""}`;
}
