// Hand the browser a file to save. The event goes first so a test (or a
// future "send by e-mail") can see the name and the text without a Blob.
export function downloadText(name, text, mime = "text/csv;charset=utf-8") {
  try { window.dispatchEvent(new CustomEvent("site-log:download", { detail: { name, text } })); } catch {}
  try {
    const body = mime.startsWith("text/csv") ? "\ufeff" + text : text;
    const blob = new Blob([body], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return true;
  } catch {
    return false;
  }
}
