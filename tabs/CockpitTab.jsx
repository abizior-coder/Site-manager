// The cockpit tab, loaded when first opened. State and handlers stay in the
// app and arrive as props; this module only renders.
import { isOwner, getCompanyId } from "../company-store.js";
import { getIdToken } from "../firebase-client.js";
import { backupDue } from "../backup.js";
import { fmtHM, monthKey } from "../ui/format.js";
import { COLORS } from "../ui/theme.js";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { downloadText } from "../ui/download.js";
import {
  CONTACT_HEADERS,
  JOURNAL_HEADERS,
  PAYROLL_DAY_HEADERS,
  POSITION_HEADERS,
  contactRows,
  invoiceJournal,
  invoicePositions,
  payrollCsv,
  payrollDays,
  payrollRows,
  previousMonth,
  toCsv,
} from "../accounting-export.js";

// The owner's files for the Treuhänder and for bexio: pick a month, tap.
function ExportCard({ t, documents, customers, projects, entries, team, billing, leaveRequests }) {
  const [month, setMonth] = useState(previousMonth());
  const weekly = parseFloat((billing || {}).weeklyHours) || 0;
  const members = (team && team.members) || [];
  const journal = invoiceJournal(documents, customers, projects, month);
  const people = payrollRows(entries, members, month, weekly, leaveRequests);
  const contacts = contactRows(customers);
  const files = {
    invoices: () => [`rechnungen-${month}.csv`, toCsv(JOURNAL_HEADERS, journal), journal.length],
    positions: () => [
      `rechnungspositionen-${month}.csv`,
      toCsv(POSITION_HEADERS, invoicePositions(documents, customers, month)),
      journal.length,
    ],
    payroll: () => [`lohn-stunden-${month}.csv`, payrollCsv(people), people.length],
    "payroll-days": () => {
      const rows = payrollDays(entries, members, projects, month, weekly);
      return [`lohn-stunden-tage-${month}.csv`, toCsv(PAYROLL_DAY_HEADERS, rows), rows.length];
    },
    contacts: () => [`kunden-bexio.csv`, toCsv(CONTACT_HEADERS, contacts), contacts.length],
  };
  const Btn = ({ kind, label, count }) => (
    <button
      data-export={kind}
      onClick={() => {
        const [name, text] = files[kind]();
        downloadText(name, text);
      }}
      style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}
      className="w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-between gap-2"
    >
      <span className="flex items-center gap-2 min-w-0">
        <Download size={14} color={COLORS.accent} />
        <span className="truncate">{label}</span>
      </span>
      <span style={{ color: count ? COLORS.muted : COLORS.amber }} className="text-xs shrink-0">
        {count ? count : t.exportEmpty}
      </span>
    </button>
  );
  return (
    <div
      data-export-card
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
      className="rounded-xl p-3 lg:col-span-3"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">
          {t.exportTitle}
        </div>
        <input
          data-export-month
          aria-label={t.exportMonth}
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value || month)}
          style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
          className="rounded-lg px-2 py-1 text-xs outline-none"
        />
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        <Btn kind="invoices" label={t.exportInvoices} count={journal.length} />
        <Btn kind="positions" label={t.exportPositions} count={journal.length} />
        <Btn kind="payroll" label={t.exportPayroll} count={people.filter((p) => p.worked > 0).length} />
        <Btn kind="payroll-days" label={t.exportPayrollDays} count={people.reduce((s, p) => s + p.worked, 0)} />
        <Btn kind="contacts" label={t.exportContacts} count={contacts.length} />
      </div>
      <div style={{ color: COLORS.muted }} className="text-xs mt-2 leading-relaxed">
        {t.exportHint}
      </div>
    </div>
  );
}

// The same Worker the app talks to (roofing-site-manager.jsx keeps the
// other copy; a logic test holds the two equal).
const WORKER_URL = "https://site-log-claude-proxy.abizior.workers.dev";

