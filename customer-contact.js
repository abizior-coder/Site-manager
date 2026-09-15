// The fallback rules a customer record's contact fields go through, now that
// several fields split in two without a migration (docs/specs/2026-09-09_
// customer-fields.md): a customer saved before this spec has only the old
// field, and every read site must keep working from it. Pure and tested so
// the four rules stay in one place instead of four copy-pasted `||` chains.

/**
 * @param {object} customer
 * @returns {{callNumber: string, whatsAppNumber: string, objectAddr: string, billingAddr: string}}
 */
export function customerContact(customer) {
  const c = customer || {};
  return {
    // Call may also try the office number; WhatsApp never can.
    callNumber: c.phoneMobile || c.phone || c.phoneOffice || "",
    whatsAppNumber: c.phoneMobile || c.phone || "",
    objectAddr: c.objectAddress || c.address || "",
    billingAddr: c.billingAddress || c.address || "",
  };
}
