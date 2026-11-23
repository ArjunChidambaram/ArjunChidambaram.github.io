import { createVideo } from "./engine";
import { table, rows, codePanel, shorts, type Val, type RowKey } from "./sqlkit";

const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: 48 });
const CUR = "rgba(43,140,190,0.22)";
const SRC = "rgba(5,206,145,0.20)";
const WIN = "rgba(212,160,23,0.24)";

shorts(
  v,
  "LAG, LEAD, Running Totals",
  "Looking at neighbouring rows",
  "In one line",
  ["Windows can look back, add up,", "and slide along ordered rows."],
  [
    [5, 13.8, "LAG copies a value from the previous row."],
    [14, 22.8, "So comparing each day with the day before is one subtraction."],
    [23, 31.8, "An ordered SUM adds up everything so far: a running total."],
    [32, 41, "A frame of 3 rows slides down the table: a moving average."],
  ]
);

const D: [string, number][] = [
  ["Dec 1", 13.98],
  ["Dec 2", 254.96],
  ["Dec 3", 392.7],
  ["Dec 4", 530.04],
  ["Dec 5", 434.54],
  ["Dec 6", 181.43],
  ["Dec 7", 354.92],
  ["Dec 8", 312.43],
];
const f2 = (x: number) => x.toFixed(2);
const T = table(v, {
  x: 70,
  y: 370,
  rowH: 54,
  size: 26,
  cols: [
    { key: "day", w: 150 },
    { key: "revenue", w: 170, align: "right" },
    { key: "previous", w: 170, align: "right" },
    { key: "change", w: 170, align: "right" },
    { key: "running", w: 190, align: "right" },
    { key: "avg_3", w: 160, align: "right" },
  ],
  rows: D.map((r) => [r[0], f2(r[1]), "", "", "", ""]),
});
const n = D.length;
const none = () => D.map(() => null as string | null);
const keys: RowKey[] = [{ t: 0, cols: [true, true, true, false, false, false], dur: 0.01 }];
// A: LAG
D.forEach((_, i) => {
  const bg = none();
  bg[i] = CUR;
  if (i > 0) bg[i - 1] = SRC;
  keys.push({ t: 6 + i * 0.9, bg, set: [[i, 2, i ? f2(D[i - 1][1]) : null]] as [number, number, Val][], dur: 0.3 });
});
keys.push({ t: 13.5, bg: none() });
// B: change
keys.push({ t: 14.4, cols: [true, true, true, true, false, false] });
D.forEach((_, i) => keys.push({ t: 15 + i * 0.6, set: [[i, 3, i ? (D[i][1] - D[i - 1][1] >= 0 ? "+" : "") + f2(D[i][1] - D[i - 1][1]) : null]] as [number, number, Val][], dur: 0.2 }));
// C: running total
keys.push({ t: 23.2, cols: [true, true, false, false, true, false] });
let run = 0;
D.forEach((r, i) => {
  run += r[1];
  const bg = D.map((_, j) => (j <= i ? (j === i ? CUR : SRC) : null));
  keys.push({ t: 24 + i * 0.85, bg, set: [[i, 4, f2(run)]] as [number, number, Val][], dur: 0.3 });
});
keys.push({ t: 31.4, bg: none() });
// D: moving average of 3 rows
keys.push({ t: 32.2, cols: [true, true, false, false, false, true] });
D.forEach((_, i) => {
  const lo = Math.max(0, i - 2);
  const avg = D.slice(lo, i + 1).reduce((a, r) => a + r[1], 0) / (i - lo + 1);
  const bg = D.map((__, j) => (j === i ? CUR : j >= lo && j < i ? WIN : null));
  keys.push({ t: 33 + i * 0.95, bg, set: [[i, 5, f2(avg)]] as [number, number, Val][], dur: 0.3 });
});
rows(v, T, keys, [5.2, 41]);
void n;

codePanel(v, { x: 70, y: 165, lines: ["SELECT day, revenue,", "  LAG(revenue) OVER (ORDER BY day) AS previous", "FROM daily;"], size: 25, width: 940 }).at([{ t: 5, on: [1] }], [5.2, 13.9]);
codePanel(v, { x: 70, y: 165, lines: ["SELECT day, revenue,", "  revenue - LAG(revenue) OVER (ORDER BY day)", "    AS change", "FROM daily;"], size: 25, width: 940 }).at([{ t: 14, on: [1, 2] }], [14, 22.9]);
codePanel(v, { x: 70, y: 165, lines: ["SELECT day, revenue,", "  SUM(revenue) OVER (ORDER BY day) AS running", "FROM daily;"], size: 25, width: 940 }).at([{ t: 23, on: [1] }], [23, 31.9]);
codePanel(v, { x: 70, y: 165, lines: ["SELECT day, revenue,", "  AVG(revenue) OVER (ORDER BY day", "    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)", "FROM daily;"], size: 25, width: 940 }).at([{ t: 32, on: [1, 2] }], [32, 41]);

v.ready();