// One GET under the company, as the signed-in person; `empty` when the
// Worker has nothing or the network is gone.
function useWorkerData(path, empty) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cid = getCompanyId();
        const token = await getIdToken();
        const res = await fetch(`${WORKER_URL}${path.replace("{cid}", cid)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.ok ? await res.json() : null;
        if (alive) setData(d && typeof d === "object" ? d : empty);
      } catch {
        if (alive) setData(empty);
      }
    })();
    return () => {
      alive = false;
    };
  }, [path]);
  return data;
}

// What crashed on the crew's phones this week: count and the last ten, so
// the owner (and the developer on the phone with them) sees it before a
// complaint arrives.
function ErrorsCard({ t }) {
  const errorsLog = useWorkerData("/errors/{cid}?days=7", { days: [], recent: [] });
  const total = errorsLog ? (errorsLog.days || []).reduce((s, d) => s + (d.count || 0), 0) : 0;
  return (
    <div
      data-errors-card
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
      className="rounded-xl p-3 lg:col-span-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">
          {t.ccErrors}
        </div>
        {errorsLog && (
          <span style={{ color: total ? COLORS.amber : COLORS.success }} className="text-sm font-black">
            {total}
          </span>
        )}
      </div>
      {!errorsLog && (
        <div style={{ color: COLORS.muted }} className="text-xs">
          {t.ccUsageLoading}
        </div>
      )}
      {errorsLog && total === 0 && (
        <div style={{ color: COLORS.muted }} className="text-xs">
          {t.ccErrorsNone}
        </div>
      )}
      {errorsLog && total > 0 && (
        <div className="flex flex-col gap-1">
          {(errorsLog.recent || []).map((e, i) => (
            <div key={i} className="text-xs font-mono truncate" title={e.stack || ""}>
              <span style={{ color: COLORS.amber }}>{e.code}</span> {e.tag} · {new Date(e.at).toLocaleString()} ·{" "}
              {e.build} · {e.ua} · {e.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsageCard({ t }) {
  const usage = useWorkerData("/metrics/{cid}?days=30", { days: [], totals: {}, activePeople: 0 });
  const days = (usage && usage.days) || [];
  const totals = (usage && usage.totals) || {};
  const last7 = days.slice(-7);
  const sum = (list, pick) =>
    list.reduce(
      (s, d) =>
        s +
        Object.entries(d.events || {})
          .filter(([k]) => pick(k))
          .reduce((x, [, v]) => x + v, 0),
      0,
    );
  const entries7 = sum(last7, (k) => k.startsWith("entry."));
  const active7 = Math.max(...last7.map((d) => d.active), 0);
  const entries30 = Object.entries(totals)
    .filter(([k]) => k.startsWith("entry."))
    .reduce((s, [, v]) => s + v, 0);
  const reports30 = (totals["report.sent"] || 0) + (totals["rapport.sign"] || 0);
  const trips30 = (totals["entry.transport"] || 0) + (totals["entry.inspection"] || 0);
  const maxActive = Math.max(...days.map((d) => d.active), 1);
  const tile = (label, value) => (
    <div
      key={label}
      style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}
      className="rounded-lg p-2.5"
    >
      <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">
        {label}
      </div>
      <div className="text-lg font-black leading-tight">{value}</div>
    </div>
  );
  return (
    <div
      data-usage-card
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
      className="rounded-xl p-3 lg:col-span-3"
    >
      <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">
        {t.ccUsage}
      </div>
      {!usage && (
        <div style={{ color: COLORS.muted }} className="text-xs">
          {t.ccUsageLoading}
        </div>
      )}
      {usage && days.length === 0 && (
        <div style={{ color: COLORS.muted }} className="text-xs">
          {t.ccUsageEmpty}
        </div>
      )}
      {usage && days.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            {tile(t.ccUsageActive30, String(usage.activePeople || 0))}
            {tile(t.ccUsageActive7, String(active7))}
            {tile(t.ccUsageEntries30, `${entries30} · ${entries7}`)}
            {tile(t.ccUsageReports30, String(reports30))}
            {tile(t.ccUsageTrips30, String(trips30))}
          </div>
          <div className="flex items-end gap-[3px] h-10 mt-3">
            {days.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.active}`}
                style={{
                  height: `${Math.max(6, Math.round((d.active / maxActive) * 100))}%`,
                  background: d.active ? COLORS.accent : COLORS.border,
                }}
                className="flex-1 rounded-sm"
              />
            ))}
          </div>
          <div style={{ color: COLORS.muted }} className="text-xs mt-2">
            {t.ccUsageFootnote}
          </div>
        </>
      )}
    </div>
  );
}

