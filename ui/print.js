// The documents the app opens in a new tab (reports, the signed Rapport, the
// projects report) are meant to be printed or saved as PDF. This is the
// chrome they share: a toolbar with a print button that vanishes on paper,
// and a call to `window.print()` once the page has loaded, so «Als PDF
// speichern» reaches the print sheet instead of a page the person has to
// know how to print.
const esc = (v) =>
  String(v == null ? "" : v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function printChrome({ printLabel = "Print", closeLabel = "Close", autoPrint = true } = {}) {
  return (
    `<style>.no-print{position:sticky;top:0;display:flex;gap:8px;justify-content:flex-end;padding:10px 12px;background:#f3f3f1;border-bottom:1px solid #ddd;font-family:-apple-system,system-ui,sans-serif}` +
    `.no-print button{font:inherit;font-size:14px;font-weight:700;padding:10px 16px;border-radius:8px;border:1px solid #ccc;background:#fff;color:#111;cursor:pointer;min-height:44px}` +
    `.no-print button.primary{background:#DA291C;border-color:#DA291C;color:#fff}` +
    `@media print{.no-print{display:none !important}}</style>` +
    `<div class="no-print"><button type="button" onclick="window.close()">${esc(closeLabel)}</button>` +
    `<button type="button" class="primary" onclick="window.print()">${esc(printLabel)}</button></div>` +
    (autoPrint
      ? `<script>window.addEventListener("load",function(){setTimeout(function(){try{window.print()}catch(e){}},300)});</script>`
      : "")
  );
}

// Puts the chrome at the top of the body of a finished HTML document.
export function withPrintChrome(html, opts) {
  const chrome = printChrome(opts);
  const i = html.indexOf("<body>");
  if (i < 0) return chrome + html;
  return html.slice(0, i + 6) + chrome + html.slice(i + 6);
}
