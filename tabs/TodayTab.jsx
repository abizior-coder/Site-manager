// The Today tab: what am I doing today, the weather, the clock, the note
// box and the day's entries. State lives in the app; this only renders.
import { CalendarDays, Check, MessageSquare, Mic, RefreshCw, Send, Square } from "lucide-react";
import { COLORS } from "../ui/theme.js";
import { fmtHM, todayKey } from "../ui/format.js";
import { EntryGroups } from "../ui/entries.jsx";
import { BreakChips } from "../ui/break-chips.jsx";

export function TodayTab({
  topCard,
  t,
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
  return (
    <div className="flex flex-col gap-4">
      {topCard}
      {(() => {
        // What am I meant to be doing today? The first thing a crew
        // member opens the app to find out.
        const mine = myAssignments(todayKey());
        if (mine.length === 0) return null;
        return (
          <div style={{ background: "#6FB3D914", border: "1px solid #6FB3D955" }} className="rounded-xl p-4">
            <div
              style={{ color: "#6FB3D9" }}
              className="text-xs uppercase tracking-wide mb-2 font-bold flex items-center gap-1.5"
            >
              <CalendarDays size={13} /> {t.schedToday}
            </div>
            <div className="flex flex-col gap-1.5">
              {mine.map((a) => {
                const pr = projects.find((x) => x.id === a.projectId);
                if (!pr) return null;
                return (
                  <button
                    key={a.id}
                    onClick={() => {
                      setTab("projects");
                      setSelectedProject(pr.id);
                    }}
                    style={{ background: COLORS.card }}
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
          </div>
        );
      })()}
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
              className="text-xs font-bold uppercase"
              style={{ color: COLORS.accent }}
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
          <div style={{ color: COLORS.danger }} className="text-xs">
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
        {activeClock ? (
          <>
            <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1">
              {t.workingAt}
            </div>
            <BreakChips entries={entries} userId={user?.uid} onToggle={toggleBreak} t={t} />
            <div className="font-bold text-lg mb-3">{projectName(activeClock.projectId)}</div>
            <div style={{ color: COLORS.accent }} className="text-3xl font-black mb-4 tabular-nums">
              {fmtHM(Date.now() - activeClock.startedAt)}
            </div>
            <button
              onClick={clockOut}
              style={{ background: COLORS.accent }}
              className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2"
            >
              <Square size={16} /> {t.clockOut}
            </button>
          </>
        ) : (
          <>
            {/* The list of every job to clock into is gone. The day
                  starts inside the job the Polier assigned -- tap it under
                  "Heutiger Einsatz" above, or open it under Projekte. */}
            <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide mb-1">
              {t.startYourDay}
            </div>
            <div style={{ color: COLORS.muted }} className="text-sm leading-relaxed">
              {t.startDayHint}
            </div>
            <BreakChips entries={entries} userId={user?.uid} onToggle={toggleBreak} t={t} />
          </>
        )}
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
        <EntryGroups
          entries={todayEntries}
          projectName={projectName}
          t={t}
          emptyLabel={t.nothingLogged}
          onEditTime={openEditTime}
          onEditEntry={openEditEntry}
          onDelete={deleteEntryFn}
        />
      </div>
    </div>
  );
}