// bexio: connect with a Personal Access Token (kept only in the Worker),
// push customers and a month's invoices; every answer from bexio is shown.
function BexioCard({ t, customers, documents, projects }) {
  const [status, setStatus] = useState(null);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [month, setMonth] = useState(previousMonth());
  const [dryRun, setDryRun] = useState(true);
  const call = async (method, action, body) => {
    const cid = getCompanyId();
    const tok = await getIdToken();
    const res = await fetch(`${WORKER_URL}/bexio/${cid}/${action}`, {
      method,
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `bexio ${res.status}`);
    return data;
  };
  useEffect(() => {
    let alive = true;
    call("GET", "status")
      .then((s) => alive && setStatus(s))
      .catch((e) => alive && setStatus({ connected: false, unavailable: e.message }));
    return () => {
      alive = false;
    };
  }, []);
  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const connect = () =>
    run(async () => {
      const r = await call("PUT", "token", { token: token.trim() });
      setStatus(r.status);
      setToken("");
    });
  const disconnect = () =>
    run(async () => {
      await call("DELETE", "token");
      setStatus({ connected: false });
      setResult(null);
    });
  const monthInvoices = (documents || []).filter(
    (d) => d.type === "invoice" && (d.status || "draft") !== "draft" && String(d.date || "").startsWith(month),
  );
  const push = (what) =>
    run(async () => {
      const body = { dryRun, projects: (projects || []).map((p) => ({ id: p.id, name: p.name })) };
      if (what === "contacts") body.contacts = customers || [];
      if (what === "invoices") {
        body.invoices = monthInvoices;
        body.contacts = (customers || []).filter((c) => monthInvoices.some((d) => d.customerId === c.id));
      }
      const r = await call("POST", "push", body);
      setResult({ what, ...r });
    });
  const line = (s) => `${s.user || ""} · ${new Date(s.since).toLocaleDateString()} · ${s.expiresInDays} d`;
  return (
    <div
      data-bexio-card
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
      className="rounded-xl p-3 lg:col-span-3"
    >
      <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">
        {t.bexioTitle}
      </div>
      {!status && (
        <div style={{ color: COLORS.muted }} className="text-xs">
          {t.ccUsageLoading}
        </div>
      )}
      {status && status.unavailable && (
        <div style={{ color: COLORS.amber }} className="text-xs mb-2">
          {status.unavailable}
        </div>
      )}
      {status && !status.connected && (
        <div className="flex flex-col gap-2">
          <div style={{ color: COLORS.muted }} className="text-xs leading-relaxed">
            {t.bexioHowTo}
          </div>
          <input
            data-bexio-token
            type="password"
            autoComplete="off"
            aria-label={t.bexioTokenLabel}
            placeholder={t.bexioTokenLabel}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none font-mono"
          />
          <button
            data-bexio-connect
            disabled={busy || token.trim().length < 20}
            onClick={connect}
            style={{ background: COLORS.accent, opacity: busy || token.trim().length < 20 ? 0.5 : 1 }}
            className="w-full py-2.5 rounded-lg text-xs font-bold uppercase"
          >
            {t.bexioConnect}
          </button>
        </div>
      )}
      {status && status.connected && (
        <div className="flex flex-col gap-2">
          <div className="text-sm">
            <span style={{ color: COLORS.success }} className="font-bold">
              {t.bexioConnected}
            </span>{" "}
            <span style={{ color: COLORS.muted }} className="text-xs">
              {line(status)}
            </span>
          </div>
          {status.renewSoon && (
            <div style={{ color: COLORS.amber }} className="text-xs">
              {t.bexioRenew}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              data-bexio-month
              aria-label={t.exportMonth}
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value || month)}
              style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              className="rounded-lg px-2 py-1 text-xs outline-none"
            />
            <label className="flex items-center gap-1.5 text-xs" style={{ color: COLORS.muted }}>
              <input data-bexio-dry type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />{" "}
              {t.bexioDryRun}
            </label>
          </div>
          <div className="grid gap-2 lg:grid-cols-2">
            <button
              data-bexio-push-contacts
              disabled={busy}
              onClick={() => push("contacts")}
              style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}
              className="py-2.5 rounded-lg text-xs font-bold"
            >
              {t.bexioPushContacts} ({(customers || []).length})
            </button>
            <button
              data-bexio-push-invoices
              disabled={busy}
              onClick={() => push("invoices")}
              style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}
              className="py-2.5 rounded-lg text-xs font-bold"
            >
              {t.bexioPushInvoices} ({monthInvoices.length})
            </button>
          </div>
          {result && (
            <div data-bexio-result className="flex flex-col gap-1 text-xs">
              <div style={{ color: COLORS.muted }}>{result.dryRun ? t.bexioDryRunDone : t.bexioPushed}</div>
              {[...(result.results.contacts || []), ...(result.results.invoices || [])].slice(0, 40).map((r, i) => (
                <div
                  key={i}
                  className="font-mono truncate"
                  style={{ color: r.status === "error" ? COLORS.dangerText : COLORS.text }}
                >
                  {r.number || r.id} · {r.status}
                  {r.bexioId ? ` · #${r.bexioId}` : ""}
                  {r.error ? ` · ${r.error}` : ""}
                </div>
              ))}
            </div>
          )}
          <button
            data-bexio-disconnect
            disabled={busy}
            onClick={disconnect}
            style={{ color: COLORS.muted }}
            className="text-xs underline self-start"
          >
            {t.bexioDisconnect}
          </button>
        </div>
      )}
      {error && (
        <div data-bexio-error style={{ color: COLORS.dangerText }} className="text-xs mt-2">
          {error}
        </div>
      )}
    </div>
  );
}

