// Every failure the app shows a person gets a code. The code is what a
// Polier reads off a phone over the phone, and what docs/ERROR_CODES.md
// explains. Classification is by the error's shape (Firestore codes, HTTP
// statuses, the Worker's messages), never by guessing at the cause.
//
// Pure: no DOM, no i18n. The panel adds the person's language on top; the
// sentences behind each code live in errors-text.js, loaded when a panel
// opens, so the table here costs the first paint only the codes.

export const ERROR_CODES = {
  // --- saving to the database --------------------------------------------
  E10: {
    tag: "SAVE-DENIED",
    group: "save",
  },
  E11: {
    tag: "SAVE-OFFLINE",
    group: "save",
  },
  E12: {
    tag: "SAVE-TOO-BIG",
    group: "save",
  },
  E13: {
    tag: "SAVE-SIGNIN",
    group: "save",
  },
  E14: {
    tag: "SAVE-NO-COMPANY",
    group: "save",
  },
  E19: {
    tag: "SAVE-UNKNOWN",
    group: "save",
  },
  // --- photos --------------------------------------------------------------
  E20: {
    tag: "PHOTO-DECODE",
    group: "photo",
  },
  E21: {
    tag: "PHOTO-ENCODE",
    group: "photo",
  },
  // --- the AI proxy (scans, translations, inspection advisers) --------------
  E30: {
    tag: "AI-KEY",
    group: "ai",
  },
  E31: {
    tag: "AI-LIMIT",
    group: "ai",
  },
  E32: {
    tag: "AI-MEMBER",
    group: "ai",
  },
  E33: {
    tag: "AI-SIGNIN",
    group: "ai",
  },
  E34: {
    tag: "AI-ANSWER",
    group: "ai",
  },
  E35: {
    tag: "AI-UNREACHABLE",
    group: "ai",
  },
  E36: {
    tag: "AI-REQUEST",
    group: "ai",
  },
  // --- languages ----------------------------------------------------------
  E40: {
    tag: "LANG-OFFLINE",
    group: "lang",
  },
  // --- plans and documents (R2) ---------------------------------------------
  E50: {
    tag: "FILE-TYPE",
    group: "file",
  },
  E51: {
    tag: "FILE-TOO-BIG",
    group: "file",
  },
  E52: {
    tag: "FILE-DENIED",
    group: "file",
  },
  E53: {
    tag: "FILE-UPLOAD",
    group: "file",
  },
  // --- anything else --------------------------------------------------------
  E91: {
    tag: "CRASH",
    group: "other",
  },
  E92: {
    tag: "STALE",
    group: "other",
  },
  E90: {
    tag: "UNKNOWN",
    group: "other",
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
