import io, json, re

def patch(path, pairs):
    s = io.open(path, encoding="utf-8", newline="").read()
    for a, b, l in pairs:
        n = s.count(a)
        if n != 1: raise SystemExit(f"MISS {path} {l} ({n})")
        s = s.replace(a, b)
        print("ok", path, l)
    io.open(path, "w", encoding="utf-8", newline="").write(s)

P = "tabs/ProjectDetail.jsx"
s = io.open(P, encoding="utf-8", newline="").read()
CARD = '''<div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4 mb-4">'''

# --- icons, props, state ------------------------------------------------------
s, k = re.subn(r'^import \{ Camera, ', 'import { Camera, Clock, LayoutGrid, MessageSquare, ', s, count=1, flags=re.M)
assert k == 1, "lucide import"
s = s.replace("onOpenPhoto, onInspect, onEditInspection, canEditInspection, t }) {",
              "onOpenPhoto, onInspect, onEditInspection, canEditInspection, currentUid, t }) {", 1)
s = s.replace('''  const langLabel = (code) => (LANGS.find((l) => l.code === code) || {}).label || code.toUpperCase();''',
'''  const langLabel = (code) => (LANGS.find((l) => l.code === code) || {}).label || code.toUpperCase();
  const memberName = (uid) => ((roster || []).find((m) => m.uid === uid) || {}).name || "";
  // The hub: one tab open at a time, Übersicht whenever another job opens.
  const [hubTab, setHubTab] = useState("overview");
  useEffect(() => { setHubTab("overview"); }, [project?.id]);
  // Unread chat: messages by others newer than this reader's last look at
  // this job's chat, remembered on the device.
  const seenKey = project ? `site-log-chat-seen-${project.id}` : null;
  const [seenTick, setSeenTick] = useState(0);
  const chatSeen = (() => { try { return seenKey ? parseInt(localStorage.getItem(seenKey) || "0", 10) || 0 : 0; } catch { return 0; } })();
  useEffect(() => {
    if (hubTab !== "chat" || !seenKey) return;
    try { localStorage.setItem(seenKey, String(Date.now())); } catch {}
    setSeenTick((x) => x + 1);
  }, [hubTab, seenKey, (entries || []).length]);''', 1)
s = s.replace('''  const notes = entries.filter((e) => e.type === "note");''',
'''  const notes = entries.filter((e) => e.type === "note");
  const unreadChat = notes.filter((n) => n.userId && n.userId !== currentUid && (n.createdAt || 0) > chatSeen).length;
  const timeCount = entries.filter((e) => e.type === "time").length;''', 1)
print("ok props + state")

# --- the tab strip after the wrapper ----------------------------------------------
WRAP = '''        <div className="lg:max-w-4xl lg:mx-auto">\n'''
assert s.count(WRAP) == 1
STRIP = WRAP + '''        {/* The hub: the job's content behind a row of tabs, the way the market
            lays a site out, instead of one long strip. */}
        <div data-hub-tabs className="flex gap-1.5 overflow-x-auto mb-4 -mx-1 px-1 pb-1">
          {[["overview", t.hubOverview, 0], ["time", t.hubTime, timeCount], ["material", t.materials, materials.length + tools.length], ["photos", t.hubPhotos, photos.length], ["plans", t.hubPlans, (files || []).length], ["reports", t.hubReports, (reports || []).length], ["chat", t.hubChat, unreadChat]].map(([id, label, count]) => {
            const on = hubTab === id;
            return (
              <button key={id} data-hub-tab={id} onClick={() => setHubTab(id)} style={{ background: on ? COLORS.accent : COLORS.card, border: `1px solid ${on ? COLORS.accent : COLORS.border}`, color: on ? "#fff" : COLORS.text }} className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase flex items-center gap-1.5">
                {label}
                {count > 0 && <span data-hub-count={id} style={{ background: on ? "#ffffff33" : (id === "chat" ? COLORS.accent : COLORS.cardAlt), color: "#fff" }} className="px-1.5 rounded-full text-[10px] font-bold">{count}</span>}
              </button>
            );
          })}
        </div>
'''
s = s.replace(WRAP, STRIP, 1)
print("ok tab strip")

