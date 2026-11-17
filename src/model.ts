export type Mode = "focus" | "countup" | "break";
export type Timer = {
  id: string;
  mode: Mode;
  running: boolean;
  startedAt: number;
  runStartedAt: number;
  elapsedMs: number;
  durationMs: number;
  task: string;
};
export type Gift = {
  id: string;
  kind: "flower" | "shell" | "star" | "paper";
  value: number;
};
export type Session = {
  id: string;
  endedAt: number;
  seconds: number;
  task: string;
  completed: boolean;
  mode: Mode;
};
export type Settings = {
  catName: string;
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  cycles: number;
  blocking: boolean;
  wall: string;
  chair: string;
  fur: string;
  sound: "off" | "rain" | "purr";
  volume: number;
  roomStyle: "reading" | "drawn";
};
export type State = {
  version: 1;
  fish: number;
  settings: Settings;
  timer: Timer | null;
  tasks: { id: string; text: string; done: boolean; due: string }[];
  gifts: Gift[];
  sessions: Session[];
  owned: string[];
  decor: string[];
};
export const uid = () => crypto.randomUUID();
export const initialState = (): State => ({
  version: 1,
  fish: 30,
  settings: {
    catName: "Miso",
    focusMinutes: 30,
    breakMinutes: 5,
    longBreakMinutes: 15,
    cycles: 4,
    blocking: true,
    wall: "#eadbc5",
    chair: "#d1b89b",
    fur: "#b4a18a",
    sound: "off",
    volume: 0.3,
    roomStyle: "reading",
  },
  timer: null,
  tasks: [],
  gifts: [],
  sessions: [],
  owned: ["plant"],
  decor: ["plant"],
});
export const shop = [
  {
    id: "plant",
    name: "A little greenery",
    price: 20,
    icon: "plant",
    description: "A sunny friend for your cat.",
  },
  {
    id: "rug",
    name: "Sunday rug",
    price: 25,
    icon: "rug",
    description: "Soft paws, softer landings.",
  },
  {
    id: "books",
    name: "Bedside stories",
    price: 35,
    icon: "books",
    description: "A tiny stack of big adventures.",
  },
  {
    id: "lamp",
    name: "Golden-hour lamp",
    price: 50,
    icon: "lamp",
    description: "Keep a little sunshine inside.",
  },
  {
    id: "art",
    name: "Moonlit print",
    price: 60,
    icon: "art",
    description: "A small window to the night.",
  },
];
export const elapsed = (t: Timer, now: number) =>
  Math.max(
    0,
    t.elapsedMs + (t.running ? Math.max(0, now - t.runStartedAt) : 0),
  );
export const remaining = (t: Timer, now: number) =>
  Math.max(0, t.durationMs - elapsed(t, now));
