// The board tab, loaded when first opened. State and handlers stay in the
// app and arrive as props; this module only renders.
import { todayKey } from "../ui/format.js";
import { COLORS } from "../ui/theme.js";
import { Camera, ChevronLeft, ChevronRight, ClipboardCheck, Clock, Hammer, Package, Wrench } from "lucide-react";
import { Fragment, useEffect, useRef } from "react";
import { DEFAULT_PROJECT_STATUS, projectColour, statusMeta } from "../roofing-site-manager.jsx";

// The week grid's pinned name column and the gap after it (gap-1.5).
const PIN_W = 140;
const PIN_GAP = 6;

export function BoardTab({
  assignments,
  boardView,
  calMonth,
  customers,
  dragProject,
  entries,
  lang,
  leaveRequests,
  openBranch,
  printRapport,
  projects,
  setAssignModal,
  setBoardView,
  setCalMonth,
  setDragProject,
  setOpenBranch,
  setSelectedProject,
  setShowFinishedJobs,
  setTab,
  setWeekAnchor,
  showFinishedJobs,
  siteReports,
  t,
  team,
  toggleAssignment,
  weekAnchor,
  weekDays,
}) {
  const localeMap = {
    en: "en-US",
    de: "de-CH",
    fr: "fr-CH",
    it: "it-CH",
    es: "es-ES",
    pt: "pt-PT",
    pl: "pl-PL",
    sk: "sk-SK",
    cs: "cs-CZ",
  };
  const locale = localeMap[lang] || "en-US";
  // On a phone the week is wider than the screen: it opens on today's column
  // (the name column stays pinned), not on Monday.
  const weekScroll = useRef(null);
  useEffect(() => {
    const box = weekScroll.current;
    const today = box && box.querySelector("[data-woche-today]");
    if (today) box.scrollLeft = Math.max(0, today.offsetLeft - PIN_W - PIN_GAP);
  }, [boardView, weekAnchor]);
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const pad = (n) => String(n).padStart(2, "0");
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const weekdays = [0, 1, 2, 3, 4, 5, 6].map((i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: "short" }).slice(0, 2),
  );
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const memberName = (uidKey) => {
    const m = team.members.find((x) => x.uid === uidKey);
    return m ? m.name || m.email || uidKey : uidKey;
  };

  const branchesFor = (pr) => {
    const list = entries.filter((e) => e.projectId === pr.id);
    const hours = list.filter((e) => e.type === "time").reduce((sum, e) => sum + (parseFloat(e.qty || 0) || 0), 0);
    return [
      {
        key: "time",
        label: t.typeTime,
        icon: Clock,
        count: `${hours.toFixed(1)} h`,
        items: list.filter((e) => e.type === "time"),
      },
      {
        key: "material",
        label: t.materials,
        icon: Package,
        count: list.filter((e) => e.type === "material").length,
        items: list.filter((e) => e.type === "material"),
      },
      {
        key: "tool",
        label: t.tools,
        icon: Wrench,
        count: list.filter((e) => e.type === "tool").length,
        items: list.filter((e) => e.type === "tool"),
      },
      {
        key: "photo",
        label: t.photoLabel,
        icon: Camera,
        count: list.filter((e) => e.type === "photo").length,
        items: list.filter((e) => e.type === "photo"),
      },
      {
        key: "regie",
        label: t.regieTitle,
        icon: Hammer,
        count: list.filter((e) => e.regie).length,
        items: list.filter((e) => e.regie),
      },
      {
        key: "rapport",
        label: t.rapportTitle,
        icon: ClipboardCheck,
        count: siteReports.filter((r) => r.projectId === pr.id).length,
        items: [],
      },
    ];
  };

  const finished = projects.filter((pr) => ["completed", "lost"].includes(pr.status || DEFAULT_PROJECT_STATUS));
  const live = showFinishedJobs
    ? projects
    : projects.filter((pr) => !["completed", "lost"].includes(pr.status || DEFAULT_PROJECT_STATUS));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {[
          ["week", t.boardWeek],
          ["month", t.boardMonth],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setBoardView(key)}
            style={{
              background: boardView === key ? COLORS.accent : COLORS.card,
              border: `1px solid ${boardView === key ? COLORS.accent : COLORS.border}`,
              color: boardView === key ? "#fff" : COLORS.muted,
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase"
          >
            {label}
          </button>
        ))}
      </div>

      {boardView === "week" &&
        (() => {
          const days = weekDays(weekAnchor);
          const dayName = (js) => js.toLocaleDateString(locale, { weekday: "short" });
          const pinned = { background: COLORS.card, boxShadow: `${PIN_GAP}px 0 0 ${COLORS.card}` };
          const crew = team.members;
          const assignable = showFinishedJobs
            ? projects
            : projects.filter((pr) => !["completed", "lost"].includes(pr.status || DEFAULT_PROJECT_STATUS));

          // Planning a week is a matter of putting people on jobs, so the
          // grid is people down the side and days across — the shape the
          // plan already has in someone's head.
          return (
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  aria-label={t.a11yBack}
                  title={t.a11yBack}
                  onClick={() => {
                    const d = new Date(weekAnchor);
                    d.setDate(d.getDate() - 7);
                    setWeekAnchor(d);
                  }}
                  style={{ background: COLORS.cardAlt }}
                  className="tap w-8 h-8 rounded-lg flex items-center justify-center"
                >
                  <ChevronLeft size={16} color={COLORS.muted} />
                </button>
                <div className="font-bold text-sm">
                  {days[0].js.toLocaleDateString(locale, { day: "numeric", month: "short" })} –{" "}
                  {days[6].js.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWeekAnchor(new Date())}
                    style={{ background: COLORS.cardAlt, color: COLORS.muted }}
                    className="px-2.5 h-8 rounded-lg text-xs font-bold uppercase"
                  >
                    {t.navToday}
                  </button>
                  <button
                    aria-label={t.a11yOpen}
                    title={t.a11yOpen}
                    onClick={() => {
                      const d = new Date(weekAnchor);
                      d.setDate(d.getDate() + 7);
                      setWeekAnchor(d);
                    }}
                    style={{ background: COLORS.cardAlt }}
                    className="tap w-8 h-8 rounded-lg flex items-center justify-center"
                  >
                    <ChevronRight size={16} color={COLORS.muted} />
                  </button>
                </div>
              </div>

              {/* Drag needs a pointer that hovers; on touch the hint sends
              people to the Kalender and the drag strip stays out of the way. */}
              <div data-woche-hint style={{ color: COLORS.muted }} className="text-xs mb-2 [@media(hover:none)]:hidden">
                {t.plannerHint}
              </div>
              <div
                data-woche-hint-touch
                style={{ color: COLORS.muted }}
                className="text-xs mb-2 hidden [@media(hover:none)]:block"
              >
                {t.plannerHintTouch}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4 [@media(hover:none)]:hidden">
                {assignable.map((pr) => (
                  <div
                    key={pr.id}
                    draggable
                    onDragStart={() => setDragProject({ projectId: pr.id })}
                    onDragEnd={() => setDragProject(null)}
                    style={{
                      background: `${projectColour(pr.id)}22`,
                      borderLeft: `3px solid ${projectColour(pr.id)}`,
                      color: COLORS.text,
                    }}
                    className="px-2.5 py-1.5 rounded text-xs font-semibold cursor-grab active:cursor-grabbing select-none"
                  >
                    {pr.name}
                  </div>
                ))}
                {assignable.length === 0 && (
                  <div style={{ color: COLORS.muted }} className="text-xs">
                    {t.noProjectsYet}
                  </div>
                )}
              </div>

              <div ref={weekScroll} data-woche className="overflow-x-auto relative">
                <div style={{ minWidth: "760px" }}>
                  <div className="grid gap-1.5" style={{ gridTemplateColumns: `${PIN_W}px repeat(7, 1fr)` }}>
                    <div style={pinned} className="sticky left-0 z-10" />
                    {days.map((d) => (
                      <div
                        key={d.date}
                        data-woche-today={d.date === todayKey() ? "" : undefined}
                        style={{ color: d.date === todayKey() ? COLORS.accentText : COLORS.muted }}
                        className="text-center text-xs font-bold uppercase pb-1"
                      >
                        {dayName(d.js)} {d.dayOfMonth}
                      </div>
                    ))}

                    {crew.length === 0 && (
                      <div style={{ color: COLORS.muted }} className="text-xs col-span-8">
                        {t.schedNoTeam}
                      </div>
                    )}

                    {crew.map((m) => (
                      <Fragment key={m.uid}>
                        <div
                          style={{ ...pinned, background: COLORS.cardAlt }}
                          className="sticky left-0 z-10 rounded-lg px-2.5 py-2 text-xs font-semibold truncate flex items-center"
                        >
                          {m.name || m.email || m.uid}
                        </div>
                        {days.map((d) => {
                          const mineHere = assignments.filter((x) => x.date === d.date && x.userId === m.uid);
                          const away = leaveRequests.find((r) => r.date === d.date && r.userId === m.uid);
                          const first = mineHere.length ? projectColour(mineHere[0].projectId) : null;
                          return (
                            <div
                              key={d.date}
                              onDragOver={(e) => {
                                if (dragProject) e.preventDefault();
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (dragProject && !mineHere.some((x) => x.projectId === dragProject.projectId))
                                  toggleAssignment(d.date, m.uid, dragProject.projectId);
                                setDragProject(null);
                              }}
                              title={away ? t.plannerAway : ""}
                              style={{
                                background: mineHere.length
                                  ? `${first}12`
                                  : away
                                    ? `${COLORS.amber}14`
                                    : COLORS.cardAlt,
                                border: `1px solid ${mineHere.length ? `${first}55` : away ? `${COLORS.amber}55` : COLORS.border}`,
                                opacity: away && !mineHere.length ? 0.85 : 1,
                              }}
                              className="min-h-[46px] rounded-lg p-1 text-xs leading-tight flex flex-col gap-1 justify-center transition"
                            >
                              {mineHere.map((a) => {
                                const pr = projects.find((x) => x.id === a.projectId);
                                const col = projectColour(a.projectId);
                                return (
                                  <button
                                    key={a.id}
                                    onClick={() => toggleAssignment(d.date, m.uid, a.projectId)}
                                    title={t.plannerChipRemove}
                                    style={{ background: `${col}26`, border: `1px solid ${col}`, color: col }}
                                    className="w-full rounded px-1.5 py-1 truncate text-center hover:brightness-125"
                                  >
                                    {pr ? pr.name : "—"}
                                  </button>
                                );
                              })}
                              {!mineHere.length && away ? (
                                <span style={{ color: COLORS.amber }} className="truncate w-full">
                                  {t[
                                    `leave${(away.type || "other").charAt(0).toUpperCase()}${(away.type || "other").slice(1)}`
                                  ] || t.leaveOther}
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {boardView === "month" && (
        <>
          {/* The month, with each day carrying the colour of whatever is
          planned on it — you read the shape of the week before you read
          any words. */}
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                aria-label={t.a11yBack}
                title={t.a11yBack}
                onClick={() => setCalMonth(new Date(year, month - 1, 1))}
                style={{ background: COLORS.cardAlt }}
                className="tap w-8 h-8 rounded-lg flex items-center justify-center"
              >
                <ChevronLeft size={16} color={COLORS.muted} />
              </button>
              <div className="font-bold capitalize">
                {calMonth.toLocaleDateString(locale, { month: "long", year: "numeric" })}
              </div>
              <button
                aria-label={t.a11yOpen}
                title={t.a11yOpen}
                onClick={() => setCalMonth(new Date(year, month + 1, 1))}
                style={{ background: COLORS.cardAlt }}
                className="tap w-8 h-8 rounded-lg flex items-center justify-center"
              >
                <ChevronRight size={16} color={COLORS.muted} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {weekdays.map((w, i) => (
                <div key={i} style={{ color: COLORS.muted }} className="text-center text-xs font-bold uppercase">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((d, i) => {
                if (d === null) return <div key={i} />;
                const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
                const dayPlan = assignments.filter((a) => a.date === dateStr);
                const dayLeave = leaveRequests.filter((r) => r.date === dateStr);
                const dayNotes = entries.filter((e) => e.type === "note" && e.date === dateStr);
                const isToday = dateStr === todayKey();
                return (
                  <button
                    key={i}
                    onClick={() => setAssignModal({ date: dateStr })}
                    style={{
                      background: COLORS.cardAlt,
                      border: `1px solid ${isToday ? COLORS.accent : COLORS.border}`,
                    }}
                    className="min-h-[56px] sm:min-h-[92px] rounded-lg p-1.5 text-left flex flex-col gap-1 overflow-hidden hover:brightness-125 transition"
                  >
                    <div style={{ color: isToday ? COLORS.accentText : COLORS.muted }} className="text-xs font-bold">
                      {d}
                    </div>
                    {/* A phone's cell is 24 px of text: one dot per assignment
                        (the job's colour), amber for leave, muted for a note. */}
                    {(dayPlan.length > 0 || dayLeave.length > 0 || dayNotes.length > 0) && (
                      <div data-board-dots aria-hidden="true" className="flex flex-wrap gap-0.5 sm:hidden">
                        {dayPlan.map((a) => (
                          <span
                            key={a.id}
                            style={{ background: projectColour(a.projectId) }}
                            className="w-2 h-2 rounded-full"
                          />
                        ))}
                        {dayLeave.map((r) => (
                          <span key={r.id} style={{ background: COLORS.amber }} className="w-2 h-2 rounded-full" />
                        ))}
                        {dayNotes.length > 0 && (
                          <span style={{ background: COLORS.muted }} className="w-2 h-2 rounded-full" />
                        )}
                      </div>
                    )}
                    {dayPlan.slice(0, 3).map((a) => {
                      const pr = projects.find((x) => x.id === a.projectId);
                      const col = projectColour(a.projectId);
                      return (
                        <div
                          key={a.id}
                          style={{ background: `${col}2A`, borderLeft: `3px solid ${col}`, color: COLORS.text }}
                          className="hidden sm:block text-xs leading-tight px-1 py-0.5 rounded-sm truncate"
                        >
                          {memberName(a.userId).split(" ")[0]} · {pr ? pr.name : "—"}
                        </div>
                      );
                    })}
                    {dayPlan.length > 3 && (
                      <div style={{ color: COLORS.muted }} className="hidden sm:block text-xs">
                        +{dayPlan.length - 3}
                      </div>
                    )}
                    {dayLeave.map((r) => (
                      <div
                        key={r.id}
                        style={{ background: `${COLORS.amber}22`, color: COLORS.amber }}
                        className="hidden sm:block text-xs px-1 py-0.5 rounded-sm truncate"
                      >
                        {memberName(r.userId).split(" ")[0]} ·{" "}
                        {t[`leave${(r.type || "other").charAt(0).toUpperCase()}${(r.type || "other").slice(1)}`] ||
                          t.leaveOther}
                      </div>
                    ))}
                    {dayNotes.slice(0, 1).map((n) => (
                      <div
                        key={n.id}
                        style={{ color: COLORS.muted }}
                        className="hidden sm:block text-xs italic truncate"
                      >
                        {n.description}
                      </div>
                    ))}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* The tree. Each job is a trunk; hovering opens its branches so
          you can see where the hours and material went without leaving
          the screen. */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">
            {t.boardTree} ({live.length})
          </div>
          {finished.length > 0 && (
            <button
              onClick={() => setShowFinishedJobs((v) => !v)}
              style={{ color: COLORS.accentText }}
              className="tap text-xs font-bold uppercase"
            >
              {showFinishedJobs ? t.boardHideFinished : `${t.boardShowFinished} (${finished.length})`}
            </button>
          )}
        </div>
        {live.length === 0 ? (
          <div style={{ color: COLORS.muted }} className="text-sm">
            {t.noProjectsYet}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {live.map((pr) => {
              const col = projectColour(pr.id);
              const sm = statusMeta(pr.status || DEFAULT_PROJECT_STATUS);
              const cust = customers.find((c) => c.id === pr.customerId);
              const open = openBranch && openBranch.projectId === pr.id;
              const branches = branchesFor(pr);
              return (
                <div
                  key={pr.id}
                  onMouseEnter={() => setOpenBranch((b) => (b && b.pinned ? b : { projectId: pr.id }))}
                  onMouseLeave={() => setOpenBranch((b) => (b && b.pinned ? b : null))}
                  style={{ borderLeft: `3px solid ${col}`, background: COLORS.cardAlt }}
                  className="rounded-lg"
                >
                  <button
                    onClick={() =>
                      setOpenBranch((b) =>
                        b && b.projectId === pr.id && b.pinned ? null : { projectId: pr.id, pinned: true },
                      )
                    }
                    className="w-full px-3 py-2.5 flex items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="font-semibold truncate">{pr.name}</span>
                      <span
                        style={{ background: `${sm.color}22`, color: sm.color, border: `1px solid ${sm.color}66` }}
                        className="shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full"
                      >
                        {t[sm.labelKey]}
                      </span>
                      {cust && (
                        <span style={{ color: COLORS.muted }} className="text-xs truncate hidden xl:inline">
                          {cust.name}
                        </span>
                      )}
                    </div>
                    <ChevronRight
                      size={15}
                      color={COLORS.muted}
                      style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}
                    />
                  </button>

                  {open && (
                    <div style={{ borderTop: `1px solid ${COLORS.border}` }} className="px-3 py-3">
                      <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                        {branches.map((br) => {
                          const BIcon = br.icon;
                          const active = openBranch.branch === br.key;
                          return (
                            <button
                              key={br.key}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenBranch((b) => ({ ...b, pinned: true, branch: active ? null : br.key }));
                              }}
                              style={{
                                background: active ? `${col}22` : COLORS.card,
                                border: `1px solid ${active ? col : COLORS.border}`,
                              }}
                              className="px-3 py-2 rounded-lg flex items-center justify-between gap-2"
                            >
                              <span className="flex items-center gap-1.5 text-xs font-semibold min-w-0">
                                <BIcon size={13} color={col} /> <span className="truncate">{br.label}</span>
                              </span>
                              <span style={{ color: COLORS.muted }} className="text-xs shrink-0">
                                {br.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {openBranch.branch &&
                        (() => {
                          const br = branches.find((x) => x.key === openBranch.branch);
                          if (!br) return null;
                          if (br.key === "rapport") {
                            const rs = siteReports.filter((r) => r.projectId === pr.id);
                            return (
                              <div className="mt-3 flex flex-col gap-1">
                                {rs.length === 0 && (
                                  <div style={{ color: COLORS.muted }} className="text-xs">
                                    {t.noContactsYet}
                                  </div>
                                )}
                                {rs.map((r) => (
                                  <button
                                    key={r.id}
                                    onClick={() => printRapport(r)}
                                    style={{ background: COLORS.card }}
                                    className="rounded px-2 py-1.5 text-xs flex justify-between gap-2"
                                  >
                                    <span className="truncate">
                                      {r.date} · {r.signerName}
                                    </span>
                                    <span style={{ color: COLORS.muted }} className="shrink-0">
                                      {r.hours} h
                                    </span>
                                  </button>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <div className="mt-3 flex flex-col gap-1 max-h-56 overflow-y-auto">
                              {br.items.length === 0 && (
                                <div style={{ color: COLORS.muted }} className="text-xs">
                                  {t.nothingLogged}
                                </div>
                              )}
                              {br.items.map((e) => (
                                <div
                                  key={e.id}
                                  style={{ background: COLORS.card }}
                                  className="rounded px-2 py-1.5 text-xs flex justify-between gap-2"
                                >
                                  <span className="truncate flex items-center gap-1.5">
                                    {e.regie && (
                                      <span style={{ color: COLORS.amber }} className="font-bold">
                                        {t.regieShort}
                                      </span>
                                    )}
                                    {e.description}
                                  </span>
                                  <span style={{ color: COLORS.muted }} className="shrink-0">
                                    {e.date}
                                    {e.qty ? ` · ${e.qty}${e.unit ? " " + e.unit : ""}` : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                      <button
                        onClick={() => {
                          setTab("projects");
                          setSelectedProject(pr.id);
                        }}
                        style={{ color: col }}
                        className="mt-3 text-xs font-bold uppercase"
                      >
                        {t.boardOpenProject}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