# --- Übersicht: from the first card to the end of the crew block ---------------
a = "        {/* Each part of a job is its own block, so the eye can find the one it\n"
assert s.count(a) == 1
s = s.replace(a, '        {hubTab === "overview" && (<>\n' + a, 1)
b = "\n        {/* The plan is the one thing a Polier looks for before anything else.\n"
assert s.count(b) == 1
s = s.replace(b, '''        </div></>)}

        {hubTab === "plans" && (''' + CARD + "\n" + b.lstrip("\n"), 1)
print("ok overview + plans open")

# --- Rapporte: signed reports, documents, regie, costing -------------------------
c = "        {reports && reports.length > 0 && (\n"
assert s.count(c) == 1
s = s.replace(c, '''        </div>)}

        {hubTab === "reports" && (''' + CARD + "\n" + c, 1)
d = "        </div>\n\n        {/* Grouped by trade, because"
assert s.count(d) == 1
s = s.replace(d, '''        </div>)}

        {hubTab === "material" && (<>
        {/* Grouped by trade, because''', 1)
print("ok reports + material open")

# --- Material closes; inspections and trips belong to Übersicht -------------------
e = "        })()}\n\n        {/* What the roof inspections found and what drove to and from this\n"
assert s.count(e) == 1
s = s.replace(e, '''        })()}
        </>)}

        {hubTab === "overview" && (<>
        {/* What the roof inspections found and what drove to and from this
''', 1)
f = "        )}\n\n        " + CARD + "\n        <div style={{ color: COLORS.muted }} className=\"text-xs uppercase tracking-wide mb-2\">{t.commentsTitle}</div>\n"
assert s.count(f) == 1, s.count(f)
s = s.replace(f, '''        )}
        </>)}

        {hubTab === "chat" && (<div data-hub-chat ''' + CARD[len("<div "):] + "\n        <div style={{ color: COLORS.muted }} className=\"text-xs uppercase tracking-wide mb-2\">{t.commentsTitle}</div>\n", 1)
print("ok chat open")

# --- the composer moves below the messages; messages read oldest first ---------------
ci = s.index('        <div className="flex gap-2 mb-3">\n          <textarea\n            data-note-draft')
cj = s.index("\n        {notes.length > 0 && (", ci)
composer = s[ci:cj].rstrip("\n") + "\n"
s = s[:ci] + s[cj + 1:]
pi = s.index("\n        {photos.length > 0 && (")
s = s[:pi] + "\n" + composer.replace('className="flex gap-2 mb-3">', 'className="flex gap-2 mt-3">', 1) + s[pi:]
s = s.replace("              {notes.map((n) => {", "              {[...notes].reverse().map((n) => {", 1)
print("ok composer below the messages")

# --- each message: author and time -------------------------------------------------
g = '''                    <div className="text-sm break-words">{n.description}</div>'''
assert s.count(g) == 1
s = s.replace(g, '''                    <div data-chat-author className="flex items-center gap-2 text-[10px] mb-0.5" style={{ color: COLORS.muted }}>
                      <span className="font-bold" style={{ color: n.userId === currentUid ? COLORS.accent : COLORS.text }}>{memberName(n.userId) || "—"}</span>
                      <span>{n.date}{n.createdAt ? ` ${new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</span>
                    </div>
                    <div className="text-sm break-words">{n.description}</div>''', 1)
h = '''                    <div style={{ color: COLORS.muted }} className="text-[10px] mt-0.5">{n.date}</div>\n'''
assert s.count(h) == 1
s = s.replace(h, "", 1)
print("ok message header")

# --- Fotos, then Zeiten, then the end ---------------------------------------------------
p = "\n        {photos.length > 0 && (\n          <div className=\"mt-3\">"
assert s.count(p) == 1
s = s.replace(p, '''
        </div>)}

        {hubTab === "photos" && (''' + CARD + '''
        {photos.length === 0 && <div style={{ color: COLORS.muted }} className="text-sm">{t.nothingLogged}</div>}
        {photos.length > 0 && (
          <div>''', 1)
