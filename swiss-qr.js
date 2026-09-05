// Swiss QR-bill (QR-Rechnung) payload generation.
//
// Follows the SIX "Swiss Implementation Guidelines QR-bill" v2.x layout: a
// fixed sequence of 31 lines terminated by the EPD trailer. Field ORDER and
// COUNT are what make a QR-bill scannable — a missing blank line shifts every
// later field and the bank rejects it — so the empty ultimate-creditor block
// below is deliberate, not dead weight.

// The payload, the code image and the Swiss cross live in swiss-qr-bill.js,
// loaded only when a bill is printed; this file is the validation that the
// billing form needs at render time.

export const QR_CURRENCIES = ["CHF", "EUR"];

export function normaliseIban(iban) {
  return String(iban || "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

// IBAN check per ISO 7064 mod 97-10. Catches the typo that would otherwise
// produce a QR-bill that scans but pays the wrong account.
export function isValidIban(raw) {
  const iban = normaliseIban(raw);
  if (!/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (let i = 0; i < numeric.length; i++) remainder = (remainder * 10 + Number(numeric[i])) % 97;
  return remainder === 1;
}

// A Swiss QR-bill needs a CH/LI account.
export function isSwissIban(raw) {
  const iban = normaliseIban(raw);
  return /^(CH|LI)/.test(iban) && isValidIban(iban);
}

export function validateBillingProfile(p) {
  const problems = [];
  if (!String(p.companyName || "").trim()) problems.push("qrErrName");
  if (!isSwissIban(p.iban)) problems.push("qrErrIban");
  if (!String(p.postalCode || "").trim() || !String(p.town || "").trim()) problems.push("qrErrAddress");
  return problems;
}
