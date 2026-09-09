// The supervisor's day/month report and the whole-projects report,
// rendered as printable HTML. Nobody needs this until someone actually
// asks for a PDF (saveReportAsPdf, generateProjectsReport), so it is a
// lazy chunk rather than part of the first paint -- see docs/CODE_MAP.md.
// Every entry type reportSiteGroups returns gets a place in the document,
// and every hours figure comes from reportTotals, the same net-of-breaks
// number the modal and the mail already show.
import { reportRows, reportSiteGroups } from "./reports.js";
import { typeMeta } from "./ui/entries.jsx";
import { fmtDate, fmtMonth } from "./ui/format.js";

function clientNameFor(project, customers) {
  if (!project) return "";
  const c = project.customerId ? customers.find((x) => x.id === project.customerId) : null;
  return (c && c.name) || project.client || "";
}

function periodTitle(report, lang) {
  return report.period === "daily" ? fmtDate(report.periodLabel, lang) : fmtMonth(report.periodLabel, lang);
}

function renderReportDocument(t, lang, logoDataUri, subtitle, sections, remark) {
  // Notes are free text typed on a roof; the print must not become HTML
  // because someone wrote "<3" in a comment.
  const esc = (v) =>
    String(v == null ? "" : v).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const rowsHtml = (items) =>
    items
      .map(
        (i) =>
          `<tr><td>${i.regie ? `<span class="reg">${esc(t.regieShort)}</span> ` : ""}${esc(i.description)}</td><td>${esc(i.qty)}</td><td>${esc(i.unit)}</td></tr>`,
      )
      .join("");

  // What was said on site belongs on the record next to what was used.
  const notesHtml = (notes) =>
    notes && notes.length
      ? `<div class="tablabel">${t.notesLabel}</div>
         <ul class="notes">${notes.map((n) => `<li><span class="when">${esc(fmtDate(n.date, lang))}</span>${esc(n.description)}</li>`).join("")}</ul>`
      : "";

  const tableHtml = (label, items) =>
    items.length
      ? `<div class="tablabel">${label}</div>
         <table><thead><tr><th>${t.entriesTitle}</th><th>${t.qtyPlaceholder}</th><th>${t.unitPlaceholder}</th></tr></thead>
         <tbody>${rowsHtml(items)}</tbody></table>`
      : "";

  const sectionsHtml = sections
    .map(
      (s) => `
    <div class="section">
      <h2>${esc(s.title)}</h2>
      ${s.client ? `<div class="meta">${esc(s.client)}</div>` : ""}
      ${s.address ? `<div class="meta">${esc(s.address)}</div>` : ""}
      <div class="totalhours">${t.totalHoursLabel}: ${s.hours.toFixed(1)} h</div>
      ${tableHtml(t.materialsLogged, s.materials)}
      ${tableHtml(t.machinesToolsLabel, s.machines)}
      ${tableHtml(t.otherEntriesLabel, s.other || [])}
      ${notesHtml(s.notes)}
    </div>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t.appLabel}</title>
    <style>
      body { font-family: -apple-system, system-ui, sans-serif; color: #111; padding: 32px; max-width: 800px; margin: 0 auto; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #DA291C; padding-bottom: 12px; margin-bottom: 20px; }
      .header .sub { color: #666; font-size: 12px; margin-top: 2px; }
      .header h1 { font-size: 20px; margin: 0; }
      .header img { opacity: 0.9; max-width: 160px; max-height: 70px; object-fit: contain; }
      .section { margin-bottom: 28px; page-break-inside: avoid; border: 1px solid #ddd; border-radius: 6px; padding: 16px; }
      .section h2 { font-size: 16px; margin: 0 0 4px 0; color: #DA291C; }
      .meta { color: #666; font-size: 12px; }
      .totalhours { font-weight: 700; font-size: 14px; margin: 10px 0; background: #f5f5f5; padding: 8px 10px; border-radius: 4px; display: inline-block; }
      .tablabel { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin: 12px 0 4px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; margin-bottom: 8px; }
      th { text-align: left; background: #fafafa; border-bottom: 2px solid #333; padding: 6px 8px; }
      td { padding: 6px 8px; border-bottom: 1px solid #eee; word-wrap: break-word; }
      th:nth-child(1), td:nth-child(1) { width: 60%; }
      th:nth-child(2), td:nth-child(2) { width: 20%; }
      th:nth-child(3), td:nth-child(3) { width: 20%; }
      .notes { list-style: none; padding: 0; margin: 0 0 8px; font-size: 12px; }
      .notes li { padding: 6px 8px; border-bottom: 1px solid #eee; }
      .notes .when { color: #888; margin-right: 10px; font-variant-numeric: tabular-nums; }
      .reg { font-size: 9px; font-weight: 700; color: #8a5a00; border: 1px solid #8a5a00; padding: 0 3px; border-radius: 2px; }
      .remark { font-size: 12px; margin: 0 0 16px; padding: 10px 12px; background: #fff7e6; border-left: 3px solid #E0B341; white-space: pre-wrap; }
      .footer { margin-top: 24px; font-size: 11px; color: #999; }
      @media print { body { padding: 0; } .section { page-break-inside: avoid; } }
    </style>
    </head><body>
      <div class="header">
        <div>
          <h1>${t.appLabel}</h1>
          <div class="sub">${esc(subtitle)}</div>
        </div>
        <img src="${logoDataUri}" alt="logo" />
      </div>
      ${remark ? `<div class="remark">${esc(remark)}</div>` : ""}
      ${sectionsHtml || `<div class="meta">${t.noProjectsYet}</div>`}
      <div class="footer">${t.generatedOnLabel}: ${new Date().toLocaleString()}</div>
    </body></html>`;
}

export function buildReportHtml(
  report,
  { t, lang, logoDataUri, allEntries, projects, profile, customers, projectName },
) {
  const periodLabel = report.period === "daily" ? t.daily : t.monthly;
  const groups = reportSiteGroups(
    reportRows(report, allEntries),
    (e) => e.projectName || (e.projectId ? projectName(e.projectId) : "") || t.sitesLabel,
  );
  const sections = groups.map((g) => {
    const proj = projects.find((p) => p.name === g.site);
    const other = g.other.map((e) => ({
      description: `${typeMeta(e.type, t)?.label || e.type}${e.description ? `: ${e.description}` : ""}`,
      qty: e.qty ?? e.hours ?? "",
      unit: e.unit || "",
      regie: e.regie,
    }));
    return {
      title: g.site,
      client: clientNameFor(proj, customers),
      address: proj?.address || "",
      hours: g.hours,
      materials: g.materials,
      machines: g.machines,
      notes: g.notes,
      other,
    };
  });
  const subtitle = `${periodLabel} · ${periodTitle(report, lang)}${profile.name ? " · " + profile.name : ""}`;
  // The author's own remark on the report goes on top, before the sites.
  return renderReportDocument(t, lang, logoDataUri, subtitle, sections, report.notes);
}

export function buildProjectsReportHtml(projectIds, { t, lang, logoDataUri, projects, entries, profile, customers }) {
  const orderedProjects =
    projectIds && projectIds.length
      ? projectIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean)
      : projects;
  const sections = orderedProjects
    .map((p) => {
      const pEntries = entries.filter((e) => e.projectId === p.id);
      const hours = pEntries.filter((e) => e.type === "time").reduce((s, e) => s + parseFloat(e.qty || 0), 0);
      const materials = pEntries.filter((e) => e.type === "material");
      const machines = pEntries.filter((e) => e.type === "tool");
      const notes = pEntries
        .filter((e) => e.type === "note")
        .sort((a, b) => String(a.date).localeCompare(String(b.date)) || (a.createdAt || 0) - (b.createdAt || 0));
      return {
        title: p.name,
        client: clientNameFor(p, customers),
        address: p.address || "",
        hours,
        materials,
        machines,
        notes,
      };
    })
    .filter((s) => s.hours > 0 || s.materials.length > 0 || s.machines.length > 0 || s.notes.length > 0);
  const subtitle = `${profile.name || ""}${profile.name ? " · " : ""}${new Date().toLocaleDateString()}`;
  return renderReportDocument(t, lang, logoDataUri, subtitle, sections);
}
