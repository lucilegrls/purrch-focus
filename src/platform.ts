import { Capacitor, registerPlugin } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { LocalNotifications } from "@capacitor/local-notifications";
import { elapsed, initialState, parseState } from "./model";
import type { State } from "./model";
export const native = Capacitor.isNativePlatform();
interface FocusGuardPlugin {
  status(): Promise<{ enabled: boolean }>;
  openSettings(): Promise<void>;
  configure(options: {
    active: boolean;
    endAt: number;
    catName: string;
  }): Promise<void>;
  exportBackup(options: { json: string }): Promise<void>;
  exportImage(options: { data: string }): Promise<void>;
}
export const FocusGuard = registerPlugin<FocusGuardPlugin>("FocusGuard");
const key = "purrch-state-v1";
export async function load(): Promise<State> {
  const { value } = await Preferences.get({ key });
  return value ? parseState(value) : initialState();
}
export async function save(state: State) {
  await Preferences.set({ key, value: JSON.stringify(state) });
}
export async function syncGuard(s: State) {
  if (!native) return;
  const t = s.timer;
  await FocusGuard.configure({
    active: !!t && t.mode !== "break" && s.settings.blocking,
    endAt:
      t && t.running && t.mode !== "countup"
        ? Date.now() + Math.max(0, t.durationMs - elapsed(t, Date.now()))
        : 0,
    catName: s.settings.catName,
  });
}
export async function syncNotification(s: State) {
  if (!native) return;
  await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
  const t = s.timer;
  if (!t?.running || t.mode === "countup") return;
  const permission = await LocalNotifications.checkPermissions();
  if (permission.display !== "granted") return;
  const delay = t.durationMs - elapsed(t, Date.now());
  if (delay <= 0) return;
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1,
        title:
          t.mode === "break"
            ? "Ready for another little chapter?"
            : `${s.settings.catName} has a gift for you`,
        body:
          t.mode === "break"
            ? "Your break is over. Come back when you’re ready."
            : "Your focus session is complete. Come collect your fish.",
        schedule: { at: new Date(Date.now() + delay), allowWhileIdle: true },
        channelId: "focus",
      },
    ],
  });
}
export async function enableNotifications() {
  if (!native) return false;
  await LocalNotifications.createChannel({
    id: "focus",
    name: "Focus timer",
    importance: 4,
  });
  return (await LocalNotifications.requestPermissions()).display === "granted";
}
export async function exactAlarms() {
  if (native) await LocalNotifications.changeExactNotificationSetting();
}
export async function downloadBackup(state: State) {
  const json = JSON.stringify({ ...state, timer: null }, null, 2);
  if (native) {
    await FocusGuard.exportBackup({ json });
    return;
  }
  const url = URL.createObjectURL(
    new Blob([json], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "purrch-backup.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
