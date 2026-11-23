import { createVideo } from "./engine";
import { table, rows, codePanel, shorts, type Val } from "./sqlkit";

const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: 48 });
const GREEN = "rgba(5,206,145,0.22)";
const RED = "rgba(226,72,61,0.16)";
const AMBER = "rgba(212,160,23,0.28)";

// eight real customers from the store database
const DATA: Val[][] = [
  [1, "Sophia", "Austin", "TX", "business"],
  [2, "Aiden", "Houston", "TX", "consumer"],
  [3, "Wei", "Portland", "OR", "business"],
  [4, "Daniel", "Seattle", "WA", "business"],
  [8, "Arjun", "New York", "NY", "consumer"],
  [12, "Chloe", "Houston", "TX", "consumer"],
  [51, "Chloe", null, "OR", "consumer"],
  [60, "David", null, "MA", "business"],
];
const COLS = [
  { key: "customer_id", w: 180 },
  { key: "first_name", w: 190 },
  { key: "city", w: 200 },
  { key: "state", w: 120 },
  { key: "segment", w: 190 },
];
const N = DATA.length;
const all = (f: (i: number) => boolean) => DATA.map((_, i) => f(i));

shorts(
  v,
  "SELECT and WHERE",
  "Asking a table a question",
  "SQL in one line",
  ["SELECT picks the columns.", "WHERE picks the rows."],
  [
    [5, 11.8, "A table: one row per customer, one column per fact."],
    [12, 19.8, "SELECT keeps only the columns you name."],
    [20, 29.8, "WHERE tests every row and keeps the ones that pass."],
    [30, 35.8, "Careful: NULL means unknown, not \"not Austin\"."],
    [36, 41, "Unknown fails the test, so NULL rows quietly disappear."],
  ]
);

// ---- scenes A–C: one table ----
const T1 = table(v, { x: 100, y: 345, cols: COLS, rows: DATA, rowH: 54, size: 26 });
const isTX = all((i) => DATA[i][3] === "TX");
const keep = (mask: boolean[]) => {
  let k = 0;
  return mask.map((m) => (m ? k++ : null));
};
rows(
  v,
  T1,
  [
    { t: 13, cols: [false, true, true, true, false] },
    { t: 22, bg: isTX.map((x) => (x ? GREEN : null)) },
    { t: 23.6, dim: isTX.map((x) => !x) },
    { t: 25.6, slot: keep(isTX), dim: all(() => false) },
  ],
  [5.2, 29.6]
);
const c1 = codePanel(v, { x: 100, y: 160, lines: ["SELECT *", "FROM customers;"], size: 27, width: 880 });
c1.at([{ t: 5, on: "all" }], [5.2, 11.9]);
const c2 = codePanel(v, { x: 100, y: 160, lines: ["SELECT first_name, city, state", "FROM customers", "WHERE state = 'TX';"], size: 27, width: 880 });
c2.at(
  [
    { t: 12, on: [0, 1] },
    { t: 20, on: [2] },
    { t: 25.6, on: "all" },
  ],
  [12, 29.6]
);
// hide the WHERE line until scene C by covering it with dimming: show line 2 only after t=20
v.frame((t) => {
  c2.lineEls[2].style.visibility = t >= 20 ? "visible" : "hidden";
});

// ---- scene D: NULL ----
const T2 = table(v, { x: 100, y: 345, cols: COLS, rows: DATA, rowH: 54, size: 26 });
const austin = all((i) => DATA[i][2] === "Austin");
const unknown = all((i) => DATA[i][2] === null);
rows(
  v,
  T2,
  [
    { t: 0, cols: [false, true, true, true, false], dur: 0.01 },
    { t: 31.6, bg: DATA.map((_, i) => (austin[i] ? RED : unknown[i] ? null : GREEN)) },
    { t: 33.6, bg: DATA.map((_, i) => (austin[i] ? RED : unknown[i] ? AMBER : GREEN)) },
    { t: 36.4, slot: keep(DATA.map((_, i) => !austin[i] && !unknown[i])) },
  ],
  [30, 41]
);
const c3 = codePanel(v, { x: 100, y: 160, lines: ["SELECT first_name, city, state", "FROM customers", "WHERE city <> 'Austin';"], size: 27, width: 880 });
c3.at([{ t: 30, on: [2] }], [30, 41]);
const unk = v.text("{orange:NULL <> 'Austin' is unknown}", { x: 100, y: 850 }, { size: 28, weight: 600 });
v.life(unk, 33.6, 41, "fade");

v.ready();
