import io, json

def patch(path, pairs):
    s = io.open(path, encoding="utf-8", newline="").read()
    for a, b, l in pairs:
        n = s.count(a)
        if n != 1: raise SystemExit(f"MISS {path} {l} ({n})")
        s = s.replace(a, b)
        print("ok", path, l)
    io.open(path, "w", encoding="utf-8", newline="").write(s)

patch("roofing-site-manager.jsx", [
('''// The job view and the photo tools are a chunk of their own, fetched the''',
 '''// Which build this page is: the shell names it, and a phone that shows an
// old number is a phone that has not restarted since the last deploy.
const SHELL_BUILD = (typeof document !== "undefined" && document.querySelector('meta[name="site-log-build"]')?.content) || "dev";

// The hard way out of a stale app: forget every worker and cache, then load
// afresh from the server. For the profile's "App neu laden" button.
async function forceReload() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) { console.warn("force reload:", e); }
  window.location.reload();
}

// The job view and the photo tools are a chunk of their own, fetched the''', "build + forceReload"),
# profile: version and the reload button above the privacy link
('''          <a data-privacy-link href="datenschutz.html" target="_blank" rel="noopener" style={{ color: COLORS.muted }} className="block w-full mt-3 text-center text-[10px] underline">{t.privacyLink}</a>''',
 '''          <div data-app-version style={{ color: COLORS.muted }} className="mt-4 text-center text-[10px]">{t.versionLabel} {SHELL_BUILD}</div>
          <button data-force-reload onClick={forceReload} style={{ color: COLORS.muted, border: `1px solid ${COLORS.border}` }} className="w-full mt-2 py-2 rounded-lg text-[11px] font-bold uppercase">{t.forceReloadBtn}</button>
          <a data-privacy-link href="datenschutz.html" target="_blank" rel="noopener" style={{ color: COLORS.muted }} className="block w-full mt-3 text-center text-[10px] underline">{t.privacyLink}</a>''', "profile version + reload"),
# sign-in footer: the build, small
('''            <a data-privacy-link href="datenschutz.html" target="_blank" rel="noopener" style={{ color: COLORS.amber }} className="underline">{t.privacyLink}</a>
          </div>''',
 '''            <a data-privacy-link href="datenschutz.html" target="_blank" rel="noopener" style={{ color: COLORS.amber }} className="underline">{t.privacyLink}</a>
            {" · "}<span data-app-version>{SHELL_BUILD}</span>
          </div>''', "sign-in build"),
])

patch("render.test.mjs", [
('''    check("owner: the profile links the privacy notice", !!link && link.getAttribute("href") === "datenschutz.html" && /Datenschutz/.test(link.textContent || ""), link ? link.outerHTML.slice(0, 120) : "no privacy link");''',
 '''    check("owner: the profile links the privacy notice", !!link && link.getAttribute("href") === "datenschutz.html" && /Datenschutz/.test(link.textContent || ""), link ? link.outerHTML.slice(0, 120) : "no privacy link");
    check("owner: the profile shows the build and offers a hard reload", /Version/.test(window.document.querySelector("[data-app-version]")?.textContent || "") && !!window.document.querySelector("[data-force-reload]"), "no version line or reload button");''', "version test"),
])

K = {
 "en": ("Version", "Reload app"), "de": ("Version", "App neu laden"), "gsw": ("Version", "App neu lade"), "fr": ("Version", "Recharger l'app"),
 "it": ("Versione", "Ricarica app"), "es": ("Versión", "Recargar app"), "pt": ("Versão", "Recarregar app"), "pl": ("Wersja", "Przeładuj aplikację"),
 "sq": ("Versioni", "Ringarko aplikacionin"), "ro": ("Versiune", "Reîncarcă aplicația"), "bg": ("Версия", "Презареди приложението"),
 "hu": ("Verzió", "App újratöltése"), "sk": ("Verzia", "Znovu načítať aplikáciu"), "cs": ("Verze", "Znovu načíst aplikaci"),
}
for code, (v, r) in K.items():
    f = f"i18n/{code}.json"
    d = json.load(io.open(f, encoding="utf-8"))
    d["versionLabel"] = v; d["forceReloadBtn"] = r
    io.open(f, "w", encoding="utf-8", newline="\n").write(json.dumps(d, indent=2, ensure_ascii=False) + "\n")
print("i18n keys added")
