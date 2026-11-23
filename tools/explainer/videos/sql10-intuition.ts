import { createVideo } from "./engine";
import { table, rows, codePanel, shorts, type Val } from "./sqlkit";

const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: 48 });
const R = ["rgba(43,140,190,0.22)", "rgba(5,206,145,0.22)", "rgba(212,160,23,0.28)", "rgba(226,72,61,0.18)", "rgba(140,90,200,0.2)"];

shorts(
  v,
  "Recursive CTEs",
  "A query that builds on its own output",
  "In one line",
  ["Start with one row.", "Repeat a step until nothing new appears."],
  [
    [5, 13.8, "An anchor row, then a step that adds 1 to the last row, until n = 5."],
    [14, 22.8, "Same idea on a tree: start at a manager, then find who reports to the last round."],
    [23, 30.8, "Round 4 finds nobody new, so the recursion stops by itself."],
    [31, 41, "Gaps and islands: day minus row number is constant inside a streak."],
  ]
);

// counting
const NUM = table(v, {
  x: 640,
  y: 380,
  rowH: 56,
  size: 27,
  cols: [
    { key: "n", w: 120, align: "right" },
    { key: "round", w: 170, align: "center" },
  ],
  rows: [1, 2, 3, 4, 5].map((n, i) => [n, i === 0 ? "anchor" : i] as Val[]),
});
rows(
  v,
  NUM,
  [
    { t: 0, slot: [0, null, null, null, null], bg: [R[0], null, null, null, null], dur: 0.01 },
    ...[1, 2, 3, 4].map((k) => ({ t: 7 + k * 1.4, slot: [0, 1, 2, 3, 4].map((i) => (i <= k ? i : null)), bg: [0, 1, 2, 3, 4].map((i) => (i <= k ? R[i] : null)) })),
  ],
  [5.4, 13.8]
);
codePanel(v, {
  x: 60,
  y: 380,
  size: 24,
  width: 530,
  lines: ["WITH RECURSIVE nums(n) AS (", "  SELECT 1", "  UNION ALL", "  SELECT n + 1 FROM nums", "  WHERE n < 5", ")", "SELECT n FROM nums;"],
}).at(
  [
    { t: 5, on: [1] },
    { t: 8, on: [3, 4] },
  ],
  [5.2, 13.8]
);

// tree
const PEOPLE: [string, string, number][] = [
  ["Priya Raman", "Dana Whitfield", 0],
  ["Elena Petrova", "Priya Raman", 1],
  ["Sam Okafor", "Priya Raman", 1],
  ["Jin Park", "Elena Petrova", 2],
  ["Olivia Brooks", "Elena Petrova", 2],
  ["Hannah Weiss", "Sam Okafor", 2],
  ["Ravi Shah", "Sam Okafor", 2],
  ["Nina Rossi", "Hannah Weiss", 3],
];
const TR = table(v, {
  x: 120,
  y: 340,
  rowH: 52,
  size: 25,
  title: "team (built round by round)",
  cols: [
    { key: "name", w: 300 },
    { key: "manager", w: 300 },
    { key: "depth", w: 120, align: "right" },
  ],
  rows: PEOPLE.map((p) => [...p]),
});
const upTo = (d: number) => PEOPLE.map((p, i) => (p[2] <= d ? i : null));
rows(
  v,
  TR,
  [
    { t: 0, slot: upTo(0), bg: PEOPLE.map((p) => R[p[2]]), dur: 0.01 },
    { t: 17, slot: upTo(1) },
    { t: 19.5, slot: upTo(2) },
    { t: 22, slot: upTo(3) },
  ],
  [14.4, 30.8]
);
v.life(v.text("Round 4: nobody reports to Nina, so 0 new rows.", { x: 540, y: 870 }, { size: 30, ax: 0.5, color: "#C0392B", weight: 500 }), 24.5, 30.8, "fade");
v.life(v.text("Each round joins employees to the previous round's rows only.", { x: 540, y: 250 }, { size: 28, ax: 0.5, color: "#555" }), 15, 30.8, "fade");

// islands
const DAYS: Val[][] = [
  ["Nov 1", 1, "Oct 31"],
  ["Nov 2", 2, "Oct 31"],
  ["Nov 3", 3, "Oct 31"],
  ["Nov 4", 4, "Oct 31"],
  ["Nov 7", 5, "Nov 2"],
  ["Nov 8", 6, "Nov 2"],
  ["Nov 10", 7, "Nov 3"],
  ["Nov 11", 8, "Nov 3"],
];
const ISL = [0, 0, 0, 0, 1, 1, 2, 2];
const GI = table(v, {
  x: 150,
  y: 300,
  rowH: 54,
  size: 26,
  cols: [
    { key: "day", w: 220 },
    { key: "row_number", w: 220, align: "right" },
    { key: "day − rn", w: 230, align: "right" },
  ],
  rows: DAYS,
});
rows(
  v,
  GI,
  [
    { t: 0, cols: [true, false, false], dur: 0.01 },
    { t: 32.5, cols: [true, true, false] },
    { t: 34.5, cols: [true, true, true] },
    { t: 36.5, bg: ISL.map((g) => R[g]) },
  ],
  [31.2, 41]
);
v.life(v.text("Three streaks: 4 days, 2 days, 2 days.", { x: 540, y: 820 }, { size: 32, ax: 0.5, weight: 500 }), 37.5, 41, "fade");

v.ready();
