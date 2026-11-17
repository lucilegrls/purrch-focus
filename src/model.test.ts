import { describe, expect, it } from "vitest";
import {
  buy,
  elapsed,
  finish,
  initialState,
  parseState,
  pause,
  remaining,
  sell,
  start,
  tick,
  toggleDecor,
} from "./model";
describe("durable focus sessions", () => {
  it("recovers a countdown after suspension and awards exactly once", () => {
    const s = start(initialState(), "focus", 1000);
    const done = tick(parseState(JSON.stringify(s)), 1000 + 30 * 60000);
    expect(done.timer).toBeNull();
    expect(done.fish).toBe(55);
    expect(done.sessions[0].seconds).toBe(1500);
    expect(done.sessions[0].endedAt).toBe(1501000);
    expect(tick(done, 99999999)).toBe(done);
    expect(finish(done, 99999999, true)).toBe(done);
  });
  it("pauses without counting time away, including across a restart", () => {
    let s = start(initialState(), "focus", 1000);
    s = pause(s, 61000);
    expect(elapsed(s.timer!, 900000)).toBe(60000);
    s = pause(parseState(JSON.stringify(s)), 900000);
    expect(remaining(s.timer!, 960000)).toBe(23 * 60000);
  });
  it("cannot earn completion rewards by ending a countdown early", () => {
    const s = finish(start(initialState(), "focus", 1000), 2000, true);
    expect(s.fish).toBe(30);
    expect(s.gifts[0].kind).toBe("paper");
    expect(s.sessions[0].completed).toBe(false);
  });
  it("requires a full minute for a count-up reward", () => {
    expect(
      finish(start(initialState(), "countup", 1000), 60999, true).fish,
    ).toBe(30);
    expect(
      finish(start(initialState(), "countup", 1000), 61000, true).fish,
    ).toBe(31);
  });
  it("leaves unfinished count-up sessions running through reloads", () => {
    const s = start(initialState(), "countup", 1000);
    expect(tick(s, 86400000).timer).not.toBeNull();
  });
  it("never rewards breaks", () => {
    const s = start(initialState(), "break", 1000);
    const done = tick(s, 1000 + 5 * 60000);
    expect(done.fish).toBe(30);
    expect(done.gifts).toHaveLength(0);
    expect(done.sessions[0].completed).toBe(true);
  });
  it("uses a long break after a complete cycle", () => {
    let s = initialState();
    for (let i = 0; i < 4; i++) {
      s = start(s, "focus", 1000);
      s = tick(s, 1501000);
    }
    s = start(s, "break", 2000000);
    expect(s.timer!.durationMs).toBe(15 * 60000);
  });
  it("does not replace a running timer or generate duplicate rewards", () => {
    const s = start(initialState(), "focus", 1000);
    expect(start(s, "focus", 2000)).toBe(s);
  });
});
describe("room economy and backups", () => {
  it("charges once, prevents overspending, and only equips owned items", () => {
    const s = buy(initialState(), "rug");
    expect(s.fish).toBe(5);
    expect(buy(s, "rug")).toBe(s);
    expect(buy(s, "art")).toBe(s);
    expect(toggleDecor(s, "art")).toBe(s);
    expect(toggleDecor(s, "rug").decor).not.toContain("rug");
  });
  it("trades a gift once", () => {
    let s = tick(start(initialState(), "focus", 1000), 1501000);
    const gift = s.gifts[0];
    const balance = s.fish;
    s = sell(s, gift.id);
    expect(s.fish).toBe(balance + gift.value);
    expect(sell(s, gift.id)).toBe(s);
  });
  it("round trips a real state and rejects malformed imports", () => {
    expect(parseState(JSON.stringify(initialState()))).toEqual(initialState());
    expect(() => parseState("{}")).toThrow();
    expect(() =>
      parseState(JSON.stringify({ ...initialState(), fish: -10 })),
    ).toThrow();
    expect(() =>
      parseState(
        JSON.stringify({ ...initialState(), tasks: [{ text: "incomplete" }] }),
      ),
    ).toThrow();
    const s = initialState();
    s.settings.wall = "url(https://example.com)";
    expect(() => parseState(JSON.stringify(s))).toThrow();
  });
});