// How long since the owner last exported; a nudge once a week has passed.
function BackupCard({ t, backupMeta, onBackup }) {
  const state = backupDue(backupMeta && backupMeta.lastAt);
  const line = state.never
    ? t.backupNever
    : `${t.backupLast} ${new Date(backupMeta.lastAt).toLocaleDateString()} (${state.daysAgo} d)`;
  return (
    <div
      data-backup-card
      data-due={state.due ? "1" : "0"}
      style={{ background: COLORS.card, border: `1px solid ${state.due ? COLORS.amber : COLORS.border}` }}
      className="rounded-xl p-3"
    >
      <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1">
        {t.backupCardTitle}
      </div>
      <div style={{ color: state.due ? COLORS.amber : COLORS.success }} className="text-sm font-bold mb-2">
        {state.due ? t.backupOverdue : t.backupOk}
      </div>
      <div style={{ color: COLORS.muted }} className="text-xs mb-3">
        {line}
      </div>
      <button
        data-backup-now
        onClick={onBackup}
        style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}
        className="w-full py-2.5 rounded-lg text-xs font-bold uppercase"
      >
        {t.backupNowBtn}
      </button>
    </div>
  );
}

export function CockpitTab({
  approveEntry,
  backupMeta,
  billing,
  commandCentre,
  customers,
  documents,
  entries,
  hoursBalance,
  leaveRequests,
  money,
  onBackup,
  projects,
  setDocEditor,
  setHoursModalOpen,
  setLeaveStatus,
  setSelectedCustomer,
  setTab,
  t,
  team,
}) {
  const c = commandCentre();
  // On a desk the point is seeing it all at once; on a phone it stays a
  // single column.
  const Tile = ({ label, value, color, sub }) => (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3">
      <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1">
        {label}
      </div>
      <div style={{ color: color || COLORS.text }} className="text-lg font-black leading-tight">
        {value}
      </div>
      {sub && (
        <div style={{ color: COLORS.muted }} className="text-xs mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:items-start lg:[&>*]:min-w-0">
      {/* Money is the owner’s view. A supervisor gets what they can
          actually act on: work waiting to be checked. */}
      {isOwner() ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:col-span-3">
          <Tile
            label={t.ccOutstanding}
            value={money(c.outstanding)}
            sub={`${c.unpaidCount} ${t.invoiceLabel}`}
            color={c.outstanding > 0 ? COLORS.amber : COLORS.success}
          />
          <Tile
            label={t.ccOverdue}
            value={money(c.overdue)}
            sub={`${c.overdueCount} ${t.invoiceLabel}`}
            color={c.overdue > 0 ? COLORS.danger : COLORS.success}
          />
          <Tile label={t.ccPaidThisMonth} value={money(c.paidThisMonth)} color={COLORS.success} />
          <Tile
            label={t.ccPipeline}
            value={money(c.pipelineValue)}
            sub={`${c.leads} ${t.projStatusLead}`}
            color="#B48EAD"
          />
        </div>
      ) : null}

      {isOwner() && <UsageCard t={t} />}
      {isOwner() && <ErrorsCard t={t} />}
      {isOwner() && <BackupCard t={t} backupMeta={backupMeta} onBackup={onBackup} />}
      {isOwner() && <BexioCard t={t} customers={customers} documents={documents} projects={projects} />}
      {isOwner() && (
        <ExportCard
          t={t}
          documents={documents}
          customers={customers}
          projects={projects}
          entries={entries}
          team={team}
          billing={billing}
          leaveRequests={leaveRequests}
        />
      )}

      <div className="grid grid-cols-2 gap-2 lg:col-span-3">
        <Tile
          label={t.ccHoursToApprove}
          value={String(c.pendingHours.length)}
          color={c.pendingHours.length ? COLORS.amber : COLORS.success}
        />
        <Tile
          label={t.ccLeaveToDecide}
          value={String(c.pendingLeave.length)}
          color={c.pendingLeave.length ? COLORS.amber : COLORS.success}
        />
      </div>

      {c.pendingHours.length > 0 && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3">
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">
            {t.ccHoursToApprove}
          </div>
          <div className="flex flex-col gap-1.5">
            {c.pendingHours.slice(0, 8).map((e) => {
              const m = team.members.find((x) => x.uid === e.userId);
              const pr = projects.find((x) => x.id === e.projectId);
              return (
                <div
                  key={e.id}
                  style={{ background: COLORS.cardAlt }}
                  className="rounded-lg px-3 py-2 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm truncate">
                      {m ? m.name || m.email || e.userId : t.ccUnassigned} · {e.qty} h
                    </div>
                    <div style={{ color: COLORS.muted }} className="text-xs truncate">
                      {e.date} · {pr ? pr.name : "—"}
                    </div>
                  </div>
                  <button
                    onClick={() => approveEntry(e)}
                    style={{ background: COLORS.success, color: "#12210A" }}
                    className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase"
                  >
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
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">
            {t.ccLeaveToDecide}
          </div>
          <div className="flex flex-col gap-1.5">
            {c.pendingLeave.slice(0, 8).map((r) => {
              const m = team.members.find((x) => x.uid === r.userId);
              return (
                <div
                  key={r.id}
                  data-leave-row
                  style={{ background: COLORS.cardAlt }}
                  className="rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-2"
                >
                  {/* The name keeps 10 rem; the two buttons wrap under it on a
                      phone instead of squeezing it to nothing. */}
                  <div className="min-w-0 flex-1 basis-40">
                    <div className="text-sm truncate">{m ? m.name || m.email || r.userId : t.ccUnassigned}</div>
                    <div style={{ color: COLORS.muted }} className="text-xs truncate">
                      {r.date} ·{" "}
                      {t[`leave${(r.type || "other").charAt(0).toUpperCase()}${(r.type || "other").slice(1)}`] ||
                        t.leaveOther}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setLeaveStatus(r.id, "approved")}
                      style={{ background: COLORS.success, color: "#12210A" }}
                      className="px-2.5 py-1.5 rounded-full text-xs font-bold uppercase"
                    >
                      {t.markApproved}
                    </button>
                    <button
                      onClick={() => setLeaveStatus(r.id, "declined")}
                      style={{
                        background: COLORS.cardAlt,
                        border: `1px solid ${COLORS.danger}`,
                        color: COLORS.dangerText,
                      }}
                      className="px-2.5 py-1.5 rounded-full text-xs font-bold uppercase"
                    >
                      {t.markDeclined}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3">
        <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">
          {t.ccOnSite}
        </div>
        {c.onSite.length === 0 ? (
          <div style={{ color: COLORS.muted }} className="text-xs">
            {t.ccNobodyOnSite}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {c.onSite.map((p) => (
              <div key={p.uid} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm truncate">{p.name}</div>
                  <div style={{ color: COLORS.muted }} className="text-xs truncate">
                    {p.project ? p.project.name : "—"}
                  </div>
                </div>
                <span style={{ color: COLORS.success }} className="text-xs font-bold shrink-0">
                  {fmtHM(Date.now() - p.since)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3">
        <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">
          {t.ccPlannedToday}
        </div>
        {c.plannedToday.length === 0 ? (
          <div style={{ color: COLORS.muted }} className="text-xs">
            {t.ccNobodyPlanned}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {c.plannedToday.map((a) => {
              const m = team.members.find((x) => x.uid === a.userId);
              const pr = projects.find((x) => x.id === a.projectId);
              return (
                <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{m ? m.name || m.email || a.userId : a.userId}</span>
                  <span style={{ color: COLORS.muted }} className="shrink-0 truncate max-w-[55%] text-right">
                    {pr ? pr.name : "\u2014"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {Object.keys(c.hoursByUser).length > 0 && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-3">
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2">
            {t.ccHoursThisMonth}
          </div>
          <div className="flex flex-col gap-2">
            {Object.entries(c.hoursByUser)
              .sort((a, b) => b[1] - a[1])
              .map(([uidKey, hrs]) => {
                const m = team.members.find((x) => x.uid === uidKey);
                const bal = hoursBalance(uidKey, { from: monthKey() + "-01" });
                return (
                  <div key={uidKey} className="flex items-start justify-between gap-2 text-sm">
                    <span className="truncate">{m ? m.name || m.email || uidKey : t.ccUnassigned}</span>
                    <span className="shrink-0 text-right">
                      <span style={{ color: COLORS.muted }}>{hrs.toFixed(1)} h</span>
                      {bal.configured && bal.overtime !== null && Math.abs(bal.overtime) >= 0.1 && (
                        <span
                          style={{ color: bal.overtime > 0 ? COLORS.amber : COLORS.muted }}
                          className="block text-xs"
                        >
                          {bal.overtime > 0 ? "+" : ""}
                          {bal.overtime.toFixed(1)} h {t.overtimeShort}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
          </div>
          {!isOwner() ? null : (
            <button
              onClick={() => setHoursModalOpen(true)}
              style={{ color: COLORS.accentText }}
              className="mt-2 text-xs font-bold uppercase"
            >
              {t.hoursDetailBtn}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Tile label={t.ccActiveJobs} value={String(c.activeJobs)} />
        <Tile
          label={t.followUpsDue}
          value={String(c.dueFollow.length)}
          color={c.dueFollow.length ? COLORS.amber : COLORS.text}
        />
      </div>

      {(c.overdueList.length > 0 || c.dueFollow.length > 0 || c.expiringCerts.length > 0) && (
        <div
          style={{ background: `${COLORS.amber}14`, border: `1px solid ${COLORS.amber}55` }}
          className="rounded-xl p-3"
        >
          <div style={{ color: COLORS.amber }} className="text-xs uppercase tracking-wide mb-2 font-bold">
            {t.ccAttention}
          </div>
          <div className="flex flex-col gap-1.5">
            {isOwner() &&
              c.overdueList.slice(0, 5).map(({ doc, st }) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setTab("projects");
                    setDocEditor({ ...doc });
                  }}
                  style={{ background: COLORS.card }}
                  className="w-full text-left rounded-lg px-3 py-2"
                >
                  <div className="text-sm">
                    {t.invoiceLabel} {doc.number} · {money(st.outstanding)}
                  </div>
                  <div style={{ color: COLORS.dangerText }} className="text-xs">
                    {t.overdueLabel} — {doc.dueDate}
                  </div>
                </button>
              ))}
            {c.dueFollow.slice(0, 3).map(({ customer, contact }) => (
              <button
                key={contact.id}
                onClick={() => {
                  setTab("customers");
                  setSelectedCustomer(customer.id);
                }}
                style={{ background: COLORS.card }}
                className="w-full text-left rounded-lg px-3 py-2"
              >
                <div className="text-sm truncate">{customer.name}</div>
                <div style={{ color: COLORS.muted }} className="text-xs truncate">
                  {t.followUpLabel} {contact.followUp}
                </div>
              </button>
            ))}
            {c.expiringCerts.slice(0, 3).map((cert) => (
              <div key={cert.id} style={{ background: COLORS.card }} className="rounded-lg px-3 py-2">
                <div className="text-sm truncate">{cert.title}</div>
                <div style={{ color: COLORS.amber }} className="text-xs">
                  {t.ccCertExpiring} {cert.expiryDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ color: COLORS.muted }} className="text-xs text-center leading-relaxed lg:col-span-3">
        {t.ccFootnote}
      </div>
    </div>
  );
}
