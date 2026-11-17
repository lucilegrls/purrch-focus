import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { App as NativeApp } from "@capacitor/app";
import {
  Armchair,
  ArrowRight,
  Check,
  ChevronRight,
  Coffee,
  Download,
  Fish,
  Gift,
  Headphones,
  Heart,
  Home,
  Leaf,
  ListTodo,
  LockKeyhole,
  Moon,
  Palette,
  Pause,
  Play,
  Plus,
  Settings2,
  ShieldCheck,
  Sprout,
  Star,
  Sun,
  Timer as TimerIcon,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import Room from "./Room";
import {
  buy,
  clockText,
  dateKey,
  elapsed,
  finish,
  parseState,
  pause,
  remaining,
  sell,
  shop,
  start,
  tick,
  toggleDecor,
  uid,
} from "./model";
import type { Mode, Session, State } from "./model";
import {
  downloadBackup,
  enableNotifications,
  exactAlarms,
  FocusGuard,
  load,
  native,
  save,
  syncGuard,
  syncNotification,
} from "./platform";
import { playAudio, setVolume, stopAudio } from "./audio";
import "./App.css";
import "./mobile.css";
import "./reading-theme.css";
import { exportableSvg } from "./wallpaper";

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
const giftIcons = { flower: "🌼", shell: "🐚", star: "⭐", paper: "📃" };
const giftNames = {
  flower: "Pocket sunshine",
  shell: "A seaside treasure",
  star: "A little lucky star",
  paper: "Crumpled plans",
};
function ItemIcon({ id }: { id: string }) {
  return id === "plant" ? (
    <Sprout />
  ) : id === "rug" ? (
    <span className="rug-icon">▱</span>
  ) : id === "books" ? (
    <span className="book-icon">▤</span>
  ) : id === "lamp" ? (
    <Sun />
  ) : (
    <Moon />
  );
}

export default function App() {
  const [state, setState] = useState<State | null>(null);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState("focus");
  const [modal, setModal] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [mode, setMode] = useState<Mode>("focus");
  const [task, setTask] = useState("");
  const [newTask, setNewTask] = useState("");
  const [due, setDue] = useState("");
  const [toast, setToast] = useState("");
  const [failure, setFailure] = useState("");
  const [guard, setGuard] = useState(false);
  const [outcome, setOutcome] = useState<Session | null>(null);
  const [audioOn, setAudioOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const queue = useRef(Promise.resolve());
  const previousSession = useRef<string | undefined>(undefined);
  const importRef = useRef<HTMLInputElement>(null);
  const ready = useRef(false);
  const update = (fn: (s: State) => State) => setState((s) => (s ? fn(s) : s));
  const notify = (message: string) => setToast(message);
  useEffect(() => {
    void load()
      .then((s) => {
        previousSession.current = s.sessions[0]?.id ?? "";
        ready.current = true;
        setState(tick(s, Date.now()));
      })
      .catch(() =>
        setLoadError(
          "Your saved progress could not be loaded. It has been left untouched. Please reload the app.",
        ),
      );
  }, []);
  useEffect(() => {
    const handle = setInterval(() => {
      setNow(Date.now());
      update((s) => tick(s, Date.now()));
    }, 500);
    return () => clearInterval(handle);
  }, []);
  useEffect(() => {
    if (!state || !ready.current) return;
    const snapshot = state;
    queue.current = queue.current
      .then(async () => {
        await save(snapshot);
        await syncGuard(snapshot);
        setFailure("");
        try {
          await syncNotification(snapshot);
        } catch {
          setToast(
            "Session reminders could not be scheduled. Check notification and alarm permissions in Settings.",
          );
        }
      })
      .catch(() =>
        setFailure(
          "Progress or Android protection could not be updated. Keep Purrch open and try again. Export a backup before closing.",
        ),
      );
    if (
      previousSession.current !== state.sessions[0]?.id &&
      state.sessions[0]
    ) {
      setOutcome(state.sessions[0]);
      setModal("outcome");
      previousSession.current = state.sessions[0].id;
    }
  }, [state]);
  useEffect(() => {
    if (!toast) return;
    const handle = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(handle);
  }, [toast]);
  useEffect(() => {
    const refresh = () => {
      if (native)
        void FocusGuard.status()
          .then((x) => setGuard(x.enabled))
          .catch(() => setGuard(false));
      setNow(Date.now());
      update((s) => tick(s, Date.now()));
    };
    refresh();
    document.addEventListener("visibilitychange", refresh);
    const sub = native
      ? NativeApp.addListener("appStateChange", refresh)
      : null;
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      void sub?.then((x) => x.remove());
      stopAudio();
    };
  }, []);
  if (loadError)
    return (
      <div className="loading">
        <Heart />
        <h1>Let’s keep your progress safe.</h1>
        <p>{loadError}</p>
        <button className="primary" onClick={() => location.reload()}>
          Reload Purrch
        </button>
      </div>
    );
  if (!state)
    return (
      <div className="loading">
        <Armchair size={42} />
        <h1>Making room for you…</h1>
      </div>
    );
  const s = state,
    timer = s.timer,
    active = !!timer,
    currentMode = timer?.mode ?? mode;
  const total = s.sessions.filter((x) => x.completed && x.mode !== "break");
  const today = total.filter((x) => dateKey(x.endedAt) === dateKey(now));
  const todayMinutes = Math.floor(
    today.reduce((a, x) => a + x.seconds, 0) / 60,
  );
  const display = timer
    ? timer.mode === "countup"
      ? elapsed(timer, now)
      : remaining(timer, now)
    : (mode === "countup"
        ? 0
        : mode === "break"
          ? total.length > 0 && total.length % s.settings.cycles === 0
            ? s.settings.longBreakMinutes
            : s.settings.breakMinutes
          : s.settings.focusMinutes) * 60000;
  const progress =
    timer && timer.mode !== "countup"
      ? Math.min(100, (elapsed(timer, now) / timer.durationMs) * 100)
      : 0;
  const begin = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (native && s.settings.blocking && mode !== "break") {
        const status = await FocusGuard.status();
        setGuard(status.enabled);
        if (!status.enabled) {
          setModal("blocking");
          return;
        }
      }
      update((x) => start(x, mode, Date.now(), task));
    } catch {
      notify(
        "Android protection is unavailable. Please check its permission in Settings.",
      );
    } finally {
      setBusy(false);
    }
  };
  const audio = async () => {
    if (audioOn) {
      stopAudio();
      setAudioOn(false);
      return;
    }
    try {
      await playAudio(
        s.settings.sound === "off" ? "rain" : s.settings.sound,
        s.settings.volume,
      );
      setAudioOn(true);
    } catch {
      notify("Sound could not start. Tap again to try.");
    }
  };
  const backup = async () => {
    try {
      await downloadBackup(s);
      notify("Backup ready. Keep it somewhere safe.");
    } catch {
      notify("Could not export your backup. Please try again.");
    }
  };
  const setSettings = (patch: Partial<State["settings"]>) =>
    update((x) => ({ ...x, settings: { ...x.settings, ...patch } }));
  const title = {
    focus: "A little focus. A little purr.",
    room: "Make yourself at home.",
    journal: "Little moments add up.",
    tasks: "One thing at a time.",
  }[page];
  const subtitle = {
    focus: "A quiet corner for you and your favorite coworker.",
    room: "A room that feels a little more like you.",
    journal: "Every small stretch of attention is something to celebrate.",
    tasks: "Make a little space for what matters today.",
  }[page];
  const dayBars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 6 + i);
    const minutes = Math.floor(
      total
        .filter((x) => dateKey(x.endedAt) === dateKey(d.getTime()))
        .reduce((a, x) => a + x.seconds, 0) / 60,
    );
    return {
      label: d.toLocaleDateString("en", { weekday: "short" }),
      minutes,
      key: dateKey(d.getTime()),
    };
  });
  const maxBar = Math.max(30, ...dayBars.map((x) => x.minutes));
  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("focus");
          }}
        >
          <span className="brand-icon">
            <Armchair size={25} />
          </span>
          <span>
            purrch<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="top-actions">
          <button
            className="fish-balance"
            onClick={() => setPage("room")}
            aria-label={`${s.fish} fish, open room shop`}
          >
            <Fish size={19} />
            <strong>{s.fish}</strong>
          </button>
          <button
            className="icon-button"
            onClick={() => setModal("settings")}
            aria-label="Settings"
          >
            <Settings2 size={21} />
          </button>
        </div>
      </header>
      <div className="workspace">
        <nav className="navigation" aria-label="Main navigation">
          {[
            { id: "focus", label: "Focus", Icon: Home },
            { id: "room", label: "My room", Icon: Armchair },
            { id: "journal", label: "Journal", Icon: TrendingUp },
            { id: "tasks", label: "Tasks", Icon: ListTodo },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              className={page === id ? "selected" : ""}
              aria-current={page === id ? "page" : undefined}
              onClick={() => setPage(id)}
            >
              <Icon size={21} />
              <span>{label}</span>
            </button>
          ))}
          <div className="nav-note">
            <Leaf size={26} />
            <p>
              Small steps.
              <br />
              Softer days.
            </p>
          </div>
        </nav>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span /> YOUR LITTLE CORNER OF CALM
              </div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            <span className="date-label">
              {new Date(now).toLocaleDateString("en", {
                month: "short",
                day: "numeric",
              })}
              <Sun size={17} />
            </span>
          </div>
          {failure && (
            <div className="error-banner" role="alert">
              {failure}
              <button onClick={backup}>Export backup</button>
            </div>
          )}
          {page === "focus" && (
            <>
              <div className="focus-layout">
                <section className="room-card">
                  <div className="room-top">
                    <span>
                      <span className="status-dot" />
                      {active
                        ? `${s.settings.catName} is keeping you company`
                        : `${s.settings.catName}’s sunny nook`}
                    </span>
                    <button
                      className="icon-button"
                      aria-label="Customize room"
                      onClick={() => setPage("room")}
                    >
                      <Palette size={18} />
                    </button>
                  </div>
                  <Room
                    settings={s.settings}
                    decor={s.decor}
                    focused={active}
                  />
                  <div className="room-bottom">
                    <span>
                      <Heart size={16} />
                      {active
                        ? "You do your thing. I’ll be right here."
                        : "Your company is the best part."}
                    </span>
                    <button
                      onClick={audio}
                      className={`sound-button ${audioOn ? "on" : ""}`}
                      aria-label={
                        audioOn
                          ? "Turn ambient sound off"
                          : "Play ambient sound"
                      }
                    >
                      <Headphones size={18} />
                      <span>{audioOn ? "Sound on" : "Sound off"}</span>
                    </button>
                  </div>
                </section>
                <section className="timer-card">
                  <div className="segmented" aria-label="Timer mode">
                    {(["focus", "countup", "break"] as Mode[]).map((m) => (
                      <button
                        key={m}
                        disabled={active}
                        aria-pressed={currentMode === m}
                        className={currentMode === m ? "selected" : ""}
                        onClick={() => setMode(m)}
                      >
                        {m === "countup"
                          ? "Count up"
                          : m === "focus"
                            ? "Focus"
                            : "Break"}
                      </button>
                    ))}
                  </div>
                  <div className="timer-caption">
                    {timer
                      ? timer.running
                        ? "MAKE A LITTLE SPACE"
                        : "TAKE A BREATH"
                      : mode === "break"
                        ? "A WELL-EARNED BREATHER"
                        : "ONE SMALL MOMENT AT A TIME"}
                  </div>
                  <div
                    className="timer-digits"
                    role="timer"
                    aria-label={`${clockText(display)} ${currentMode === "countup" ? "elapsed" : "remaining"}`}
                  >
                    {clockText(display)}
                  </div>
                  <p className="timer-message">
                    {timer
                      ? timer.running
                        ? currentMode === "break"
                          ? "Stretch your paws."
                          : "Just you, your task, and a sleepy cat."
                        : "Paused. Your cat is happy to wait."
                      : currentMode === "break"
                        ? "Rest is part of the rhythm."
                        : "Settle in. We’ll do this together."}
                  </p>
                  <div className="progress-track">
                    <div style={{ width: `${progress}%` }} />
                  </div>
                  {!active && mode === "focus" && (
                    <div className="duration-options">
                      {[15, 25, 45, 60].map((n) => (
                        <button
                          key={n}
                          className={
                            s.settings.focusMinutes === n ? "selected" : ""
                          }
                          onClick={() => setSettings({ focusMinutes: n })}
                        >
                          {n}
                          <span>m</span>
                        </button>
                      ))}
                      {![15, 25, 45, 60].includes(s.settings.focusMinutes) && (
                        <span className="custom-duration">
                          {s.settings.focusMinutes}m
                        </span>
                      )}
                    </div>
                  )}
                  <label className="task-select">
                    <ListTodo size={17} />
                    <select
                      aria-label="Task to focus on"
                      value={timer ? timer.task : task}
                      disabled={active}
                      onChange={(e) => setTask(e.target.value)}
                    >
                      <option value="">What would you like to work on?</option>
                      {s.tasks
                        .filter(
                          (x) => !x.done || x.text === (timer?.task ?? task),
                        )
                        .map((x) => (
                          <option key={x.id} value={x.text}>
                            {x.text}
                          </option>
                        ))}
                    </select>
                  </label>
                  {!timer ? (
                    <button
                      className="primary start-button"
                      onClick={begin}
                      disabled={busy}
                    >
                      <Play size={18} fill="currentColor" />
                      {mode === "break" ? "Take a break" : "Let’s focus"}
                      <ArrowRight size={19} />
                    </button>
                  ) : (
                    <div className="timer-actions">
                      <button
                        className="primary"
                        onClick={() => update((x) => pause(x, Date.now()))}
                      >
                        {timer.running ? (
                          <Pause size={18} />
                        ) : (
                          <Play size={18} />
                        )}{" "}
                        {timer.running ? "Pause" : "Continue"}
                      </button>
                      <button
                        className="secondary"
                        onClick={() =>
                          timer.mode === "countup" &&
                          elapsed(timer, now) >= 60000
                            ? update((x) => finish(x, Date.now(), true))
                            : setModal("end")
                        }
                      >
                        {timer.mode === "countup" ? "Finish" : "End"}
                      </button>
                    </div>
                  )}
                  <button
                    className="protection"
                    onClick={() => setModal("blocking")}
                  >
                    <ShieldCheck size={15} />
                    {native
                      ? s.settings.blocking
                        ? guard
                          ? "App protection ready"
                          : "Set up app protection"
                        : "App protection is off"
                      : "Android app includes app blocking"}
                    <ChevronRight size={14} />
                  </button>
                  <div className="session-dots">
                    {Array.from({ length: s.settings.cycles }, (_, i) => (
                      <span
                        key={i}
                        className={
                          i < total.length % s.settings.cycles ? "filled" : ""
                        }
                      />
                    ))}
                    <small>Long break every {s.settings.cycles} sessions</small>
                  </div>
                </section>
              </div>
              <div className="bottom-cards">
                <section className="today-card">
                  <div className="small-card-icon">
                    <Sun size={22} />
                  </div>
                  <div>
                    <span className="eyebrow">A LITTLE PROGRESS, TODAY</span>
                    <p>
                      <strong>{todayMinutes}</strong> minutes of you-time{" "}
                      <span className="separator">·</span> <b>{today.length}</b>{" "}
                      sessions
                    </p>
                  </div>
                  <button
                    aria-label="View focus journal"
                    className="icon-button"
                    onClick={() => setPage("journal")}
                  >
                    <ArrowRight size={20} />
                  </button>
                </section>
                <button className="gift-card" onClick={() => setModal("gifts")}>
                  <span className="gift-illustration">
                    <Gift size={30} />
                  </span>
                  <span>
                    <strong>
                      {s.gifts.length
                        ? `${s.gifts.length} little ${s.gifts.length === 1 ? "treasure" : "treasures"} waiting`
                        : "Good things take a little focus"}
                    </strong>
                    <small>
                      {s.gifts.length
                        ? "See what your cat brought you"
                        : "Finish a session. Find a little surprise."}
                    </small>
                  </span>
                  <ChevronRight size={20} />
                </button>
              </div>
              <p className="quiet-note">
                <Sprout size={14} /> You don’t have to do it all. Just the next
                little thing.
              </p>
            </>
          )}
          {page === "room" && (
            <div className="room-layout">
              <section className="custom-room">
                <Room settings={s.settings} decor={s.decor} />
                <div className="custom-controls">
                  <h2>Your kind of cozy</h2>
                  <label className="field-label">
                    Room style
                    <select
                      value={s.settings.roomStyle}
                      onChange={(e) =>
                        setSettings({
                          roomStyle: e.target
                            .value as State["settings"]["roomStyle"],
                        })
                      }
                    >
                      <option value="reading">Painted reading nook</option>
                      <option value="drawn">Simple drawn room</option>
                    </select>
                  </label>
                  <label className="field-label">
                    Your cat’s name
                    <input
                      maxLength={30}
                      value={s.settings.catName}
                      onChange={(e) => setSettings({ catName: e.target.value })}
                    />
                  </label>
                  <div className="color-controls">
                    {[
                      { key: "wall", label: "Room tint" },
                      { key: "chair", label: "Chair tint" },
                      { key: "fur", label: "Coat tint" },
                    ].map(({ key, label }) => (
                      <label key={key}>
                        <input
                          type="color"
                          aria-label={label}
                          value={s.settings[key as "wall" | "chair" | "fur"]}
                          onChange={(e) =>
                            setSettings({ [key]: e.target.value })
                          }
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="palette-presets">
                    <button
                      onClick={() =>
                        setSettings({
                          wall: "#eadbc5",
                          chair: "#d1b89b",
                          fur: "#b4a18a",
                        })
                      }
                    >
                      <span style={{ background: "#bd9469" }} />
                      Amber evening
                    </button>
                    <button
                      onClick={() =>
                        setSettings({
                          wall: "#b2b3c6",
                          chair: "#a3a4b4",
                          fur: "#9c9c9c",
                        })
                      }
                    >
                      <span style={{ background: "#9390b5" }} />
                      Quiet dusk
                    </button>
                    <button
                      onClick={() =>
                        setSettings({
                          wall: "#f1e7d4",
                          chair: "#e5ddc9",
                          fur: "#d2b392",
                        })
                      }
                    >
                      <span style={{ background: "#e2ceac" }} />
                      Soft daylight
                    </button>
                  </div>
                  <button
                    className="secondary full-width"
                    onClick={() => setModal("wallpaper")}
                  >
                    <Download size={17} /> Save your room
                  </button>
                </div>
              </section>
              <section className="shop-panel">
                <div className="section-title">
                  <h2>Little comforts</h2>
                  <span className="fish-balance">
                    <Fish size={17} />
                    {s.fish}
                  </span>
                </div>
                <p>Earn fish by focusing, or trade your cat’s gifts.</p>
                <div className="shop-grid">
                  {shop.map((item) => {
                    const owned = s.owned.includes(item.id),
                      equipped = s.decor.includes(item.id);
                    return (
                      <article className="shop-item" key={item.id}>
                        <div className={`shop-art ${item.id}`}>
                          <ItemIcon id={item.id} />
                        </div>
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <button
                          className={owned ? "secondary" : "primary"}
                          disabled={!owned && s.fish < item.price}
                          onClick={() =>
                            owned
                              ? update((x) => toggleDecor(x, item.id))
                              : update((x) => buy(x, item.id))
                          }
                        >
                          {owned ? (
                            equipped ? (
                              <>
                                <Check size={15} /> In your room
                              </>
                            ) : (
                              "Place in room"
                            )
                          ) : (
                            <>
                              <Fish size={15} />
                              {item.price} fish
                            </>
                          )}
                        </button>
                      </article>
                    );
                  })}
                </div>
                <button
                  className="gift-card full-width"
                  onClick={() => setModal("gifts")}
                >
                  <Gift />
                  <span>
                    <strong>Your little treasures</strong>
                    <small>{s.gifts.length} gifts to keep or trade</small>
                  </span>
                  <ChevronRight />
                </button>
              </section>
            </div>
          )}
          {page === "journal" && (
            <>
              <div className="stats-grid">
                <div>
                  <TimerIcon />
                  <strong>
                    {Math.floor(total.reduce((a, x) => a + x.seconds, 0) / 60)}
                  </strong>
                  <span>minutes of focus</span>
                </div>
                <div>
                  <Check />
                  <strong>{total.length}</strong>
                  <span>sessions completed</span>
                </div>
                <div>
                  <Star />
                  <strong>
                    {new Set(total.map((x) => dateKey(x.endedAt))).size}
                  </strong>
                  <span>days you showed up</span>
                </div>
              </div>
              <section className="journal-panel">
                <div className="section-title">
                  <h2>Your week, softly</h2>
                  <span>Minutes of focus</span>
                </div>
                <div className="bar-chart">
                  {dayBars.map((x) => (
                    <div key={x.key}>
                      <span>{x.minutes}</span>
                      <div className="bar-slot">
                        <div
                          style={{
                            height: `${Math.max(3, (x.minutes / maxBar) * 100)}%`,
                          }}
                        />
                      </div>
                      <small>{x.label}</small>
                    </div>
                  ))}
                </div>
              </section>
              <section className="journal-panel">
                <h2>Little chapters</h2>
                {!s.sessions.length ? (
                  <div className="empty-state">
                    <Leaf size={34} />
                    <h3>A fresh page.</h3>
                    <p>Your focus sessions will find a home here.</p>
                    <button
                      className="secondary"
                      onClick={() => setPage("focus")}
                    >
                      Start your first session
                    </button>
                  </div>
                ) : (
                  <div className="timeline">
                    {s.sessions.slice(0, 60).map((x) => (
                      <div key={x.id}>
                        <span
                          className={`timeline-icon ${x.completed ? "complete" : ""}`}
                        >
                          {x.mode === "break" ? (
                            <Coffee size={18} />
                          ) : x.completed ? (
                            <Check size={18} />
                          ) : (
                            <Leaf size={18} />
                          )}
                        </span>
                        <div>
                          <strong>
                            {x.task ||
                              (x.mode === "break"
                                ? "A moment to rest"
                                : "A little focused time")}
                          </strong>
                          <small>
                            {new Date(x.endedAt).toLocaleString("en", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            · {x.completed ? "Completed" : "Ended early"}
                          </small>
                        </div>
                        <span>{Math.floor(x.seconds / 60)}m</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
          {page === "tasks" && (
            <section className="tasks-panel">
              <form
                className="task-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTask.trim()) return;
                  update((x) => ({
                    ...x,
                    tasks: [
                      ...x.tasks,
                      {
                        id: uid(),
                        text: newTask.trim().slice(0, 200),
                        done: false,
                        due,
                      },
                    ],
                  }));
                  setNewTask("");
                  setDue("");
                }}
              >
                <label className="field-label">
                  What’s your next little thing?
                  <input
                    placeholder="Read a chapter, finish a draft…"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    maxLength={200}
                    required
                  />
                </label>
                <div className="task-form-bottom">
                  <label>
                    Due date{" "}
                    <input
                      aria-label="Task due date"
                      type="date"
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                    />
                  </label>
                  <button className="primary" type="submit">
                    <Plus size={17} /> Add task
                  </button>
                </div>
              </form>
              {!s.tasks.length ? (
                <div className="empty-state">
                  <ListTodo size={35} />
                  <h3>Room for a little intention.</h3>
                  <p>Add a task, then choose it when you start focusing.</p>
                </div>
              ) : (
                <div className="task-list">
                  {s.tasks.map((x) => (
                    <div key={x.id} className={x.done ? "done" : ""}>
                      <button
                        className="task-check"
                        aria-label={`${x.done ? "Reopen" : "Complete"} ${x.text}`}
                        onClick={() =>
                          update((a) => ({
                            ...a,
                            tasks: a.tasks.map((t) =>
                              t.id === x.id ? { ...t, done: !t.done } : t,
                            ),
                          }))
                        }
                      >
                        {x.done && <Check size={17} />}
                      </button>
                      <div>
                        <strong>{x.text}</strong>
                        {x.due && <small>Due {x.due}</small>}
                      </div>
                      {!x.done && (
                        <button
                          className="icon-button"
                          aria-label={`Focus on ${x.text}`}
                          onClick={() => {
                            setTask(x.text);
                            setPage("focus");
                          }}
                        >
                          <Play size={17} />
                        </button>
                      )}
                      <button
                        className="icon-button"
                        aria-label={`Delete ${x.text}`}
                        onClick={() =>
                          update((a) => ({
                            ...a,
                            tasks: a.tasks.filter((t) => t.id !== x.id),
                          }))
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          <footer>
            Made for slower, softer productivity. <Heart size={12} />
          </footer>
        </main>
      </div>
      {modal === "settings" && (
        <Modal title="Make it yours" onClose={() => setModal("")}>
          <div className="settings-section">
            <h3>Your focus rhythm</h3>
            <div className="number-grid">
              {[
                { key: "focusMinutes", label: "Focus (minutes)", max: 180 },
                { key: "breakMinutes", label: "Short break", max: 60 },
                { key: "longBreakMinutes", label: "Long break", max: 120 },
                { key: "cycles", label: "Sessions per cycle", max: 12 },
              ].map(({ key, label, max }) => (
                <label key={key}>
                  {label}
                  <input
                    type="number"
                    min="1"
                    max={max}
                    disabled={active}
                    value={s.settings[key as "focusMinutes"]}
                    onChange={(e) => {
                      const n = Math.round(Number(e.target.value));
                      if (n >= 1 && n <= max) setSettings({ [key]: n });
                    }}
                  />
                </label>
              ))}
            </div>
            {active && (
              <small>Finish this session to change your rhythm.</small>
            )}
          </div>
          <div className="settings-section">
            <h3>A little atmosphere</h3>
            <label className="field-label">
              Sound
              <select
                value={s.settings.sound}
                onChange={(e) => {
                  stopAudio();
                  setAudioOn(false);
                  setSettings({
                    sound: e.target.value as State["settings"]["sound"],
                  });
                }}
              >
                <option value="off">Quiet</option>
                <option value="rain">Soft rain</option>
                <option value="purr">Sleepy purr</option>
              </select>
            </label>
            <label className="range-label">
              Volume
              <input
                type="range"
                min="0"
                max="1"
                step=".05"
                value={s.settings.volume}
                onChange={(e) => {
                  setSettings({ volume: Number(e.target.value) });
                  setVolume(Number(e.target.value));
                }}
              />
            </label>
            <button className="secondary" onClick={audio}>
              <Headphones size={17} />
              {audioOn ? "Stop sound" : "Preview sound"}
            </button>
          </div>
          <div className="settings-section">
            <h3>Android focus protection</h3>
            <label className="toggle-row">
              <span>Block other apps during focus</span>
              <input
                type="checkbox"
                checked={s.settings.blocking}
                disabled={active}
                onChange={(e) => setSettings({ blocking: e.target.checked })}
              />
            </label>
            <button
              className="link-button"
              onClick={() => setModal("blocking")}
            >
              Set up protection <ChevronRight size={15} />
            </button>
            {native && (
              <>
                <button
                  className="secondary full-width"
                  onClick={async () => {
                    try {
                      notify(
                        (await enableNotifications())
                          ? "Session notifications enabled."
                          : "Notifications are not enabled. You can change this in Android settings.",
                      );
                    } catch {
                      notify("Could not enable notifications.");
                    }
                  }}
                >
                  Enable session notifications
                </button>
                <button
                  className="link-button"
                  onClick={() =>
                    void exactAlarms().catch(() =>
                      notify("Could not open alarm settings."),
                    )
                  }
                >
                  Allow precise timer alarms <ChevronRight size={15} />
                </button>
              </>
            )}
          </div>
          <div className="settings-section">
            <h3>Your progress stays with you</h3>
            <p>
              No account, ads, subscriptions, or analytics. Data stays on this
              device. Back it up before uninstalling or clearing app data.
            </p>
            <div className="button-row">
              <button className="secondary" onClick={backup}>
                <Download size={16} /> Export backup
              </button>
              <button
                className="secondary"
                disabled={active}
                onClick={() => importRef.current?.click()}
              >
                <Upload size={16} /> Restore
              </button>
            </div>
            <input
              className="visually-hidden"
              ref={importRef}
              type="file"
              accept="application/json,.json"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  if (f.size > 10000000) throw Error("This file is too large.");
                  const restored = parseState(await f.text());
                  if (
                    window.confirm(
                      "Replace this device’s progress with this backup?",
                    )
                  ) {
                    previousSession.current = restored.sessions[0]?.id ?? "";
                    setState({ ...restored, timer: null });
                    notify("Your little corner is restored.");
                  }
                } catch (err) {
                  notify(
                    err instanceof Error
                      ? err.message
                      : "This backup could not be read.",
                  );
                }
                e.target.value = "";
              }}
            />
          </div>
          <p className="fine-print">
            Purrch 1.0 · Original artwork and open source code.
            <br />
            Independent project inspired by the cozy focus-timer concept.
          </p>
        </Modal>
      )}
      {modal === "blocking" && (
        <Modal
          title="A little space from distractions"
          onClose={() => setModal("")}
        >
          <div className="modal-hero-icon">
            <ShieldCheck size={36} />
          </div>
          <p>
            During a focus session, Purrch covers other apps with a gentle
            reminder to return to your cat. Protection continues when your
            screen is off and while the timer is paused. It ends when the
            session finishes.
          </p>
          <div className="info-box">
            <strong>Essential controls stay available.</strong>
            <p>
              Phone and emergency calls, your home screen, keyboard, Android
              settings and system controls are allowed. This is a focus aid: you
              can end a session or disable its permission. Split-screen,
              floating windows and some manufacturer features may bypass it.
            </p>
          </div>
          <h3>Your privacy</h3>
          <p>
            The accessibility service checks only which app opens. It does not
            read screen text, messages, passwords, or keystrokes, and sends
            nothing to a server.
          </p>
          {native ? (
            <>
              <p>
                <strong>
                  {guard ? "Protection is enabled." : "One-time setup"}
                </strong>
              </p>
              <ol>
                <li>Open Android accessibility settings below.</li>
                <li>
                  Choose <strong>Purrch Focus Guard</strong>, then enable it.
                </li>
                <li>Return here and start a focus session.</li>
              </ol>
              <p className="fine-print">
                If Android disables this option for a downloaded APK, open
                Settings → Apps → Purrch → ⋮ → Allow restricted settings, then
                try again. The path varies by phone.
              </p>
              <button
                className="primary full-width"
                onClick={() =>
                  void FocusGuard.openSettings().catch(() =>
                    notify(
                      "Please open Android Settings → Accessibility manually.",
                    ),
                  )
                }
              >
                <LockKeyhole size={17} /> Open Android settings
              </button>
            </>
          ) : (
            <div className="info-box">
              <strong>You’re using the browser preview.</strong>
              <p>
                Browsers cannot block Android apps. Install the Android APK to
                use protection. The timer, room and rewards still work here.
              </p>
            </div>
          )}
        </Modal>
      )}
      {modal === "end" && (
        <Modal title="Leave this little moment?" onClose={() => setModal("")}>
          <p>
            You can always start again. Ending early releases app protection,
            and your cat will bring a little crumpled paper instead of a reward.
          </p>
          <div className="button-row">
            <button
              className="secondary"
              onClick={() => {
                update((x) => finish(x, Date.now(), false));
                setModal("");
              }}
            >
              End session
            </button>
            <button className="primary" onClick={() => setModal("")}>
              Keep going
            </button>
          </div>
        </Modal>
      )}
      {modal === "outcome" && outcome && (
        <Modal
          title={
            outcome.mode === "break"
              ? "A fresh little start."
              : outcome.completed
                ? "Look at you, showing up."
                : "Another chance is always here."
          }
          onClose={() => setModal("")}
        >
          <div className="celebration">
            {outcome.mode === "break" ? (
              <Coffee size={52} />
            ) : outcome.completed ? (
              <Gift size={58} />
            ) : (
              <Leaf size={50} />
            )}
          </div>
          <p className="centered">
            {outcome.mode === "break"
              ? "Your break is over. Ready when you are."
              : outcome.completed
                ? `${s.settings.catName} kept you company for ${Math.floor(outcome.seconds / 60)} minutes and found you a little gift.`
                : "Your cat still thinks you’re pretty great. A little crumpled paper is waiting in your treasures."}
          </p>
          {outcome.completed && outcome.mode !== "break" && (
            <div className="reward-fish">
              <Fish /> +
              {Math.max(1, Math.min(60, Math.floor(outcome.seconds / 60)))} fish
            </div>
          )}
          <button
            className="primary full-width"
            onClick={() => {
              setMode(
                outcome.completed && outcome.mode !== "break"
                  ? "break"
                  : "focus",
              );
              setPage("focus");
              setModal("");
            }}
          >
            {outcome.completed && outcome.mode !== "break"
              ? "Time for a little break"
              : "Back to your nook"}
            <ArrowRight size={18} />
          </button>
        </Modal>
      )}
      {modal === "gifts" && (
        <Modal
          title="Little things, brought with love"
          onClose={() => setModal("")}
        >
          {!s.gifts.length ? (
            <div className="empty-state">
              <Gift size={40} />
              <h3>A surprise is on its way.</h3>
              <p>
                Finish a focus session to find out what your cat brings home.
              </p>
            </div>
          ) : (
            <>
              <p>
                Keep them for the memories, or trade them for a cozier room.
              </p>
              <div className="gifts-list">
                {s.gifts.map((g) => (
                  <div key={g.id}>
                    <span>{giftIcons[g.kind]}</span>
                    <strong>{giftNames[g.kind]}</strong>
                    <button
                      className="secondary"
                      onClick={() => update((x) => sell(x, g.id))}
                    >
                      Trade <Fish size={15} />
                      {g.value}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Modal>
      )}
      {modal === "wallpaper" && (
        <Modal title="A little piece of home" onClose={() => setModal("")}>
          <Room settings={s.settings} decor={s.decor} />
          <p>Save an image of your room to use as wallpaper.</p>
          <button
            className="primary full-width"
            onClick={async () => {
              try {
                const svg = document.querySelector("dialog .room-art");
                if (!svg) throw Error();
                const xml = await exportableSvg(svg);
                const url = URL.createObjectURL(
                  new Blob([xml], { type: "image/svg+xml" }),
                );
                const img = new Image();
                img.onload = async () => {
                  try {
                    const c = document.createElement("canvas");
                    c.width = 1440;
                    c.height = s.settings.roomStyle === "reading" ? 1080 : 1200;
                    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
                    URL.revokeObjectURL(url);
                    if (native) {
                      await FocusGuard.exportImage({
                        data: c.toDataURL("image/png").split(",")[1],
                      });
                      notify("Room image ready to save or share.");
                    } else {
                      const a = document.createElement("a");
                      a.href = c.toDataURL("image/png");
                      a.download = "purrch-room.png";
                      a.click();
                    }
                  } catch {
                    notify("Could not save the room image.");
                  }
                };
                img.onerror = () => {
                  URL.revokeObjectURL(url);
                  notify("Could not render the room image.");
                };
                img.src = url;
              } catch {
                notify("Could not save the room image.");
              }
            }}
          >
            <Download size={17} /> Save image
          </button>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
