// Quote and invoice money and status, in one place: the printed document,
// the on-screen summary, the QR-bill amount and the accounting export all
// read these, so they can never disagree.

export const DOC_STATUSES = {
  quote: [
    { key: "draft", labelKey: "docStatusDraft", color: "#6B7280" },
    { key: "sent", labelKey: "docStatusSent", color: "#6FB3D9" },
    { key: "accepted", labelKey: "docStatusAccepted", color: "#7FA65C" },
    { key: "declined", labelKey: "docStatusDeclined", color: "#E5484D" },
  ],
  invoice: [
    { key: "draft", labelKey: "docStatusDraft", color: "#6B7280" },
    { key: "open", labelKey: "docStatusOpen", color: "#E8B923" },
    { key: "partial", labelKey: "docStatusPartial", color: "#D08770" },
    { key: "paid", labelKey: "docStatusPaid", color: "#7FA65C" },
  ],
};

// Quote and invoice totals. Money is computed in one place so the printed
// document, the on-screen summary and the QR-bill amount can never disagree.
// Money is summed in integer Rappen: a hundred line items of 0.10 come to
// exactly 10.00, and the printed total, the QR-bill amount, the state and
// the accounting export agree to the Rappen.
export function toRappen(x) {
  return Math.round((parseFloat(x) || 0) * 100);
}
export function fromRappen(rp) {
  return (Number(rp) || 0) / 100;
}

export function documentTotals(doc) {
  const netRp = (doc.lineItems || []).reduce((sum, li) => {
    const qty = parseFloat(li.qty || 0) || 0;
    return sum + Math.round(toRappen(li.unitPrice) * qty);
  }, 0);
  const rate = parseFloat(doc.vatRate ?? 0) || 0;
  const vatRp = Math.round((netRp * rate) / 100);
  // Swiss invoices are rounded to 0.05 at the total.
  const grossRp = Math.round((netRp + vatRp) / 5) * 5;
  return { net: fromRappen(netRp), vat: fromRappen(vatRp), gross: fromRappen(grossRp), rate, netRp, vatRp, grossRp };
}

// Paid / partly paid / overdue is derived from the amount recorded against
// the invoice rather than stored separately, so a status can never drift out
// of step with the money actually received.
export function documentState(doc, today) {
  const totals = documentTotals(doc);
  const paidRp = toRappen(doc.paidAmount);
  const outstandingRp = Math.max(0, totals.grossRp - paidRp);
  const paid = fromRappen(paidRp);
  const outstanding = fromRappen(outstandingRp);
  let key = doc.status || "draft";
  if (doc.type === "invoice" && key !== "draft") {
    if (totals.grossRp > 0 && paidRp >= totals.grossRp) key = "paid";
    else if (paidRp > 0) key = "partial";
    else key = "open";
  }
  const overdue = doc.type === "invoice" && key !== "paid" && key !== "draft" && !!doc.dueDate && doc.dueDate < today;
  const set = DOC_STATUSES[doc.type] || DOC_STATUSES.invoice;
  const meta = set.find((s) => s.key === key) || set[0];
  return { key, meta, totals, paid, outstanding, overdue, paidRp, outstandingRp };
}
