// The cockpit tab, loaded when first opened. State and handlers stay in the
// app and arrive as props; this module only renders.
import { isOwner } from "../company-store.js";
import { fmtHM, monthKey } from "../ui/format.js";
import { COLORS } from "../ui/theme.js";
import { UsageCard } from "../roofing-site-manager.jsx";

export function CockpitTab({ approveEntry, commandCentre, customers, hoursBalance, loadUsage, money, projects, setDocEditor, setHoursModalOpen, setLeaveStatus, setSelectedCustomer, setTab, t, team, usage }) {
  const c = commandCentre();
  // On a desk the point is seeing it all at once; on a phone it stays a
  // single column.
  const Tile = ({ label, value, color, sub }) => (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3">
      <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-1">{label}</div>
      <div style={{ color: color || COLORS.text }} className="text-lg font-black leading-tight">{value}</div>
      {sub && <div style={{ color: COLORS.muted }} className="text-[10px] mt-0.5">{sub}</div>}
    </div>
  );
  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:items-start lg:[&>*]:min-w-0">
      {/* Money is the owner’s view. A supervisor gets what they can
          actually act on: work waiting to be checked. */}
      {isOwner() ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:col-span-3">
          <Tile label={t.ccOutstanding} value={money(c.outstanding)} sub={`${c.unpaidCount} ${t.invoiceLabel}`} color={c.outstanding > 0 ? COLORS.amber : COLORS.success} />
          <Tile label={t.ccOverdue} value={money(c.overdue)} sub={`${c.overdueCount} ${t.invoiceLabel}`} color={c.overdue > 0 ? COLORS.danger : COLORS.success} />
          <Tile label={t.ccPaidThisMonth} value={money(c.paidThisMonth)} color={COLORS.success} />
          <Tile label={t.ccPipeline} value={money(c.pipelineValue)} sub={`${c.leads} ${t.projStatusLead}`} color="#B48EAD" />
        </div>
      ) : null}

      {isOwner() && <UsageCard t={t} usage={usage} onLoad={loadUsage} />}

      <div className="grid grid-cols-2 gap-2 lg:col-span-3">
        <Tile label={t.ccHoursToApprove} value={String(c.pendingHours.length)} color={c.pendingHours.length ? COLORS.amber : COLORS.success} />
        <Tile label={t.ccLeaveToDecide} value={String(c.pendingLeave.length)} color={c.pendingLeave.length ? COLORS.amber : COLORS.success} />
      </div>

      {c.pendingHours.length > 0 && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3">
          <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-2">{t.ccHoursToApprove}</div>
          <div className="flex flex-col gap-1.5">
            {c.pendingHours.slice(0, 8).map((e) => {
              const m = team.members.find((x) => x.uid === e.userId);
              const pr = projects.find((x) => x.id === e.projectId);
              return (
                <div key={e.id} style={{ background: COLORS.cardAlt }} className="rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm truncate">{m ? (m.name || m.email || e.userId) : t.ccUnassigned} · {e.qty} h</div>
                    <div style={{ color: COLORS.muted }} className="text-[10px] truncate">{e.date} · {pr ? pr.name : "—"}</div>
                  </div>
                  <button onClick={() => approveEntry(e)} style={{ background: COLORS.success, color: "#12210A" }} className="shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase">
                    {t.approveBtn}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {c.pendingLeave.length > 0 && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3">
          <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-2">{t.ccLeaveToDecide}</div>
          <div className="flex flex-col gap-1.5">
            {c.pendingLeave.slice(0, 8).map((r) => {
              const m = team.members.find((x) => x.uid === r.userId);
              return (
                <div key={r.id} style={{ background: COLORS.cardAlt }} className="rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm truncate">{m ? (m.name || m.email || r.userId) : t.ccUnassigned}</div>
                    <div style={{ color: COLORS.muted }} className="text-[10px] truncate">{r.date} · {t[`leave${(r.type || "other").charAt(0).toUpperCase()}${(r.type || "other").slice(1)}`] || t.leaveOther}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setLeaveStatus(r.id, "approved")} style={{ background: COLORS.success, color: "#12210A" }} className="px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase">{t.markApproved}</button>
                    <button onClick={() => setLeaveStatus(r.id, "declined")} style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.danger}`, color: COLORS.danger }} className="px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase">{t.markDeclined}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3">
        <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-2">{t.ccOnSite}</div>
        {c.onSite.length === 0 ? (
          <div style={{ color: COLORS.muted }} className="text-xs">{t.ccNobodyOnSite}</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {c.onSite.map((p) => (
              <div key={p.uid} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm truncate">{p.name}</div>
                  <div style={{ color: COLORS.muted }} className="text-[10px] truncate">{p.project ? p.project.name : "—"}</div>
                </div>
                <span style={{ color: COLORS.success }} className="text-xs font-bold shrink-0">{fmtHM(Date.now() - p.since)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3">
        <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-2">{t.ccPlannedToday}</div>
        {c.plannedToday.length === 0 ? (
          <div style={{ color: COLORS.muted }} className="text-xs">{t.ccNobodyPlanned}</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {c.plannedToday.map((a) => {
              const m = team.members.find((x) => x.uid === a.userId);
              const pr = projects.find((x) => x.id === a.projectId);
              return (
                <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{m ? (m.name || m.email || a.userId) : a.userId}</span>
                  <span style={{ color: COLORS.muted }} className="shrink-0 truncate max-w-[55%] text-right">{pr ? pr.name : "\u2014"}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {Object.keys(c.hoursByUser).length > 0 && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3">
          <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-2">{t.ccHoursThisMonth}</div>
          <div className="flex flex-col gap-2">
            {Object.entries(c.hoursByUser).sort((a, b) => b[1] - a[1]).map(([uidKey, hrs]) => {
              const m = team.members.find((x) => x.uid === uidKey);
              const bal = hoursBalance(uidKey, { from: monthKey() + "-01" });
              return (
                <div key={uidKey} className="flex items-start justify-between gap-2 text-sm">
                  <span className="truncate">{m ? (m.name || m.email || uidKey) : t.ccUnassigned}</span>
                  <span className="shrink-0 text-right">
                    <span style={{ color: COLORS.muted }}>{hrs.toFixed(1)} h</span>
                    {bal.configured && bal.overtime !== null && Math.abs(bal.overtime) >= 0.1 && (
                      <span style={{ color: bal.overtime > 0 ? COLORS.amber : COLORS.muted }} className="block text-[10px]">
                        {bal.overtime > 0 ? "+" : ""}{bal.overtime.toFixed(1)} h {t.overtimeShort}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          {!isOwner() ? null : (
            <button onClick={() => setHoursModalOpen(true)} style={{ color: COLORS.accent }} className="mt-2 text-[11px] font-bold uppercase">
              {t.hoursDetailBtn}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Tile label={t.ccActiveJobs} value={String(c.activeJobs)} />
        <Tile label={t.followUpsDue} value={String(c.dueFollow.length)} color={c.dueFollow.length ? COLORS.amber : COLORS.text} />
      </div>

      {(c.overdueList.length > 0 || c.dueFollow.length > 0 || c.expiringCerts.length > 0) && (
        <div style={{ background: `${COLORS.amber}14`, border: `1px solid ${COLORS.amber}55` }} className="rounded-xl p-3">
          <div style={{ color: COLORS.amber }} className="text-[10px] uppercase tracking-wide mb-2 font-bold">{t.ccAttention}</div>
          <div className="flex flex-col gap-1.5">
            {isOwner() && c.overdueList.slice(0, 5).map(({ doc, st }) => (
              <button key={doc.id} onClick={() => { setTab("projects"); setDocEditor({ ...doc }); }} style={{ background: COLORS.card }} className="w-full text-left rounded-lg px-3 py-2">
                <div className="text-sm">{t.invoiceLabel} {doc.number} · {money(st.outstanding)}</div>
                <div style={{ color: COLORS.danger }} className="text-[10px]">{t.overdueLabel} — {doc.dueDate}</div>
              </button>
            ))}
            {c.dueFollow.slice(0, 3).map(({ customer, contact }) => (
              <button key={contact.id} onClick={() => { setTab("customers"); setSelectedCustomer(customer.id); }} style={{ background: COLORS.card }} className="w-full text-left rounded-lg px-3 py-2">
                <div className="text-sm truncate">{customer.name}</div>
                <div style={{ color: COLORS.muted }} className="text-[10px] truncate">{t.followUpLabel} {contact.followUp}</div>
              </button>
            ))}
            {c.expiringCerts.slice(0, 3).map((cert) => (
              <div key={cert.id} style={{ background: COLORS.card }} className="rounded-lg px-3 py-2">
                <div className="text-sm truncate">{cert.title}</div>
                <div style={{ color: COLORS.amber }} className="text-[10px]">{t.ccCertExpiring} {cert.expiryDate}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ color: COLORS.muted }} className="text-[10px] text-center leading-relaxed lg:col-span-3">{t.ccFootnote}</div>
    </div>
  );
}
