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
export function documentTotals(doc) {
  const net = (doc.lineItems || []).reduce((sum, li) => {
    const qty = parseFloat(li.qty || 0) || 0;
    const price = parseFloat(li.unitPrice || 0) || 0;
    return sum + qty * price;
  }, 0);
  const rate = parseFloat(doc.vatRate ?? 0) || 0;
  const vat = net * (rate / 100);
  // Swiss invoices are rounded to 0.05 at the total.
  const gross = Math.round((net + vat) * 20) / 20;
  return { net, vat, gross, rate };
}

// Paid / partly paid / overdue is derived from the amount recorded against
// the invoice rather than stored separately, so a status can never drift out
// of step with the money actually received.
export function documentState(doc, today) {
  const totals = documentTotals(doc);
  const paid = parseFloat(doc.paidAmount || 0) || 0;
  const outstanding = Math.max(0, Math.round((totals.gross - paid) * 100) / 100);
  let key = doc.status || "draft";
  if (doc.type === "invoice" && key !== "draft") {
    if (totals.gross > 0 && paid >= totals.gross) key = "paid";
    else if (paid > 0) key = "partial";
    else key = "open";
  }
  const overdue = doc.type === "invoice" && key !== "paid" && key !== "draft" && !!doc.dueDate && doc.dueDate < today;
  const set = DOC_STATUSES[doc.type] || DOC_STATUSES.invoice;
  const meta = set.find((s) => s.key === key) || set[0];
  return { key, meta, totals, paid, outstanding, overdue };
}
