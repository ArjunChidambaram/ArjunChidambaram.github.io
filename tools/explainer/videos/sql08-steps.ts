import { createVideo } from "./engine";
import { table, rows, codePanel, type Val, type RowKey } from "./sqlkit";

const DUR = 100;
const v = createVideo({ theme: "dark", width: 1920, height: 1080, duration: DUR });
const { C, W, text, life } = v;
const FIX = "rgba(131,193,103,0.26)";
const BAD = "rgba(252,98,85,0.24)";

v.centerTitle("Cleaning Messy Data, Step by Step", 0.2, 7.6, 70, 60, 700);
life(text("Real data arrives with stray spaces, mixed case, blanks and text where numbers should be.", { x: W / 2, y: 330 }, { size: 36, ax: 0.5 }), 1.4, 7.6, "fade");
life(text("Fix one column at a time, then count.", { x: W / 2, y: 400 }, { size: 36, ax: 0.5, color: C.dim }), 3, 7.6, "fade");

const RAW: Val[][] = [
  [1, "␣␣Ava.Smith@Example.com␣", "austin", "34", "Email"],
  [2, "liam.jones@example.com", "AUSTIN␣", "41", "''"],
  [3, "ava.smith@example.com", "Austin", "n/a", "email␣"],
  [4, null, "''", "29", "Social"],
  [5, "noah@example.com", "Dallas", "␣52", null],
];
const T = table(v, {
  x: 120,
  y: 470,
  rowH: 60,
  size: 26,
  title: "signups_raw",
  titleColor: C.blue,
  cols: [
    { key: "id", w: 70 },
    { key: "email", w: 520 },
    { key: "city", w: 220 },
    { key: "age", w: 160, align: "right" },
    { key: "referral", w: 230 },
  ],
  rows: RAW,
});
const step = (t: number, col: number, vals: Val[], bad: boolean[] = []): RowKey[] => [
  { t, bg: RAW.map((_, i) => (bad[i] ? BAD : FIX)), set: vals.map((x, i) => [i, col, x] as [number, number, Val]) },
  { t: t + 5.2, bg: RAW.map(() => null) },
];
rows(
  v,
  T,
  [
    ...step(12, 1, ["ava.smith@example.com", "liam.jones@example.com", "ava.smith@example.com", null, "noah@example.com"]),
    ...step(20, 2, ["Austin", "Austin", "Austin", null, "Dallas"]),
    ...step(28, 3, [34, 41, null, 29, 52], [false, false, true, false, false]),
    ...step(36, 4, ["email", "unknown", "email", "social", "unknown"]),
    { t: 44, bg: [BAD, null, BAD, null, null] },
    { t: 47, slot: [0, 1, null, 2, 3], bg: RAW.map(() => null) },
  ],
  [8.6, 51.6]
);
const CODE: [number, string[]][] = [
  [9, ["-- each fix is a plain SELECT expression", "SELECT id, email, city, age, referral", "FROM signups_raw;"]],
  [11.6, ["LOWER(TRIM(email)) AS email", "-- TRIM strips spaces at both ends;", "-- LOWER makes case consistent"]],
  [19.6, ["NULLIF(UPPER(LEFT(TRIM(city), 1))", "    || LOWER(SUBSTRING(TRIM(city), 2)), '') AS city", "-- NULLIF turns '' into NULL"]],
  [27.6, ["TRY_CAST(TRIM(age) AS INTEGER) AS age", "-- CAST('n/a' AS INTEGER) would fail;", "-- TRY_CAST returns NULL instead"]],
  [35.6, ["COALESCE(LOWER(NULLIF(TRIM(referral), '')),", "         'unknown') AS referral", "-- blank and NULL both become 'unknown'"]],
  [43.6, ["SELECT email, COUNT(*) ... GROUP BY email", "-- now duplicates are visible:", "-- ava.smith@example.com signed up twice"]],
];
CODE.forEach(([t, lines], k) => codePanel(v, { x: 120, y: 200, size: 27, width: 1600, lines }).at([{ t, on: "all" }], [t, k < CODE.length - 1 ? CODE[k + 1][0] - 0.2 : 51.6]));

// timestamps
v.centerTitle("Dates: the BETWEEN Trap", 52.2, 66.6, 70, 52, 460);
life(text("Sessions on Nov 27 and 28? started_at is a {yellow:timestamp}: a date and a time.", { x: W / 2, y: 220 }, { size: 34, ax: 0.5 }), 53, 66.6, "fade");
life(text("WHERE started_at BETWEEN '2025-11-27' AND '2025-11-28'", { x: W / 2, y: 320 }, { size: 32, ax: 0.5, font: "'DejaVu Sans Mono',monospace", color: C.red }), 54.5, 66.6, "fade");
life(text("'2025-11-28' means midnight at the {red:start} of the 28th: 57 sessions, all of the 28th missing.", { x: W / 2, y: 385 }, { size: 32, ax: 0.5, color: C.dim }), 56, 66.6, "fade");
life(text("WHERE started_at >= '2025-11-27' AND started_at < '2025-11-29'", { x: W / 2, y: 500 }, { size: 32, ax: 0.5, font: "'DejaVu Sans Mono',monospace", color: C.green }), 58.5, 66.6, "fade");
life(text("A half-open range: includes the start, excludes the end. {green:125 sessions.}", { x: W / 2, y: 565 }, { size: 32, ax: 0.5, color: C.dim }), 60, 66.6, "fade");
life(text("It also stays fast: wrapping the column, CAST(started_at AS DATE) = …, can stop an index from being used.", { x: W / 2, y: 680 }, { size: 30, ax: 0.5 }), 62.5, 66.6, "fade");

// dialects
v.centerTitle("Same Idea, Different Spellings", 67.2, 92.6, 70, 52, 600);
const ROWS: [string, string, string, string][] = [
  ["", "PostgreSQL / DuckDB", "BigQuery", "SQL Server"],
  ["round to month", "date_trunc('month', d)", "DATE_TRUNC(d, MONTH)", "DATETRUNC(month, d)"],
  ["days between", "d2 - d1", "DATE_DIFF(d2, d1, DAY)", "DATEDIFF(day, d1, d2)"],
  ["add 30 days", "d + INTERVAL '30 days'", "DATE_ADD(d, INTERVAL 30 DAY)", "DATEADD(day, 30, d)"],
  ["format", "to_char / strftime", "FORMAT_DATE('%b %d', d)", "FORMAT(d, 'MMM dd')"],
  ["safe cast", "TRY_CAST (DuckDB)", "SAFE_CAST", "TRY_CAST"],
];
ROWS.forEach((r, i) =>
  r.forEach((cell, j) =>
    life(
      text(cell, { x: [100, 420, 900, 1450][j], y: 220 + i * 95 }, { size: i === 0 ? 30 : 25, font: j === 0 || i === 0 ? undefined : "'DejaVu Sans Mono',monospace", color: i === 0 ? C.blue : j === 0 ? C.dim : C.ink }),
      68 + i * 0.6,
      92.6,
      "fade"
    )
  )
);
life(text("Check your database's docs for date functions: they differ more than any other part of SQL.", { x: W / 2, y: 830 }, { size: 32, ax: 0.5, color: C.yellow }), 74, 92.6, "fade");

v.endCard(93.2, 99.6, [
  { text: "Clean each column, use half-open date ranges, then count.", size: 42, y: 260 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