export function start(s: State, mode: Mode, now: number, task = ""): State {
  if (s.timer) return s;
  const completed = s.sessions.filter(
    (x) => x.completed && x.mode !== "break",
  ).length;
  const mins =
    mode === "break"
      ? completed > 0 && completed % s.settings.cycles === 0
        ? s.settings.longBreakMinutes
        : s.settings.breakMinutes
      : Math.max(30, Math.min(180, s.settings.focusMinutes));
  return {
    ...s,
    timer: {
      id: uid(),
      mode,
      running: true,
      startedAt: now,
      runStartedAt: now,
      elapsedMs: 0,
      durationMs: mode === "countup" ? 0 : mins * 60000,
      task,
    },
  };
}
export function pause(s: State, now: number): State {
  if (!s.timer) return s;
  return {
    ...s,
    timer: {
      ...s.timer,
      elapsedMs: elapsed(s.timer, now),
      runStartedAt: now,
      running: !s.timer.running,
    },
  };
}
export function finish(
  s: State,
  now: number,
  requestedCompletion: boolean,
): State {
  const t = s.timer;
  if (!t) return s;
  // Countdowns can only earn completion rewards after the full duration.
  const completed =
    requestedCompletion &&
    (t.mode === "countup" ? elapsed(t, now) >= 60000 : remaining(t, now) === 0);
  const seconds = Math.floor(
    (t.mode === "countup"
      ? elapsed(t, now)
      : Math.min(t.durationMs, elapsed(t, now))) / 1000,
  );
  const session: Session = {
    id: t.id,
    endedAt:
      t.mode !== "countup" && completed && t.running
        ? t.runStartedAt + t.durationMs - t.elapsedMs
        : now,
    seconds,
    task: t.task,
    completed,
    mode: t.mode,
  };
  if (s.sessions.some((x) => x.id === t.id)) return { ...s, timer: null };
  const reward =
    completed && t.mode !== "break"
      ? Math.max(1, Math.min(60, Math.floor(seconds / 60)))
      : 0;
  const kind: Gift["kind"] = completed
    ? (["flower", "shell", "star"] as const)[s.sessions.length % 3]
    : "paper";
  const gift: Gift = {
    id: uid(),
    kind,
    value:
      kind === "paper" ? 1 : kind === "star" ? 10 : kind === "shell" ? 7 : 5,
  };
  return {
    ...s,
    timer: null,
    fish: s.fish + reward,
    sessions: [session, ...s.sessions].slice(0, 5000),
    gifts: t.mode === "break" ? s.gifts : [gift, ...s.gifts],
  };
}
export function tick(s: State, now: number): State {
  return s.timer?.running &&
    s.timer.mode !== "countup" &&
    remaining(s.timer, now) === 0
    ? finish(s, now, true)
    : s;
}
export function buy(s: State, id: string): State {
  const item = shop.find((x) => x.id === id);
  if (!item || s.owned.includes(id) || s.fish < item.price) return s;
  return {
    ...s,
    fish: s.fish - item.price,
    owned: [...s.owned, id],
    decor: [...s.decor, id],
  };
}
export function sell(s: State, id: string): State {
  const g = s.gifts.find((x) => x.id === id);
  return g
    ? {
        ...s,
        fish: s.fish + g.value,
        gifts: s.gifts.filter((x) => x.id !== id),
      }
    : s;
}
export function toggleDecor(s: State, id: string): State {
  return !s.owned.includes(id)
    ? s
    : {
        ...s,
        decor: s.decor.includes(id)
          ? s.decor.filter((x) => x !== id)
          : [...s.decor, id],
      };
}
export const dateKey = (time: number) => {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const clockText = (ms: number) => {
  const n = Math.max(0, Math.ceil(ms / 1000));
  const seconds = String(n % 60).padStart(2, "0");
  if (n >= 3600)
    return `${Math.floor(n / 3600)}:${String(Math.floor(n / 60) % 60).padStart(2, "0")}:${seconds}`;
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${seconds}`;
};

// Backups are untrusted input. Validate the full shape before replacing progress.
export function parseState(raw: string): State {
  const s = JSON.parse(raw) as State;
  const num = (x: unknown, min: number, max: number) =>
    typeof x === "number" && Number.isFinite(x) && x >= min && x <= max;
  const str = (x: unknown, max = 200) =>
    typeof x === "string" && x.length <= max;
  const color = (x: unknown) =>
    typeof x === "string" && /^#[0-9a-f]{6}$/i.test(x);
  const modes = ["focus", "countup", "break"];
  if (!s || s.version !== 1 || !num(s.fish, 0, 1e9) || !s.settings)
    throw Error("This is not a Purrch backup.");
  const p = s.settings;
  if (p.roomStyle === undefined) p.roomStyle = "reading";
  if (
    !str(p.catName, 30) ||
    !num(p.focusMinutes, 1, 180) ||
    !num(p.breakMinutes, 1, 60) ||
    !num(p.longBreakMinutes, 1, 120) ||
    !num(p.cycles, 1, 12) ||
    !Number.isInteger(p.cycles) ||
    typeof p.blocking !== "boolean" ||
    !color(p.wall) ||
    !color(p.chair) ||
    !color(p.fur) ||
    !["off", "rain", "purr"].includes(p.sound) ||
    !num(p.volume, 0, 1) ||
    !["reading", "drawn"].includes(p.roomStyle)
  )
    throw Error("Invalid settings in backup.");
  // Preserve older saved progress while raising short focus presets to the new minimum.
  p.focusMinutes = Math.max(30, Math.round(p.focusMinutes));
  if (
    !Array.isArray(s.tasks) ||
    s.tasks.length > 1000 ||
    s.tasks.some(
      (x) =>
        !x ||
        !str(x.id) ||
        !str(x.text, 200) ||
        typeof x.done !== "boolean" ||
        !str(x.due, 10),
    )
  )
    throw Error("Invalid tasks.");
  if (
    !Array.isArray(s.sessions) ||
    s.sessions.length > 5000 ||
    s.sessions.some(
      (x) =>
        !x ||
        !str(x.id) ||
        !str(x.task) ||
        !num(x.endedAt, 0, 1e14) ||
        !num(x.seconds, 0, 1e9) ||
        typeof x.completed !== "boolean" ||
        !modes.includes(x.mode),
    )
  )
    throw Error("Invalid history.");
  if (
    !Array.isArray(s.gifts) ||
    s.gifts.length > 10000 ||
    s.gifts.some(
      (x) =>
        !x ||
        !str(x.id) ||
        !["flower", "shell", "star", "paper"].includes(x.kind) ||
        !num(x.value, 0, 100),
    )
  )
    throw Error("Invalid gifts.");
  if (
    !Array.isArray(s.owned) ||
    !Array.isArray(s.decor) ||
    [...s.owned, ...s.decor].some((x) => !shop.some((i) => i.id === x)) ||
    s.decor.some((x) => !s.owned.includes(x))
  )
    throw Error("Invalid furniture.");
  if (s.timer) {
    const t = s.timer;
    if (
      !str(t.id) ||
      !str(t.task) ||
      !modes.includes(t.mode) ||
      typeof t.running !== "boolean" ||
      ![t.startedAt, t.runStartedAt].every((x) => num(x, 0, 1e14)) ||
      !num(t.elapsedMs, 0, 1e12) ||
      !num(t.durationMs, 0, 10800000)
    )
      throw Error("Invalid timer.");
  }
  return s;
}