END_OLD = '''          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
}
'''
assert s.count(END_OLD) == 1, s.count(END_OLD)
END_NEW = '''          </div>
        )}
        </div>)}

        {hubTab === "time" && (() => {
          // This job's hours, by day and person; breaks net out. Editing stays
          // where it was (Today, Kalender).
          const rows = entries.filter((e) => e.type === "time" || e.type === "break").sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt || 0) - (a.createdAt || 0));
          const byDay = {};
          rows.forEach((e) => { (byDay[e.date] = byDay[e.date] || []).push(e); });
          const hoursOf = (list) => Math.round(list.reduce((s, e) => s + (parseFloat(e.qty) || 0) * (e.type === "break" ? -1 : 1), 0) * 100) / 100;
          return (
            <div data-hub-time style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">{t.hubTime}</div>
                <div style={{ color: COLORS.accent }} className="font-black">{hoursOf(rows).toFixed(1)} h</div>
              </div>
              {rows.length === 0 && <div style={{ color: COLORS.muted }} className="text-sm">{t.nothingLogged}</div>}
              {Object.keys(byDay).sort().reverse().map((day) => (
                <div key={day} className="mb-2">
                  <div className="flex items-center justify-between text-[11px] py-1" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <span style={{ color: COLORS.muted }}>{day}</span><span className="font-bold">{hoursOf(byDay[day]).toFixed(1)} h</span>
                  </div>
                  {byDay[day].map((e) => (
                    <div key={e.id} className="flex items-center justify-between text-xs py-1">
                      <span>{memberName(e.userId) || "—"}{e.type === "break" ? ` · ${t.typeBreak}` : ""}</span>
                      <span style={{ color: COLORS.muted }} className="tabular-nums">{e.startTime ? `${e.startTime}–${e.endTime || ""} · ` : ""}{e.type === "break" ? "−" : ""}{(parseFloat(e.qty) || 0).toFixed(2)} h</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })()}
        </div>
      </div>
    </div>
  );
}
'''
s = s.replace(END_OLD, END_NEW, 1)
io.open(P, "w", encoding="utf-8", newline="\n").write(s)
print("ok photos + time + end")

patch("roofing-site-manager.jsx", [
('''          canEditInspection={canEditInspection}''',
 '''          canEditInspection={canEditInspection}
          currentUid={user?.uid}''', "currentUid prop"),
])

# --- tests follow the tabs ------------------------------------------------------------
r = io.open("render.test.mjs", encoding="utf-8", newline="").read()
r = r.replace('''      check("owner: job view offers the crew drop zone", /Mannschaft|Crew/i.test(text()), "no crew section in the job view");
      check("owner: job view offers plans and documents", /Pläne & Dokumente|Plans & documents/.test(text()), "no files section in the job view");''',
'''      check("owner: job view offers the crew drop zone", /Mannschaft|Crew/i.test(text()), "no crew section in the job view");
      const hubTabs = window.document.querySelectorAll("[data-hub-tab]");
      check("owner: the job is a hub with seven tabs", hubTabs.length === 7, `${hubTabs.length} tabs`);
      const hub = (id) => window.document.querySelector(`[data-hub-tab="${id}"]`)?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      hub("plans");
      await new Promise((r) => setTimeout(r, 200));
      check("owner: job view offers plans and documents", /Pläne & Dokumente|Plans & documents/.test(text()), "no files section in the job view");
      hub("photos");
      await new Promise((r) => setTimeout(r, 200));''', 1)
# the photo thumbnail check follows; after it, back to overview for the day-start and material checks
r = r.replace('''        check("owner: a photo thumbnail is tappable", !!thumb, "no photo thumbnail in the job view");''',
'''        check("owner: a photo thumbnail is tappable", !!thumb, "no photo thumbnail in the job view");
        hub("overview");
        await new Promise((r) => setTimeout(r, 200));''', 1)
# the note flows live on the Chat tab now
r = r.replace('''        check("owner: the language can be switched to Albanian", await switchLang("DE", "Shqip"), "no language picker");
        const ta = window.document.querySelector("[data-note-draft]");''',
'''        check("owner: the language can be switched to Albanian", await switchLang("DE", "Shqip"), "no language picker");
        window.document.querySelector('[data-hub-tab="chat"]')?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 200));
        const ta = window.document.querySelector("[data-note-draft]");''', 1)
