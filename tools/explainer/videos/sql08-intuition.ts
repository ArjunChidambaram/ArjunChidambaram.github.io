import { createVideo } from "./engine";
import { table, rows, shorts, type Val } from "./sqlkit";

const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: 48 });
const { C, W, text, life } = v;
const MONO = "'DejaVu Sans Mono',monospace";
const GREEN = "rgba(5,206,145,0.22)";
const RED = "rgba(226,72,61,0.14)";

shorts(
  v,
  "Dates, Strings, Cleaning",
  "Taming real-world values",
  "In one line",
  ["Pull values apart, round them,", "and clean them before you count."],
  [
    [5, 13.8, "A timestamp is many facts at once. EXTRACT pulls each one out."],
    [14, 22.8, "date_trunc rounds down to the hour, day, week or month."],
    [23, 31.8, "String functions trim, lowercase and split text."],
    [32, 41, "Clean first, or the same person counts twice."],
  ]
);

// A: extract
const TS = "2025-11-23 17:45:29";
life(text(TS, { x: W / 2, y: 260 }, { size: 56, ax: 0.5, font: MONO, weight: 600 }), 5.2, 13.8, "fade");
const PARTS: [string, string, string][] = [
  ["year", "2025", "EXTRACT(year FROM ts)"],
  ["month", "11", "EXTRACT(month FROM ts)"],
  ["day", "23", "EXTRACT(day FROM ts)"],
  ["hour", "17", "EXTRACT(hour FROM ts)"],
  ["weekday", "Sunday", "dayname(ts)"],
];
PARTS.forEach(([k, val, fn], i) => {
  const y = 400 + i * 100;
  life(text(fn, { x: 110, y }, { size: 30, font: MONO, color: C.dim }), 6.5 + i * 1.1, 13.8, "fade");
  life(text(`{#007A7A:${val}}`.replace("#007A7A", "teal"), { x: 970, y: y - 6 }, { size: 40, ax: 1, weight: 600 }), 6.9 + i * 1.1, 13.8, "fade");
  void k;
});

// B: trunc
life(text(TS, { x: W / 2, y: 260 }, { size: 56, ax: 0.5, font: MONO, weight: 600 }), 14.2, 22.8, "fade");
const TR: [string, string][] = [
  ["hour", "2025-11-23 17:00:00"],
  ["day", "2025-11-23 00:00:00"],
  ["week", "2025-11-17 00:00:00"],
  ["month", "2025-11-01 00:00:00"],
];
TR.forEach(([u, val], i) => {
  const y = 410 + i * 110;
  life(text(`date_trunc('${u}', ts)`, { x: 110, y }, { size: 28, font: MONO, color: C.dim }), 15.2 + i * 1.3, 22.8, "fade");
  life(text(val, { x: 970, y: y + 40 }, { size: 34, ax: 1, font: MONO, weight: 600 }), 15.6 + i * 1.3, 22.8, "fade");
});
life(text("(weeks start on Monday)", { x: W / 2, y: 880 }, { size: 26, ax: 0.5, color: C.dim }), 19, 22.8, "fade");

// C: strings
const ST: [string, string][] = [
  ["email", "'  Ava.Smith@Example.com '"],
  ["TRIM(email)", "'Ava.Smith@Example.com'"],
  ["LOWER(TRIM(email))", "'ava.smith@example.com'"],
  ["SPLIT_PART(…, '@', 1)", "'ava.smith'"],
  ["SPLIT_PART(…, '@', 2)", "'example.com'"],
];
ST.forEach(([fn, val], i) => {
  const y = 300 + i * 118;
  life(text(fn, { x: 110, y }, { size: 28, font: MONO, color: C.dim }), 23.4 + i * 1.4, 31.8, "fade");
  life(text(val.replace(/ /g, "&nbsp;"), { x: 110, y: y + 40 }, { size: 34, font: MONO, weight: 600 }), 23.8 + i * 1.4, 31.8, "fade");
});

// D: dedupe
const RAW: Val[][] = [
  ["  Ava.Smith@Example.com ", ""],
  ["liam.jones@example.com", ""],
  ["ava.smith@example.com", ""],
  ["noah@example.com", ""],
];
const T = table(v, {
  x: 60,
  y: 330,
  rowH: 58,
  size: 25,
  cols: [
    { key: "email (raw)", w: 470 },
    { key: "LOWER(TRIM(email))", w: 490 },
  ],
  rows: RAW.map((r) => [String(r[0]).replace(/ /g, " "), ""]),
});
const clean = ["ava.smith@example.com", "liam.jones@example.com", "ava.smith@example.com", "noah@example.com"];
rows(
  v,
  T,
  [
    ...clean.map((c, i) => ({ t: 34 + i * 0.6, set: [[i, 1, c]] as [number, number, Val][], dur: 0.3 })),
    { t: 37, bg: clean.map((c) => (c.startsWith("ava") ? RED : null)) },
    { t: 39, bg: clean.map((c, i) => (c.startsWith("ava") && i > 0 ? null : GREEN)), slot: [0, 1, null, 2] },
  ],
  [32.2, 41]
);
life(text("Raw: 4 distinct emails. Cleaned: {red:3 people}.", { x: 60, y: 660 }, { size: 32, weight: 600 }), 37.5, 41, "fade");

v.ready();
