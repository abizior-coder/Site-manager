// The job view, the photo viewer and the photo editor: loaded when a job
// is opened, not with the first paint. Helpers come from the app module.
import { fmtSize, sortFiles } from "../files.js";
import { rapportChanged } from "../reports.js";
import { StoredImage } from "../ui/entries.jsx";
import { todayKey, uid } from "../ui/format.js";
import { COLORS } from "../ui/theme.js";
import { Camera, Clock, LayoutGrid, MessageSquare, Circle, ClipboardCheck, CreditCard, Download, ExternalLink, FileText, ImagePlus, Languages, Layers, Loader2, Mail, MapPin, Mic, MoveUpRight, Package, Paintbrush, Pencil, Phone, Pin, Play, Plus, Printer, RotateCcw, Send, Share2, Square, Trash2, Truck, Type, Undo2, Wrench, X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LANGS } from "../i18n/index.js";
import { DEFAULT_PROJECT_STATUS, DEFAULT_TRADE, PROJECT_CATEGORIES, Section, TRADES, documentState, mapsUrl, statusMeta, telHref } from "../roofing-site-manager.jsx";

export function ProjectDetail({ project, entries, onClose, onAdd, onEdit, onEditEntry, onCopyEntry, onDeleteEntry, onShare, onScanCompare, onReorderEntries, costing, money, documents, onNewDocument, onOpenDocument, onPrintDocument, canBill, reports, onOpenRapport, onPrintRapport, regie, onRegieDocument, customer, onEditCustomer, noteDraft, onNoteDraftChange, onSaveNote, onVoiceNote, voiceActive, crew, roster, onToggleCrew, canManageCrew, pinned, onTogglePin, files, onUploadFiles, onOpenFile, onDeleteFile, canDeleteFile, onAddLink, fileBusy, activeClock, onStartDay, onStopDay, translations, onTranslate, onTranslateAll, translatingIds, lang, langOptions, onOpenPhoto, onInspect, onEditInspection, canEditInspection, currentUid, t }) {
  // Which note has its language chips open.
  const [pickFor, setPickFor] = useState(null);
  const langLabel = (code) => (LANGS.find((l) => l.code === code) || {}).label || code.toUpperCase();
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
  }, [hubTab, seenKey, (entries || []).length]);
  const materials = entries.filter((e) => e.type === "material");
  const tools = entries.filter((e) => e.type === "tool");
  const photos = entries.filter((e) => e.type === "photo");
  const notes = entries.filter((e) => e.type === "note");
  const unreadChat = notes.filter((n) => n.userId && n.userId !== currentUid && (n.createdAt || 0) > chatSeen).length;
  const timeCount = entries.filter((e) => e.type === "time").length;
  const inspections = entries.filter((e) => e.type === "inspection").sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const trips = entries.filter((e) => e.type === "transport").sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const [dragOver, setDragOver] = useState(false);
  const [filesOver, setFilesOver] = useState(false);
  const fileInputRef = useRef(null);
  const onCrew = (roster || []).filter((m) => (crew || []).includes(m.uid));
  const offCrew = (roster || []).filter((m) => !(crew || []).includes(m.uid));
  return (
    <div className="fixed inset-0 z-40 flex items-end lg:items-stretch justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/60" />
      {/* On a phone this stays a sheet you thumb through. On a desk a job is
          the thing you are working on, so it takes the whole screen. */}
      <div style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}` }} className="relative w-full max-w-md lg:max-w-none rounded-t-2xl lg:rounded-none p-5 lg:p-8 max-h-[85vh] lg:max-h-none lg:h-full overflow-y-auto">
        {/* The name block yields and wraps; the buttons keep their width. On a
            phone the name plus two chips plus 'Bearbeiten' and the close
            button pushed the header past the right edge. */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="font-black text-lg break-words">{project.name}</div>
              {project.category && (
                <span style={{ background: COLORS.cardAlt, color: COLORS.muted, border: `1px solid ${COLORS.border}` }} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {t[PROJECT_CATEGORIES.find((c) => c.key === project.category)?.labelKey] || project.category}
                </span>
              )}
              {(() => {
                const sm = statusMeta(project.status || DEFAULT_PROJECT_STATUS);
                return (
                  <span style={{ background: `${sm.color}22`, color: sm.color, border: `1px solid ${sm.color}66` }} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {t[sm.labelKey]}
                  </span>
                );
              })()}
            </div>
            {project.client && <div style={{ color: COLORS.muted }} className="text-xs mt-0.5">{project.client}</div>}
            {project.address ? (
              <a href={mapsUrl(project.address)} target="_blank" rel="noreferrer" style={{ color: COLORS.accent }} className="text-xs flex items-center gap-1 mt-0.5 min-w-0">
                <MapPin size={11} className="shrink-0" /> <span className="break-words min-w-0">{project.address}</span>
              </a>
            ) : (
              <button onClick={onEdit} style={{ color: COLORS.muted }} className="text-xs flex items-center gap-1 mt-0.5 underline">
                <MapPin size={11} /> {t.addAddress}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0 pt-1">
            <button onClick={onTogglePin} title={pinned ? t.dockUnpin : t.dockPin} style={{ color: pinned ? COLORS.accent : COLORS.muted }}>
              <Pin size={16} fill={pinned ? COLORS.accent : "none"} />
            </button>
            <button onClick={() => onShare(project, entries)} style={{ color: COLORS.muted }}><Share2 size={16} /></button>
            <button onClick={onEdit} style={{ color: COLORS.muted }} className="text-xs font-bold uppercase">{t.editLabel}</button>
            <button onClick={onClose}><X size={20} color={COLORS.muted} /></button>
          </div>
        </div>
        <div className="lg:max-w-4xl lg:mx-auto">
        {/* The hub: the job's content behind a row of tabs, the way the market
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
        {hubTab === "overview" && (<>
        {/* Each part of a job is its own block, so the eye can find the one it
            wants instead of reading a single long strip. */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4 mb-4">
        {/* The day starts on the job, not on a list: the Polier assigned it,
            the worker opens it and taps. */}
        {activeClock && activeClock.projectId === project.id ? (
          <button data-day-stop onClick={onStopDay} style={{ background: COLORS.accent }} className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2 mb-3">
            <Square size={16} /> {t.clockOut}
          </button>
        ) : (
          <button
            data-day-start
            onClick={() => onStartDay(project.id)}
            style={activeClock
              ? { background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text }
              : { background: COLORS.success, color: "#0B1A0B" }}
            className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2 mb-3"
          >
            <Play size={16} /> {activeClock ? t.switchDayHere : t.startDayHere}
          </button>
        )}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => onAdd("material")} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Package size={13} color={COLORS.success} /> {t.materials}</button>
          <button onClick={() => onAdd("tool")} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Wrench size={13} color={COLORS.amber} /> {t.tools}</button>
          <button onClick={() => onAdd("photo")} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Camera size={13} color="#7FA0C7" /> {t.photoLabel}</button>
          <button onClick={() => onScanCompare(project.id)} style={{ background: COLORS.card, border: `1px dashed ${COLORS.success}` }} className="py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><ImagePlus size={13} color={COLORS.success} /> {t.beforeAfter}</button>
          <button data-inspect-open onClick={() => onInspect(project.id)} style={{ background: COLORS.card, border: `1px dashed #6FB3D9`, color: "#6FB3D9" }} className="col-span-2 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><ClipboardCheck size={13} /> {t.newInspection}</button>
        </div>
        {customer && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide">{t.customerLabel}</div>
              <button onClick={() => onEditCustomer(customer)} style={{ color: COLORS.accent }} className="text-[10px] font-bold uppercase">{t.editLabel}</button>
            </div>
            <div className="text-sm font-semibold truncate">{customer.name}</div>
            {customer.company && <div style={{ color: COLORS.muted }} className="text-xs truncate">{customer.company}</div>}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {customer.phone && (
                <a href={telHref(customer.phone)} style={{ background: COLORS.cardAlt, color: COLORS.success }} className="px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1">
                  <Phone size={11} /> {customer.phone}
                </a>
              )}
              {customer.email && (
                <a href={`mailto:${customer.email}`} style={{ background: COLORS.cardAlt, color: "#B48EAD" }} className="px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1">
                  <Mail size={11} /> {customer.email}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Drag a name onto the job on a desktop; tap it on a phone, where
            HTML5 drag does not exist. Both do the same thing. */}
        <div
          onDragOver={(e) => { if (canManageCrew) { e.preventDefault(); setDragOver(true); } }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const memberUid = e.dataTransfer.getData("text/member-uid");
            if (memberUid && !(crew || []).includes(memberUid)) onToggleCrew(memberUid);
          }}
          style={{
            background: dragOver ? `${COLORS.accent}1A` : COLORS.card,
            border: `1px ${dragOver ? "solid" : "solid"} ${dragOver ? COLORS.accent : COLORS.border}`,
          }}
          className="rounded-xl p-3 mb-3"
        >
          <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-2">{t.crewOnJob} ({onCrew.length})</div>
          {onCrew.length === 0 ? (
            <div style={{ color: COLORS.muted }} className="text-xs mb-2">{canManageCrew ? t.crewDropHint : t.crewNobody}</div>
          ) : (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {onCrew.map((m) => (
                <span key={m.uid} style={{ background: `${COLORS.accent}1F`, border: `1px solid ${COLORS.accent}66`, color: COLORS.accent }} className="pl-2.5 pr-1.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                  {m.name || m.email || m.uid}
                  {canManageCrew && (
                    <button onClick={() => onToggleCrew(m.uid)} title={t.removeLabel}><X size={11} /></button>
                  )}
                </span>
              ))}
            </div>
          )}
          {canManageCrew && offCrew.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {offCrew.map((m) => (
                <button
                  key={m.uid}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/member-uid", m.uid)}
                  onClick={() => onToggleCrew(m.uid)}
                  style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}`, color: COLORS.muted }}
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold cursor-grab active:cursor-grabbing"
                >
                  + {m.name || m.email || m.uid}
                </button>
              ))}
            </div>
          )}
        </div>
        </div></>)}

        {hubTab === "plans" && (<div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4 mb-4">
        {/* The plan is the one thing a Polier looks for before anything else.
            Files dropped here upload to this job; on a phone the buttons do
            the same. */}
        <div
          onDragOver={(e) => { if (Array.from(e.dataTransfer?.types || []).includes("Files")) { e.preventDefault(); if (!filesOver) setFilesOver(true); } }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFilesOver(false); }}
          onDrop={(e) => { if (e.dataTransfer?.files?.length) { e.preventDefault(); setFilesOver(false); onUploadFiles(e.dataTransfer.files); } }}
          style={{ background: filesOver ? `${COLORS.accent}1A` : COLORS.card, border: `1px ${filesOver ? "dashed" : "solid"} ${filesOver ? COLORS.accent : COLORS.border}` }}
          className="rounded-xl p-3 mb-3"
        >
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide flex items-center gap-1.5 min-w-0">
              <FileText size={11} /> <span className="truncate">{t.filesTitle} ({(files || []).length})</span>
              {fileBusy > 0 && <Loader2 size={11} className="animate-spin" />}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onAddLink()} style={{ color: COLORS.muted }} className="text-[10px] font-bold uppercase flex items-center gap-1 whitespace-nowrap"><ExternalLink size={11} /> {t.filesAddLink}</button>
              <button onClick={() => fileInputRef.current?.click()} style={{ color: COLORS.accent }} className="text-[10px] font-bold uppercase flex items-center gap-1 whitespace-nowrap"><Plus size={11} /> {t.filesAdd}</button>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { onUploadFiles(e.target.files); e.target.value = ""; }} />
            </div>
          </div>
          {(files || []).length === 0 ? (
            <div style={{ color: COLORS.muted }} className="text-xs">{filesOver ? t.filesDropHint : t.filesEmpty}</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {sortFiles(files).map((f) => {
                const Icon = f.url ? ExternalLink : f.kind === "photo" ? Camera : f.kind === "plan" ? Layers : FileText;
                return (
                  <div key={f.id} style={{ background: COLORS.cardAlt }} className="rounded-lg px-3 py-2 flex items-center gap-2">
                    <Icon size={15} color={f.kind === "plan" ? COLORS.accent : COLORS.muted} className="shrink-0" />
                    <button onClick={() => onOpenFile(f)} className="flex-1 min-w-0 text-left">
                      <div className="text-sm truncate">{f.name}</div>
                      <div style={{ color: COLORS.muted }} className="text-[10px] truncate">
                        {[t[`fileKind_${f.kind}`] || f.kind, f.url ? t.filesLinkLabel : fmtSize(f.size), f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ""].filter(Boolean).join(" · ")}
                      </div>
                    </button>
                    {canDeleteFile(f) && (
                      <button onClick={() => onDeleteFile(f)} title={t.deleteLabel} style={{ color: COLORS.danger }} className="shrink-0"><Trash2 size={13} /></button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => onOpenRapport(project.id)}
          style={{ background: COLORS.card, border: `1px dashed #6FB3D9`, color: "#6FB3D9" }}
          className="w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 mb-3"
        >
          <ClipboardCheck size={14} /> {t.rapportBtn}
        </button>

        </div>)}

        {hubTab === "reports" && (<div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4 mb-4">
        {reports && reports.length > 0 && (
          <div className="mb-4 flex flex-col gap-1.5">
            {reports.map((r) => (
              <button key={r.id} onClick={() => onPrintRapport(r)} style={{ background: COLORS.card }} className="w-full text-left rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm truncate">{t.rapportTitle} · {r.date}</div>
                  <div style={{ color: COLORS.muted }} className="text-[10px] truncate">
                    {r.signerName} · {r.hours} h
                    {rapportChanged(r, entries.filter((e) => e.date === r.date)) && <span style={{ color: COLORS.amber }}> · {t.rapportChangedSince}</span>}
                  </div>
                </div>
                <Printer size={14} color={COLORS.muted} className="shrink-0" />
              </button>
            ))}
          </div>
        )}

        {canBill && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={() => onNewDocument("quote")} style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}` }} className="py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
              <FileText size={13} color="#D08770" /> {t.newQuote}
            </button>
            <button onClick={() => onNewDocument("invoice")} style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}` }} className="py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
              <CreditCard size={13} color={COLORS.success} /> {t.newInvoice}
            </button>
          </div>
        )}
        {canBill && documents && documents.length > 0 && (
          <div className="mb-4 flex flex-col gap-1.5">
            {documents.map((d) => {
              const st = documentState(d, todayKey());
              return (
                <div key={d.id} style={{ background: COLORS.card }} className="rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <button onClick={() => onOpenDocument(d)} className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-semibold truncate">
                      {d.type === "invoice" ? t.invoiceLabel : t.quoteLabel} {d.number}
                    </div>
                    <div style={{ color: COLORS.muted }} className="text-[10px]">{d.date} · {st.totals.gross.toFixed(2)}</div>
                  </button>
                  <span style={{ background: `${st.overdue ? COLORS.danger : st.meta.color}22`, color: st.overdue ? COLORS.danger : st.meta.color, border: `1px solid ${st.overdue ? COLORS.danger : st.meta.color}66` }} className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {st.overdue ? t.overdueLabel : t[st.meta.labelKey]}
                  </span>
                  <button onClick={() => onPrintDocument(d)} style={{ color: COLORS.muted }} className="shrink-0"><Printer size={14} /></button>
                </div>
              );
            })}
          </div>
        )}
        {regie && regie.count > 0 && (
          <div style={{ background: `${COLORS.amber}14`, border: `1px solid ${COLORS.amber}55` }} className="rounded-xl p-3 mb-4">
            <div style={{ color: COLORS.amber }} className="text-xs uppercase tracking-wide mb-2 font-bold">
              {t.regieTitle} ({regie.count})
            </div>
            <div className="flex flex-col gap-1 text-sm">
              {regie.hours > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: COLORS.muted }}>{t.regieLabour}</span>
                  <span>{regie.hours.toFixed(1)} h</span>
                </div>
              )}
              {canBill && (
                <div style={{ borderTop: `1px solid ${COLORS.amber}33` }} className="flex justify-between pt-1 mt-1 font-bold">
                  <span>{t.regieUnbilled}</span>
                  <span style={{ color: COLORS.amber }}>{money(regie.total)}</span>
                </div>
              )}
            </div>
            {canBill && regie.unpriced > 0 && (
              <div style={{ color: COLORS.amber }} className="text-[10px] mt-1.5">{regie.unpriced} {t.costingUnpriced}</div>
            )}
            {canBill && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button onClick={() => onRegieDocument("quote")} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="py-2 rounded-lg text-[11px] font-bold uppercase">
                  {t.regieAsQuote}
                </button>
                <button onClick={() => onRegieDocument("invoice")} style={{ background: COLORS.amber, color: "#241C00" }} className="py-2 rounded-lg text-[11px] font-bold uppercase">
                  {t.regieAsInvoice}
                </button>
              </div>
            )}
          </div>
        )}

        {canBill && costing && (costing.hasRate || costing.materials > 0 || costing.quoted > 0) && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3 mb-4">
            <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">{t.costingTitle}</div>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span style={{ color: COLORS.muted }}>{t.labourCost} ({costing.hours.toFixed(1)} h)</span>
                <span>{money(costing.labour)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: COLORS.muted }}>{t.materialCost}</span>
                <span>{money(costing.materials)}</span>
              </div>
              <div style={{ borderTop: `1px solid ${COLORS.border}` }} className="flex justify-between pt-1 mt-1 font-bold">
                <span>{t.totalCost}</span>
                <span>{money(costing.cost)}</span>
              </div>
              {costing.quoted > 0 && (
                <>
                  <div className="flex justify-between">
                    <span style={{ color: COLORS.muted }}>{t.quotedLabel}</span>
                    <span>{money(costing.quoted)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>{t.marginLabel}</span>
                    <span style={{ color: costing.margin >= 0 ? COLORS.success : COLORS.danger }}>
                      {money(costing.margin)} ({costing.marginPct.toFixed(0)}%)
                    </span>
                  </div>
                </>
              )}
            </div>
            {(!costing.hasRate || costing.unpricedCount > 0) && (
              <div style={{ color: COLORS.amber }} className="text-[10px] mt-2 leading-relaxed">
                {!costing.hasRate && <div>{t.costingNoRate}</div>}
                {costing.unpricedCount > 0 && <div>{costing.unpricedCount} {t.costingUnpriced}</div>}
              </div>
            )}
          </div>
        )}
        </div>)}

        {hubTab === "material" && (<>
        {/* Grouped by trade, because "what did the Spengler use" is the
            question actually asked when the job is costed or disputed. With a
            single trade on site the headers would be noise, so they only
            appear once there is more than one. */}
        {(() => {
          const used = TRADES.filter((tr) =>
            materials.some((e) => (e.trade || DEFAULT_TRADE) === tr.key) ||
            tools.some((e) => (e.trade || DEFAULT_TRADE) === tr.key)
          );
          if (used.length <= 1) {
            return (
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4 mb-4">
                <Section title={`${t.materials} (${materials.length})`} items={materials} onEditItem={onEditEntry} onCopyItem={onCopyEntry} onDeleteItem={onDeleteEntry} onReorder={onReorderEntries} t={t} />
                <Section title={`${t.tools} (${tools.length})`} items={tools} onEditItem={onEditEntry} onCopyItem={onCopyEntry} onDeleteItem={onDeleteEntry} onReorder={onReorderEntries} t={t} />
              </div>
            );
          }
          return used.map((tr) => {
            const mine = materials.filter((e) => (e.trade || DEFAULT_TRADE) === tr.key);
            const myTools = tools.filter((e) => (e.trade || DEFAULT_TRADE) === tr.key);
            const tradeHours = entries
              .filter((e) => e.type === "time" && (e.trade || DEFAULT_TRADE) === tr.key)
              .reduce((sum, e) => sum + (parseFloat(e.qty) || 0), 0);
            return (
              <div key={tr.key} style={{ background: COLORS.card, border: `1px solid ${tr.color}55` }} className="rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span style={{ background: tr.color }} className="w-2.5 h-2.5 rounded-full shrink-0" />
                    <span style={{ color: tr.color }} className="text-xs font-black uppercase tracking-wide">{t[tr.labelKey]}</span>
                  </div>
                  {tradeHours > 0 && (
                    <span style={{ color: COLORS.muted }} className="text-[11px] font-bold">{tradeHours.toFixed(1)} h</span>
                  )}
                </div>
                {mine.length > 0 && <Section title={`${t.materials} (${mine.length})`} items={mine} onEditItem={onEditEntry} onCopyItem={onCopyEntry} onDeleteItem={onDeleteEntry} onReorder={onReorderEntries} t={t} />}
                {myTools.length > 0 && <Section title={`${t.tools} (${myTools.length})`} items={myTools} onEditItem={onEditEntry} onCopyItem={onCopyEntry} onDeleteItem={onDeleteEntry} onReorder={onReorderEntries} t={t} />}
              </div>
            );
          });
        })()}
        </>)}

        {hubTab === "overview" && (<>
        {/* What the roof inspections found and what drove to and from this
            job -- both used to live only on Today. */}
        {inspections.length > 0 && (
          <div data-job-inspections style={{ background: COLORS.card, border: `1px solid #6FB3D955` }} className="rounded-xl p-4 mb-4">
            <div style={{ color: "#6FB3D9" }} className="text-xs font-black uppercase tracking-wide mb-2 flex items-center gap-1.5"><ClipboardCheck size={13} /> {t.jobInspections} ({inspections.length})</div>
            <div className="flex flex-col gap-2">
              {inspections.map((e) => (
                <div key={e.id} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="rounded-lg px-3 py-2 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: COLORS.muted }}>
                    <span>{e.date}{e.startTime ? ` · ${e.startTime}` : ""}</span>
                    {e.wasteKg > 0 && <span style={{ color: COLORS.amber }} className="ml-auto font-bold">{t.inspectWaste}: ~{e.wasteKg} kg</span>}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }} className="text-sm">{e.description}</div>
                  {e.checklist && Object.keys(e.checklist).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(e.checklist).map(([k, v]) => (
                        <span key={k} style={{ background: v === "ok" ? `${COLORS.success}22` : `${COLORS.danger}22`, color: v === "ok" ? COLORS.success : COLORS.danger }} className="px-1.5 py-0.5 rounded text-[10px] font-bold">{t[`inspect_${k}`] || k}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 justify-end">
                    {canEditInspection && canEditInspection(e) && <button data-inspect-edit onClick={() => onEditInspection(e)} title={t.editLabel} style={{ color: COLORS.muted }}><Pencil size={13} /></button>}
                    <button onClick={() => onDeleteEntry(e.id)} style={{ color: COLORS.muted }}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {trips.length > 0 && (
          <div data-job-trips style={{ background: COLORS.card, border: `1px solid #C68B4F55` }} className="rounded-xl p-4 mb-4">
            <div style={{ color: "#C68B4F" }} className="text-xs font-black uppercase tracking-wide mb-2 flex items-center gap-1.5"><Truck size={13} /> {t.jobTrips} ({trips.length})</div>
            <div className="flex flex-col gap-1.5">
              {trips.map((e) => (
                <div key={e.id} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="rounded-lg px-3 py-2 text-xs flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span style={{ color: COLORS.muted }}>{e.date}</span>
                  <span className="font-bold">{e.from || "?"} → {e.to || "?"}</span>
                  <span style={{ color: COLORS.muted }}>{t[`load_${e.loadKind}`] || e.loadKind}{e.weightKg ? ` · ${e.weightKg} kg` : ""}{e.hours ? ` · ${e.hours} h` : ""}{e.km ? ` · ${e.km} km` : ""}</span>
                  <button onClick={() => onDeleteEntry(e.id)} style={{ color: COLORS.muted }} className="ml-auto"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
        </>)}

        {hubTab === "chat" && (<div data-hub-chat style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4 mb-4">
        <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">{t.commentsTitle}</div>
        {notes.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">{t.typeNote} ({notes.length})</div>
              {/* The crew writes in five languages; the desk reads in one.
                  One tap per note, or all at once; done once per language
                  and shared, so the next reader pays nothing. */}
              <button data-translate-all onClick={onTranslateAll} style={{ color: COLORS.accent }} className="text-[10px] font-bold uppercase flex items-center gap-1 shrink-0">
                <Languages size={12} /> {t.translateAll}
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {[...notes].reverse().map((n) => {
                const have = translations?.[n.id] || {};
                const original = String(n.description || "").trim();
                // Every translation present, the reader's language first; never
                // the source language, never a copy of the original.
                const shown = Object.entries(have)
                  .filter(([c, v]) => c !== n.srcLang && v && v !== original)
                  .sort(([a], [b]) => (a === lang ? -1 : b === lang ? 1 : a.localeCompare(b)));
                const missing = (langOptions || [lang]).filter((c) => c !== n.srcLang && !have[c]);
                const busy = (translatingIds || []).includes(n.id);
                return (
                <div key={n.id} style={{ background: COLORS.card }} className="rounded-lg px-3 py-2 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div data-chat-author className="flex items-center gap-2 text-[10px] mb-0.5" style={{ color: COLORS.muted }}>
                      <span className="font-bold" style={{ color: n.userId === currentUid ? COLORS.accent : COLORS.text }}>{memberName(n.userId) || "—"}</span>
                      <span>{n.date}{n.createdAt ? ` ${new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</span>
                    </div>
                    <div className="text-sm break-words">{n.description}</div>
                    {shown.map(([c, v]) => (
                      <div key={c} data-translation data-translation-lang={c} style={{ color: COLORS.accent, borderLeft: `2px solid ${COLORS.accent}55` }} className="text-sm break-words mt-1.5 pl-2">
                        <span style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mr-1">{c}</span>{v}
                      </div>
                    ))}
                    {pickFor === n.id && missing.length > 0 && (
                      <div data-translate-pick className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide">{t.translateInto}</span>
                        {missing.map((c) => (
                          <button key={c} data-translate-to={c} onClick={() => { setPickFor(null); onTranslate(n, c); }} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }} className="px-2 py-1 rounded-full text-[11px] font-bold">{langLabel(c)}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {missing.length > 0 && (
                      <button data-translate onClick={() => (missing.length === 1 ? onTranslate(n, missing[0]) : setPickFor(pickFor === n.id ? null : n.id))} title={t.translateBtn} style={{ color: busy ? COLORS.accent : COLORS.muted }} disabled={busy}>
                        {busy ? <Loader2 size={13} className="animate-spin" /> : <Languages size={13} />}
                      </button>
                    )}
                    <button onClick={() => onEditEntry(n)} style={{ color: COLORS.muted }}><Pencil size={13} /></button>
                    <button onClick={() => onDeleteEntry(n)} style={{ color: COLORS.danger }}><Trash2 size={13} /></button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <textarea
            data-note-draft
            value={noteDraft}
            onChange={(e) => onNoteDraftChange(e.target.value)}
            placeholder={t.commentPlaceholder}
            rows={2}
            style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none resize-none"
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={onVoiceNote}
              title={t.speakBtn}
              style={{ background: voiceActive ? COLORS.danger : COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}
              className="rounded-lg px-3 py-2 flex items-center justify-center"
            >
              <Mic size={16} color={voiceActive ? "#fff" : COLORS.muted} />
            </button>
            <button
              onClick={onSaveNote}
              disabled={!noteDraft.trim()}
              style={{ background: noteDraft.trim() ? COLORS.accent : COLORS.cardAlt, opacity: noteDraft.trim() ? 1 : 0.5 }}
              className="rounded-lg px-3 py-2 flex items-center justify-center"
            >
              <Send size={16} color={noteDraft.trim() ? "#fff" : COLORS.muted} />
            </button>
          </div>
        </div>

        </div>)}

        {hubTab === "photos" && (<div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4 mb-4">
        {photos.length === 0 && <div style={{ color: COLORS.muted }} className="text-sm">{t.nothingLogged}</div>}
        {photos.length > 0 && (
          <div>
            <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">{t.photoLabel}</div>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p) => (
                <div key={p.id} className="relative">
                  <button data-photo-thumb onClick={() => onOpenPhoto(p)} className="w-full block">
                    <StoredImage photo={p.photo} photoId={p.photoId} className="w-full h-20 object-cover rounded-md" />
                  </button>
                  {p.originalPhotoId && (
                    <span style={{ background: "rgba(0,0,0,0.65)", color: COLORS.amber }} className="absolute bottom-1 left-1 px-1 rounded text-[9px] font-bold uppercase">{t.photoEditedTag}</span>
                  )}
                  <button onClick={() => onDeleteEntry(p)} style={{ background: "rgba(0,0,0,0.65)" }} className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center">
                    <X size={12} color="#fff" />
                  </button>
                </div>
              ))}
            </div>
          </div>
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

// A material list behaves like a spreadsheet: sorted by name to begin with,
// because that is how you look something up, and re-sortable by the columns
// that matter. Manual order stays available — the crew's own arrangement is
// sometimes the order of work — and dragging is only offered in that mode,
// since dragging a sorted list would silently do nothing.
// A photo full-screen: pinch or scroll to zoom, drag to pan, double-tap to
// jump between fit and 2.5x. A crack in a tile is a few pixels on a phone;
// this is how the Polier actually looks at it.
export function PhotoViewer({ src, entry, onClose, onEdit, onRestore, canEdit = true, t }) {
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const boxRef = useRef(null);
  const lastTap = useRef(0);

  const clamp = (v) => ({ ...v, scale: Math.min(8, Math.max(1, v.scale)) });
  // React registers wheel listeners as passive, so preventDefault there only
  // logs an error and the page scrolls behind the photo. A native listener
  // with passive:false is the only way to own the wheel.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onWheel = (e) => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY); };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });
  const zoomAt = (factor, cx, cy) => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box) return;
    // Zoom around the finger or the cursor, not the centre.
    const px = cx - box.left - box.width / 2;
    const py = cy - box.top - box.height / 2;
    setView((v) => {
      const scale = Math.min(8, Math.max(1, v.scale * factor));
      const k = scale / v.scale;
      const next = { scale, tx: px - (px - v.tx) * k, ty: py - (py - v.ty) * k };
      return scale === 1 ? { scale: 1, tx: 0, ty: 0 } : next;
    });
  };

  const onPointerDown = (e) => {
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch (err) {} // a pointer the browser does not know must not cancel the gesture
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) { zoomAt(view.scale > 1 ? 0 : 2.5, e.clientX, e.clientY); lastTap.current = 0; return; }
      lastTap.current = now;
      gesture.current = { kind: "pan", x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { kind: "pinch", dist: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, tx: view.tx, ty: view.ty };
    }
  };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "pan" && pointers.current.size === 1) {
      if (view.scale === 1) return;
      setView((v) => ({ ...v, tx: g.tx + (e.clientX - g.x), ty: g.ty + (e.clientY - g.y) }));
    } else if (g.kind === "pinch" && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const scale = Math.min(8, Math.max(1, g.scale * (dist / g.dist)));
      setView(clamp({ scale, tx: g.tx, ty: g.ty }));
    }
  };
  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    gesture.current = null;
    if (pointers.current.size === 1) {
      const [p] = [...pointers.current.values()];
      gesture.current = { kind: "pan", x: p.x, y: p.y, tx: view.tx, ty: view.ty };
    }
  };

  return (
    <div data-photo-viewer className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.96)" }}>
      <div style={{ background: COLORS.card, borderBottom: `1px solid ${COLORS.border}` }} className="flex items-center justify-between gap-2 px-3 py-2 shrink-0">
        <div className="min-w-0">
          <div className="text-sm font-bold truncate">{entry?.description || t.photoLabel}</div>
          <div style={{ color: COLORS.muted }} className="text-[10px]">{entry?.date}{entry?.originalPhotoId ? ` · ${t.photoEditedTag}` : ""} · {Math.round(view.scale * 100)}%</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => zoomAt(0.7, window.innerWidth / 2, window.innerHeight / 2)} title={t.photoZoomOut} style={{ color: COLORS.muted }} className="w-9 h-9 flex items-center justify-center"><ZoomOut size={18} /></button>
          <button onClick={() => zoomAt(1.4, window.innerWidth / 2, window.innerHeight / 2)} title={t.photoZoomIn} style={{ color: COLORS.muted }} className="w-9 h-9 flex items-center justify-center"><ZoomIn size={18} /></button>
          {onRestore && (
            <button onClick={onRestore} title={t.photoRestore} style={{ color: COLORS.amber }} className="w-9 h-9 flex items-center justify-center"><RotateCcw size={18} /></button>
          )}
          <a href={src} download={`${(entry?.description || "foto").replace(/[^\w.-]+/g, "_")}.jpg`} title={t.filesDownload} style={{ color: COLORS.muted }} className="w-9 h-9 flex items-center justify-center"><Download size={18} /></a>
          {canEdit && (
            <button data-photo-edit onClick={onEdit} title={t.photoEdit} style={{ background: COLORS.accent }} className="w-9 h-9 rounded-lg flex items-center justify-center"><Paintbrush size={18} color="#fff" /></button>
          )}
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center"><X size={20} color={COLORS.muted} /></button>
        </div>
      </div>
      <div
        ref={boxRef}
        className="flex-1 min-h-0 overflow-hidden flex items-center justify-center select-none"
        style={{ touchAction: "none", cursor: view.scale > 1 ? "grab" : "zoom-in" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className="max-w-full max-h-full object-contain"
          style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`, transition: gesture.current ? "none" : "transform 0.08s", willChange: "transform" }}
        />
      </div>
      <div style={{ color: COLORS.muted }} className="text-[10px] text-center py-1.5 shrink-0">{t.photoZoomHint}</div>
    </div>
  );
}

// Marking up a photo: an arrow at the leak, a circle round the bad flashing,
// a word next to it. Drawn on a canvas over the image and flattened into a
// new JPEG on save. Coordinates are kept in image pixels, so a line drawn on
// a phone lands in the same place on a desk.
const PHOTO_COLOURS = ["#DA291C", "#FFD400", "#2E8BFF", "#FFFFFF", "#111111"];
export function PhotoEditor({ src, onCancel, onSave, t }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState("pen");
  const [colour, setColour] = useState(PHOTO_COLOURS[0]);
  const [thick, setThick] = useState(2); // 1..3
  const [shapes, setShapes] = useState([]);
  const draftRef = useRef(null);
  const [tick, setTick] = useState(0); // bumps to redraw while a stroke is in progress
  const [textAt, setTextAt] = useState(null);
  const [textValue, setTextValue] = useState("");

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const c = canvasRef.current;
      if (!c) return;
      // The stored photo is already scaled for Firestore; cap again so the
      // flattened result cannot outgrow the 1 MB document.
      const max = 1600;
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      c.width = Math.round(img.naturalWidth * k);
      c.height = Math.round(img.naturalHeight * k);
      setReady(true);
    };
    img.src = src;
  }, [src]);

  const strokeFor = (c) => Math.max(2, Math.round((c.width / 900) * [3, 6, 11][thick - 1]));

  const drawShape = (ctx, c, sh) => {
    ctx.save();
    ctx.strokeStyle = sh.colour; ctx.fillStyle = sh.colour;
    ctx.lineWidth = sh.width; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = sh.width;
    if (sh.tool === "pen" && sh.points.length) {
      ctx.beginPath(); ctx.moveTo(sh.points[0].x, sh.points[0].y);
      sh.points.forEach((p) => ctx.lineTo(p.x, p.y)); ctx.stroke();
    } else if (sh.tool === "arrow") {
      const { from, to } = sh;
      ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
      const ang = Math.atan2(to.y - from.y, to.x - from.x); const head = sh.width * 3.2;
      ctx.beginPath(); ctx.moveTo(to.x, to.y);
      ctx.lineTo(to.x - head * Math.cos(ang - 0.5), to.y - head * Math.sin(ang - 0.5));
      ctx.lineTo(to.x - head * Math.cos(ang + 0.5), to.y - head * Math.sin(ang + 0.5));
      ctx.closePath(); ctx.fill();
    } else if (sh.tool === "rect") {
      ctx.strokeRect(Math.min(sh.from.x, sh.to.x), Math.min(sh.from.y, sh.to.y), Math.abs(sh.to.x - sh.from.x), Math.abs(sh.to.y - sh.from.y));
    } else if (sh.tool === "circle") {
      const rx = Math.abs(sh.to.x - sh.from.x) / 2, ry = Math.abs(sh.to.y - sh.from.y) / 2;
      ctx.beginPath(); ctx.ellipse((sh.from.x + sh.to.x) / 2, (sh.from.y + sh.to.y) / 2, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2); ctx.stroke();
    } else if (sh.tool === "text") {
      const size = sh.width * 5;
      ctx.font = `bold ${size}px system-ui, sans-serif`;
      ctx.lineWidth = Math.max(2, sh.width / 2); ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.strokeText(sh.text, sh.at.x, sh.at.y); ctx.fillText(sh.text, sh.at.x, sh.at.y);
    }
    ctx.restore();
  };

  useEffect(() => {
    const c = canvasRef.current; const img = imgRef.current;
    if (!c || !img || !ready) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    shapes.forEach((sh) => drawShape(ctx, c, sh));
    if (draftRef.current) drawShape(ctx, c, draftRef.current);
  }, [shapes, tick, ready]);

  const toCanvas = (e) => {
    const c = canvasRef.current; const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };
  const onDown = (e) => {
    if (!ready) return;
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch (err) {} // a pointer the browser does not know must not cancel the gesture
    const p = toCanvas(e); const c = canvasRef.current; const width = strokeFor(c);
    if (tool === "text") { setTextAt(p); setTextValue(""); return; }
    draftRef.current = tool === "pen" ? { tool, colour, width, points: [p] } : { tool, colour, width, from: p, to: p };
    setTick((n) => n + 1);
  };
  const onMove = (e) => {
    const d = draftRef.current;
    if (!d) return;
    const p = toCanvas(e);
    if (d.tool === "pen") d.points.push(p); else d.to = p;
    setTick((n) => n + 1);
  };
  const onUp = () => {
    const d = draftRef.current;
    if (!d) return;
    draftRef.current = null;
    const moved = d.tool === "pen" ? d.points.length > 1 : Math.hypot(d.to.x - d.from.x, d.to.y - d.from.y) > 3;
    if (moved) setShapes((s) => [...s, d]); else setTick((n) => n + 1);
  };
  const commitText = () => {
    if (textAt && textValue.trim()) {
      const c = canvasRef.current;
      setShapes((s) => [...s, { tool: "text", colour, width: strokeFor(c), at: textAt, text: textValue.trim() }]);
    }
    setTextAt(null); setTextValue("");
  };
  const save = () => {
    const c = canvasRef.current;
    if (!c || !c.getContext("2d")) return;
    onSave(c.toDataURL("image/jpeg", 0.85));
  };

  const tools = [["pen", Paintbrush], ["arrow", MoveUpRight], ["rect", Square], ["circle", Circle], ["text", Type]];
  return (
    <div data-photo-editor className="fixed inset-0 z-50 flex flex-col" style={{ background: "#000" }}>
      <div style={{ background: COLORS.card, borderBottom: `1px solid ${COLORS.border}` }} className="flex items-center justify-between gap-2 px-3 py-2 shrink-0">
        <button onClick={onCancel} style={{ color: COLORS.muted }} className="text-xs font-bold uppercase">{t.back}</button>
        <div className="flex items-center gap-1">
          <button onClick={() => setShapes((s) => s.slice(0, -1))} disabled={!shapes.length} title={t.photoUndo} style={{ color: shapes.length ? COLORS.text : COLORS.border }} className="w-9 h-9 flex items-center justify-center"><Undo2 size={18} /></button>
          <button data-photo-save onClick={save} disabled={!ready} style={{ background: COLORS.accent, opacity: ready ? 1 : 0.5 }} className="px-4 h-9 rounded-lg text-xs font-bold uppercase">{t.saveLabel}</button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full"
          style={{ touchAction: "none", cursor: "crosshair", background: "#000" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
      </div>
      {textAt && (
        <div style={{ background: COLORS.card, borderTop: `1px solid ${COLORS.border}` }} className="flex items-center gap-2 px-3 py-2 shrink-0">
          <input autoFocus value={textValue} onChange={(e) => setTextValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") commitText(); if (e.key === "Escape") setTextAt(null); }} placeholder={t.photoTextPrompt} style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" />
          <button onClick={commitText} style={{ background: COLORS.accent }} className="px-3 h-9 rounded-lg text-xs font-bold uppercase">OK</button>
        </div>
      )}
      <div style={{ background: COLORS.card, borderTop: `1px solid ${COLORS.border}` }} className="flex items-center justify-between gap-2 px-3 py-2 shrink-0 flex-wrap">
        <div className="flex items-center gap-1">
          {tools.map(([key, Icon]) => (
            <button key={key} data-photo-tool={key} onClick={() => setTool(key)} title={t[`photoTool_${key}`]} style={{ background: tool === key ? `${COLORS.accent}33` : "transparent", color: tool === key ? COLORS.accent : COLORS.muted, border: `1px solid ${tool === key ? COLORS.accent : "transparent"}` }} className="w-9 h-9 rounded-lg flex items-center justify-center"><Icon size={18} /></button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {PHOTO_COLOURS.map((c) => (
            <button key={c} onClick={() => setColour(c)} style={{ background: c, outline: colour === c ? `2px solid ${COLORS.text}` : "none", outlineOffset: 2 }} className="w-6 h-6 rounded-full" />
          ))}
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((n) => (
            <button key={n} onClick={() => setThick(n)} style={{ color: thick === n ? COLORS.accent : COLORS.muted }} className="w-8 h-8 flex items-center justify-center">
              <span style={{ background: "currentColor", width: 4 + n * 4, height: 4 + n * 4 }} className="rounded-full" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Znüni at nine, Mittag at noon: two tiles, tap to mark taken. Today only --
// yesterday's break is corrected by the Polier in the hours review, not here.