r = r.replace('''          const rows = [...window.document.querySelectorAll("[data-translate]")];
          const btn = rows[0];''',
'''          const rows = [...window.document.querySelectorAll("[data-translate]")];
          const btn = rows.find((b) => /Regen am Nachmittag/.test(b.closest("div.rounded-lg")?.textContent || "")) || rows[rows.length - 1];
          check("owner: chat messages carry author and time", !!window.document.querySelector("[data-chat-author]"), "no author line on a message");''', 1)
r = r.replace('''      const b = window.document.querySelector("[data-translate]");
          b?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));''',
'''      const b = [...window.document.querySelectorAll("[data-translate]")].find((x) => /Shi nga ora/.test(x.closest("div.rounded-lg")?.textContent || ""));
          b?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));''', 1)
io.open("render.test.mjs", "w", encoding="utf-8", newline="").write(r)
print("ok render tests follow the tabs")

K = {
 "en": {"hubOverview": "Overview", "hubTime": "Hours", "hubPhotos": "Photos", "hubPlans": "Plans", "hubReports": "Reports", "hubChat": "Chat"},
 "de": {"hubOverview": "Übersicht", "hubTime": "Zeiten", "hubPhotos": "Fotos", "hubPlans": "Pläne", "hubReports": "Rapporte", "hubChat": "Chat"},
 "gsw": {"hubOverview": "Übersicht", "hubTime": "Zyte", "hubPhotos": "Fotene", "hubPlans": "Plän", "hubReports": "Rapport", "hubChat": "Chat"},
 "fr": {"hubOverview": "Aperçu", "hubTime": "Heures", "hubPhotos": "Photos", "hubPlans": "Plans", "hubReports": "Rapports", "hubChat": "Chat"},
 "it": {"hubOverview": "Panoramica", "hubTime": "Ore", "hubPhotos": "Foto", "hubPlans": "Piani", "hubReports": "Rapporti", "hubChat": "Chat"},
 "es": {"hubOverview": "Resumen", "hubTime": "Horas", "hubPhotos": "Fotos", "hubPlans": "Planos", "hubReports": "Partes", "hubChat": "Chat"},
 "pt": {"hubOverview": "Resumo", "hubTime": "Horas", "hubPhotos": "Fotos", "hubPlans": "Plantas", "hubReports": "Relatórios", "hubChat": "Chat"},
 "pl": {"hubOverview": "Przegląd", "hubTime": "Godziny", "hubPhotos": "Zdjęcia", "hubPlans": "Plany", "hubReports": "Raporty", "hubChat": "Czat"},
 "sq": {"hubOverview": "Përmbledhje", "hubTime": "Orët", "hubPhotos": "Fotot", "hubPlans": "Planet", "hubReports": "Raportet", "hubChat": "Chat"},
 "ro": {"hubOverview": "Prezentare", "hubTime": "Ore", "hubPhotos": "Fotografii", "hubPlans": "Planuri", "hubReports": "Rapoarte", "hubChat": "Chat"},
 "bg": {"hubOverview": "Преглед", "hubTime": "Часове", "hubPhotos": "Снимки", "hubPlans": "Планове", "hubReports": "Отчети", "hubChat": "Чат"},
 "hu": {"hubOverview": "Áttekintés", "hubTime": "Órák", "hubPhotos": "Fotók", "hubPlans": "Tervek", "hubReports": "Jelentések", "hubChat": "Chat"},
 "sk": {"hubOverview": "Prehľad", "hubTime": "Hodiny", "hubPhotos": "Fotky", "hubPlans": "Plány", "hubReports": "Výkazy", "hubChat": "Chat"},
 "cs": {"hubOverview": "Přehled", "hubTime": "Hodiny", "hubPhotos": "Fotky", "hubPlans": "Plány", "hubReports": "Výkazy", "hubChat": "Chat"},
}
for code, v in K.items():
    f = f"i18n/{code}.json"
    d = json.load(io.open(f, encoding="utf-8"))
    d.update(v)
    io.open(f, "w", encoding="utf-8", newline="\n").write(json.dumps(d, indent=2, ensure_ascii=False) + "\n")
print("i18n keys added")
