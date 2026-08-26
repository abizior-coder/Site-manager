// Swiss QR-bill (QR-Rechnung) payload generation.
//
// Follows the SIX "Swiss Implementation Guidelines QR-bill" v2.x layout: a
// fixed sequence of 31 lines terminated by the EPD trailer. Field ORDER and
// COUNT are what make a QR-bill scannable — a missing blank line shifts every
// later field and the bank rejects it — so the empty ultimate-creditor block
// below is deliberate, not dead weight.

import QRCode from "qrcode";

export const QR_CURRENCIES = ["CHF", "EUR"];

export function normaliseIban(iban) {
  return String(iban || "").replace(/\s+/g, "").toUpperCase();
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

// ISO 11649 creditor reference (SCOR). Gives the payment a structured
// reference for reconciliation without needing a QR-IBAN, which QRR would.
export function creditorReference(raw) {
  const base = String(raw || "").toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 21);
  if (!base) return "";
  const shifted = base + "RF00";
  const numeric = shifted.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (let i = 0; i < numeric.length; i++) remainder = (remainder * 10 + Number(numeric[i])) % 97;
  const check = String(98 - remainder).padStart(2, "0");
  return `RF${check}${base}`;
}

function amountForQr(amount) {
  const n = Number(amount);
  if (!isFinite(n) || n <= 0) return "";
  return n.toFixed(2);
}

function line(v) {
  // Newlines inside a field would desynchronise the whole payload.
  return String(v == null ? "" : v).replace(/[\r\n]+/g, " ").trim();
}

/**
 * Build the QR payload.
 * creditor/debtor: { name, street, buildingNumber, postalCode, town, country }
 */
export function buildQrPayload({ iban, creditor, debtor, amount, currency, reference, message }) {
  // SCOR demands a valid ISO 11649 reference — feeding a bare invoice number
  // through would produce a bill the bank rejects, so format it unless the
  // caller already supplied an RF reference.
  const rawRef = String(reference || "").trim().toUpperCase().replace(/\s+/g, "");
  const ref = !rawRef ? "" : /^RF\d{2}/.test(rawRef) ? rawRef : creditorReference(rawRef);
  const refType = ref ? "SCOR" : "NON";
  const hasDebtor = debtor && String(debtor.name || "").trim();

  const fields = [
    "SPC",                        // QRType
    "0200",                       // Version
    "1",                          // Coding type (UTF-8)
    normaliseIban(iban),          // Creditor IBAN

    "S",                          // Creditor address: structured
    line(creditor.name),
    line(creditor.street),
    line(creditor.buildingNumber),
    line(creditor.postalCode),
    line(creditor.town),
    line(creditor.country || "CH"),

    // Ultimate creditor — unused, but its seven blank lines must be present.
    "", "", "", "", "", "", "",

    amountForQr(amount),
    (currency || "CHF").toUpperCase(),

    // Ultimate debtor. Omitting the address type as well when there is no
    // debtor is required; a lone "S" with empty fields is invalid.
    hasDebtor ? "S" : "",
    hasDebtor ? line(debtor.name) : "",
    hasDebtor ? line(debtor.street) : "",
    hasDebtor ? line(debtor.buildingNumber) : "",
    hasDebtor ? line(debtor.postalCode) : "",
    hasDebtor ? line(debtor.town) : "",
    hasDebtor ? line(debtor.country || "CH") : "",

    refType,
    ref,
    line(message).slice(0, 140),
    "EPD",                        // Trailer
  ];

  return fields.join("\r\n");
}

// Rendered locally rather than through a QR image service: the payload carries
// an IBAN plus the customer's name and address, which should not be handed to
// a third party.
export async function qrDataUrl(payload) {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M", // mandated by the standard
    margin: 0,
    width: 512,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
}

// The Swiss cross belongs at the centre of the code; 7x7mm on a 46x46mm QR.
export const SWISS_CROSS_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
  '<rect width="100" height="100" fill="#000"/>' +
  '<rect x="5" y="5" width="90" height="90" fill="#fff" stroke="#fff" stroke-width="0"/>' +
  '<rect x="10" y="10" width="80" height="80" fill="#000"/>' +
  '<rect x="42" y="24" width="16" height="52" fill="#fff"/>' +
  '<rect x="24" y="42" width="52" height="16" fill="#fff"/>' +
  "</svg>";

export function validateBillingProfile(p) {
  const problems = [];
  if (!String(p.companyName || "").trim()) problems.push("qrErrName");
  if (!isSwissIban(p.iban)) problems.push("qrErrIban");
  if (!String(p.postalCode || "").trim() || !String(p.town || "").trim()) problems.push("qrErrAddress");
  return problems;
}
