// The Today tab: the day first (date, site, clock, breaks and the one action
// that matters now), then the weather, the note box and the day's entries.
// State lives in the app; this only renders.
import { CalendarDays, Check, Clock, MapPin, MessageSquare, Mic, RefreshCw, Send, Square } from "lucide-react";
import { COLORS } from "../ui/theme.js";
import { fmtDate, fmtHM, todayKey } from "../ui/format.js";
import { EntryGroups } from "../ui/entries.jsx";
import { BreakChips } from "../ui/break-chips.jsx";
import { EmptyState } from "../ui/empty-state.jsx";

export function TodayTab({
  topCard,
  t,
  lang,
  projects,
  entries,
  user,
  activeClock,
  todayEntries,
  myAssignments,
  projectName,
  setTab,
  setSelectedProject,
  weather,
  weatherLoc,
  wCond,
  weatherEditOpen,
  setWeatherEditOpen,
  weatherCityInput,
  setWeatherCityInput,
  submitWeatherCity,
  fetchWeather,
  toggleBreak,
  clockOut,
  noteText,
  setNoteText,
  submitNote,
  toggleVoiceInput,
  voiceListening,
  voiceTarget,
  openEditTime,
  openEditEntry,
  deleteEntryFn,
}) {
  const today = todayKey();
  // What am I meant to be doing today? The first thing a crew member opens
  // the app to find out. The day starts inside the job the Polier assigned.
  const mine = myAssignments(today);
  const firstJob = mine.map((a) => projects.find((x) => x.id === a.projectId)).find(Boolean);
  const openJob = (id) => {
    setTab("projects");
    setSelectedProject(id);
  };
  // The first action is the biggest control on the screen: a glove hits it.
  const bigAction = "w-full py-4 rounded-xl font-bold uppercase text-base flex items-center justify-center gap-2";
  return (
    <div className="flex flex-col gap-4">
      {/* The day card: one glance for the date, the site, the clock and the
          breaks, with the first action under it. */}
      <div
        data-day-card
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
        className="rounded-xl p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">
            {t.navToday}
          </div>
          <div data-today-count style={{ color: COLORS.muted }} className="text-xs tabular-nums">
            {todayEntries.length} {t.entriesLabelFmt}
          </div>
        </div>
        <div data-today-date className="text-2xl font-black mt-0.5 mb-3">
          {fmtDate(today, lang)}
        </div>
        {activeClock ? (
          <>
            <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1">
              {t.workingAt}
            </div>
            <div data-today-site className="font-bold text-lg">
              {projectName(activeClock.projectId)}
            </div>
            <div style={{ color: COLORS.accentText }} className="text-3xl font-black tabular-nums">
              {fmtHM(Date.now() - activeClock.startedAt)}
            </div>
            <BreakChips entries={entries} userId={user?.uid} onToggle={toggleBreak} t={t} />
            <button
              data-day-action
              onClick={clockOut}
              style={{ background: COLORS.accent }}
              className={`${bigAction} mt-4`}
            >
              <Square size={18} /> {t.clockOut}
            </button>
          </>
        ) : (
          <>
            {mine.length > 0 ? (
              <>
                <div
                  style={{ color: "#6FB3D9" }}
                  className="text-xs uppercase tracking-wide mb-1.5 font-bold flex items-center gap-1.5"
                >
                  <CalendarDays size={13} /> {t.schedToday}
                </div>
                <div data-today-site className="flex flex-col gap-1.5 mb-3">
                  {mine.map((a) => {
                    const pr = projects.find((x) => x.id === a.projectId);
                    if (!pr) return null;
                    return (
                      <button
                        key={a.id}
                        onClick={() => openJob(pr.id)}
                        style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}
                        className="w-full text-left rounded-lg px-3 py-2"
                      >
                        <div className="text-sm font-semibold">{pr.name}</div>
                        {pr.address && (
                          <div style={{ color: COLORS.muted }} className="text-xs truncate">
                            {pr.address}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1">
                  {t.startYourDay}
                </div>
                <div style={{ color: COLORS.muted }} className="text-sm leading-relaxed mb-3">
                  {t.startDayHint}
                </div>
              </>
            )}
            <button
              data-day-action
              onClick={() => (firstJob ? openJob(firstJob.id) : setTab("projects"))}
              style={{ background: COLORS.accent }}
              className={bigAction}
            >
              <MapPin size={18} /> {firstJob ? t.dayOpenSite : t.dayChooseSite}
            </button>
            <BreakChips entries={entries} userId={user?.uid} onToggle={toggleBreak} t={t} />
          </>
        )}
      </div>
      {topCard}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">
            {t.weatherTitle} · {weatherLoc.name}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setWeatherEditOpen((o) => !o);
                setWeatherCityInput("");
              }}
              className="tap text-xs font-bold uppercase"
              style={{ color: COLORS.accentText }}
            >
              {t.changeLocation}
            </button>
            <button
              className="tap"
              aria-label={t.a11yReload}
              title={t.a11yReload}
              onClick={() => fetchWeather(weatherLoc)}
            >
              <RefreshCw size={14} color={COLORS.muted} />
            </button>
          </div>
        </div>
        {weatherEditOpen && (
          <div className="flex gap-2 my-2">
            <input
              aria-label={t.cityPlaceholder}
              value={weatherCityInput}
              onChange={(e) => setWeatherCityInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitWeatherCity()}
              placeholder={t.cityPlaceholder}
              style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
            />
            <button
              aria-label={t.a11yConfirm}
              title={t.a11yConfirm}
              onClick={submitWeatherCity}
              style={{ background: COLORS.accent }}
              className="tap rounded-lg px-3 flex items-center justify-center"
            >
              <Check size={16} />
            </button>
          </div>
        )}
        {weather.loading && (
          <div style={{ color: COLORS.muted }} className="text-sm">
            {t.weatherLoading}
          </div>
        )}
        {weather.error && (
          <div style={{ color: COLORS.dangerText }} className="text-xs">
            {weather.error}
          </div>
        )}
        {weather.data && wCond && (
          <>
            <div className="flex items-center gap-2 mt-1">
              <wCond.Icon size={26} color={COLORS.accent} />
              <div className="text-2xl font-black">{Math.round(weather.data.temperature_2m)}°C</div>
              <div style={{ color: COLORS.muted }} className="text-sm">
                {wCond.label}
              </div>
            </div>
            <div style={{ color: COLORS.muted }} className="text-xs mt-1">
              {t.windLabel}: {Math.round(weather.data.wind_speed_10m)} km/h
            </div>
          </>
        )}
        <div style={{ color: COLORS.muted }} className="text-xs mt-2">
          {t.weatherSource}
        </div>
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4">
        <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2 flex items-center gap-1">
          <MessageSquare size={13} /> {t.tellLog}
        </div>
        <div className="flex gap-2">
          <input
            aria-label={t.tellLogPlaceholder}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitNote()}
            placeholder={t.tellLogPlaceholder}
            style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
          />
          <button
            aria-label={t.a11yVoice}
            title={t.a11yVoice}
            onClick={() => toggleVoiceInput()}
            style={{
              background: voiceListening && voiceTarget === "today" ? COLORS.danger : COLORS.cardAlt,
              border: `1px solid ${COLORS.border}`,
            }}
            className="tap rounded-lg px-3 flex items-center justify-center"
          >
            <Mic size={16} color={voiceListening && voiceTarget === "today" ? "#fff" : COLORS.muted} />
          </button>
          <button
            aria-label={t.a11ySend}
            title={t.a11ySend}
            onClick={submitNote}
            style={{ background: COLORS.accent }}
            className="tap rounded-lg px-3 flex items-center justify-center"
          >
            <Send size={16} />
          </button>
        </div>
        <div style={{ color: COLORS.muted }} className="text-xs mt-2">
          {t.autoSortHint}
        </div>
      </div>

      {/* The roof inspection starts from the job now (see the job view). */}

      <div>
        <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-2 mt-2">
          {t.todaysTickets}
        </div>
        {todayEntries.length === 0 ? (
          <EmptyState name="today" icon={Clock} title={t.nothingLogged} hint={t.emptyTodayHint} compact />
        ) : (
          <EntryGroups
            entries={todayEntries}
            projectName={projectName}
            t={t}
            onEditTime={openEditTime}
            onEditEntry={openEditEntry}
            onDelete={deleteEntryFn}
          />
        )}
      </div>
    </div>
  );
}
