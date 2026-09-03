// The entry list: one row per entry, grouped by type, plus the pieces the
// rows need (the type table, the stored photo, the Stat line).
import { useState, useEffect } from "react";
import { Camera, ChevronRight, ClipboardCheck, Clock, Coffee, MessageSquare, Package, Pencil, QrCode, Trash2, Truck, Wrench } from "lucide-react";
import { COLORS } from "./theme.js";

export const photoCache = new Map();

async function savePhoto(dataUrl, meta) {
  const id = uid();
  await window.storage.set(`photo-${id}`, dataUrl, meta);
  photoCache.set(id, dataUrl);
  return id;
}

export async function loadPhoto(id) {
  if (!id) return null;
  if (photoCache.has(id)) return photoCache.get(id);
  try {
    const res = await window.storage.get(`photo-${id}`);
    const value = res ? res.value : null;
    if (value) photoCache.set(id, value);
    return value;
  } catch {
    return null;
  }
}

async function deletePhoto(id) {
  if (!id) return;
  photoCache.delete(id);
  try { await window.storage.delete(`photo-${id}`); } catch {}
}

// Renders either a stored photo (by id) or a legacy inline data URL, so
// entries saved before photos moved out of the blob still display.
export function StoredImage({ photoId, photo, className, alt = "" }) {
  const [src, setSrc] = useState(photo || null);
  useEffect(() => {
    let alive = true;
    if (photo) { setSrc(photo); return; }
    if (!photoId) { setSrc(null); return; }
    loadPhoto(photoId).then((v) => { if (alive) setSrc(v); });
    return () => { alive = false; };
  }, [photoId, photo]);
  if (!src) return <div className={className} style={{ background: COLORS.cardAlt }} />;
  return <img src={src} alt={alt} className={className} />;
}

export function typeMeta(type, t) {
  const map = {
    time: { label: t.typeTime, icon: Clock, color: COLORS.accent },
    material: { label: t.typeMaterial, icon: Package, color: COLORS.success },
    tool: { label: t.typeTool, icon: Wrench, color: COLORS.amber },
    note: { label: t.typeNote, icon: MessageSquare, color: COLORS.muted },
    photo: { label: t.typePhoto, icon: Camera, color: "#7FA0C7" },
    pickup: { label: t.typePickup, icon: QrCode, color: "#C9A6F5" },
    inspection: { label: t.typeInspection, icon: ClipboardCheck, color: "#6FB3D9" },
    order: { label: t.typeOrder, icon: Truck, color: "#C68B4F" },
    break: { label: t.typeBreak, icon: Coffee, color: "#B48EAD" },
    transport: { label: t.typeTransport, icon: Truck, color: "#C68B4F" },
  };
  return map[type];
}

export function Stat({ label, value, color }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ color: COLORS.muted }} className="text-sm">{label}</span>
      <span style={{ color }} className="font-black text-lg">{value}</span>
    </div>
  );
}

export function EntryRow({ entry, projectName, t, onEditTime, onEditEntry, onDelete }) {
  const meta = typeMeta(entry.type, t);
  const Icon = meta.icon;
  const handleEdit = entry.type === "time" ? onEditTime : onEditEntry;
  return (
    <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}` }} className="rounded-lg p-3 flex items-start gap-3">
      <div style={{ background: COLORS.shell, border: `1px solid ${meta.color}` }} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} color={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ whiteSpace: entry.type === "inspection" ? "pre-wrap" : "normal" }} className="text-sm font-semibold">{entry.description}</div>
        <div style={{ color: COLORS.muted }} className="text-xs mt-0.5">
          {meta.label}{entry.qty ? ` · ${entry.qty}${entry.unit ? " " + entry.unit : ""}` : ""}{entry.projectId ? ` · ${projectName(entry.projectId)}` : ""}
        </div>
        {(entry.photo || entry.photoId) && <StoredImage photo={entry.photo} photoId={entry.photoId} className="w-full rounded-md mt-2 max-h-32 object-cover" />}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {handleEdit && <button onClick={() => handleEdit(entry)} style={{ color: COLORS.muted }}><Pencil size={14} /></button>}
        {onDelete && <button onClick={() => onDelete(entry)} style={{ color: COLORS.danger }}><Trash2 size={14} /></button>}
      </div>
    </div>
  );
}

export const ENTRY_TYPE_ORDER = ["time", "break", "material", "tool", "order", "transport", "photo", "pickup", "inspection", "note"];

export function EntryGroups({ entries, projectName, t, emptyLabel, onEditTime, onEditEntry, onDelete }) {
  const [expanded, setExpanded] = useState({});
  if (!entries || entries.length === 0) {
    return emptyLabel ? <div style={{ color: COLORS.muted }} className="text-sm">{emptyLabel}</div> : null;
  }
  const groups = {};
  entries.forEach((e) => { (groups[e.type] = groups[e.type] || []).push(e); });
  const presentTypes = ENTRY_TYPE_ORDER.filter((ty) => groups[ty] && groups[ty].length > 0);
  return (
    <div className="flex flex-col gap-2">
      {presentTypes.map((ty) => {
        const meta = typeMeta(ty, t);
        const Icon = meta.icon;
        const isOpen = !!expanded[ty];
        const items = groups[ty];
        return (
          <div key={ty} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-lg overflow-hidden">
            <button onClick={() => setExpanded((s) => ({ ...s, [ty]: !s[ty] }))} className="w-full flex items-center justify-between px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon size={15} color={meta.color} /> {meta.label}
                <span style={{ color: COLORS.muted }} className="text-xs font-normal">({items.length})</span>
              </span>
              <ChevronRight size={16} color={COLORS.muted} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
            </button>
            {isOpen && (
              <div style={{ borderTop: `1px solid ${COLORS.border}` }} className="px-3 pt-2 pb-3 flex flex-col gap-2">
                {items.map((e) => (<EntryRow key={e.id} entry={e} projectName={projectName} t={t} onEditTime={onEditTime} onEditEntry={onEditEntry} onDelete={onDelete} />))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
