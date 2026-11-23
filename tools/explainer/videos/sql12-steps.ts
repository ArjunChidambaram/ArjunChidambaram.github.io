import { createVideo } from "./engine";
import { table, rows, codePanel, type Val, type RowKey } from "./sqlkit";

const DUR = 100;
const v = createVideo({ theme: "dark", width: 1920, height: 1080, duration: DUR });
const { C, W, text, life } = v;
const OK = "rgba(131,193,103,0.24)";
const BAD = "rgba(224,90,90,0.26)";
const YE = "rgba(244,211,94,0.24)";

v.centerTitle("Constraints: When the Database Says No", 0.2, 7.6, 70, 56, 720);
life(text("A constraint is a rule the database checks on {green:every} INSERT and UPDATE.", { x: W / 2, y: 330 }, { size: 38, ax: 0.5 }), 1.4, 7.6, "fade");
life(text("Bad data is rejected at the door, instead of discovered in a report months later.", { x: W / 2, y: 400 }, { size: 36, ax: 0.5, color: C.dim }), 3, 7.6, "fade");

const code = codePanel(v, {
  x: 60,
  y: 160,
  size: 22,
  width: 900,
  lines: [
    "CREATE TABLE reviews (",
    "  review_id   INTEGER PRIMARY KEY,",
    "  product_id  INTEGER NOT NULL",
    "              REFERENCES products (product_id),",
    "  rating      INTEGER NOT NULL",
    "              CHECK (rating BETWEEN 1 AND 5),",
    "  title       VARCHAR,",
    "  created_at  DATE DEFAULT CURRENT_DATE",
    ");",
  ],
});
code.at(
  [
    { t: 8, on: "all" },
    { t: 14, on: [1] },
    { t: 21, on: [4, 5] },
    { t: 27, on: [2] },
    { t: 33, on: [3] },
    { t: 39, on: [6, 7] },
  ],
  [8.2, 49.6]
);

const TRY: Val[][] = [
  [1, 3, 5, "stored"],
  [1, 7, 4, "duplicate key"],
  [2, 3, 6, "CHECK failed"],
  [3, null, 5, "NOT NULL failed"],
  [4, 999, 5, "foreign key"],
  [5, 7, 4, "stored"],
];
const T = table(v, {
  x: 1020,
  y: 160,
  rowH: 56,
  size: 25,
  title: "INSERT INTO reviews VALUES ...",
  titleColor: C.blue,
  cols: [
    { key: "review_id", w: 150, align: "right" },
    { key: "product_id", w: 160, align: "right" },
    { key: "rating", w: 110, align: "right" },
    { key: "result", w: 380 },
  ],
  rows: TRY,
});
const at = [10, 15, 22, 28, 34, 40];
const k: RowKey[] = [{ t: 0, slot: TRY.map(() => null), dur: 0.01 }];
at.forEach((t, j) =>
  k.push({
    t,
    slot: TRY.map((_, i) => (i <= j ? i : null)),
    bg: TRY.map((r, i) => (i <= j ? (r[3] === "stored" ? OK : BAD) : null)),
    dim: TRY.map((_, i) => i < j),
    dur: 0.5,
  })
);
k.push({ t: 45, dim: TRY.map(() => false) });
rows(v, T, k, [9, 49.6]);

const L = (s: string, a: number, b: number, color?: string) => life(text(s, { x: 60, y: 690 }, { size: 28, width: 900, color }), a, b, "fade");
const L2 = (s: string, a: number, b: number, color?: string) => life(text(s, { x: 60, y: 745 }, { size: 28, width: 900, color: color ?? C.dim }), a, b, "fade");
L("{green:The first row is fine.} It becomes review 1.", 10.5, 14.4);
L("{blue:PRIMARY KEY}: unique and never NULL. A second review 1 is rejected.", 15, 20.6);
L2("It's how every other table can point at exactly one review.", 16, 20.6);
L("{blue:CHECK}: any true/false rule on the row. A 6-star rating is rejected.", 22, 26.6);
L2("Prices > 0, end_date >= start_date, status IN ('a', 'b')...", 23, 26.6);
L("{blue:NOT NULL}: the value must be present. A review of no product is rejected.", 28, 32.6);
L("{blue:FOREIGN KEY}: the value must exist in the other table. No product 999.", 34, 38.6);
L2("It also blocks deleting a product that reviews still point to.", 35, 38.6);
L("{blue:DEFAULT} fills in columns you leave out; title may be NULL.", 40.4, 49.6);
L2("Four rejected rows, two stored. Each failure is a clear error message.", 44, 49.6);

// safe changes
v.centerTitle("Changing Data Without Regret", 50.2, 70.6, 70, 52, 560);
const SAFE: [string, string][] = [
  ["Look first", "run SELECT with the same WHERE; check the row count"],
  ["Then change", "UPDATE / DELETE with that exact WHERE"],
  ["See what changed", "RETURNING (PostgreSQL, SQLite, DuckDB; OUTPUT in SQL Server)"],
  ["Keep an exit", "BEGIN first; ROLLBACK if the count surprises you"],
  ["Prefer soft deletes", "set deleted_at instead of removing history you may need"],
];
SAFE.forEach(([a, b], i) => {
  life(text(`{blue:${a}}`, { x: 160, y: 190 + i * 82 }, { size: 32 }), 51 + i * 0.8, 70.6, "fade");
  life(text(b, { x: 560, y: 192 + i * 82 }, { size: 30 }), 51.2 + i * 0.8, 70.6, "fade");
});
life(text("UPDATE customers SET city = 'Austin';", { x: W / 2, y: 690 }, { size: 34, ax: 0.5, font: "'DejaVu Sans Mono',monospace", color: C.red }), 57, 70.6, "fade");
life(text("No WHERE: all 150 customers now live in Austin.", { x: W / 2, y: 760 }, { size: 32, ax: 0.5, color: C.red }), 58, 70.6, "fade");

// transactions
v.centerTitle("Transactions: All or Nothing", 71.2, 92.6, 70, 52, 520);
const AC = table(v, {
  x: 1260,
  y: 200,
  rowH: 60,
  size: 28,
  title: "accounts",
  titleColor: C.blue,
  cols: [
    { key: "owner", w: 180 },
    { key: "balance", w: 200, align: "right" },
  ],
  rows: [
    ["Ava", 100],
    ["Ben", 50],
  ],
});
rows(
  v,
  AC,
  [
    { t: 0, dur: 0.01 },
    { t: 74.5, set: [[0, 1, 70]], bg: [YE, null] },
    { t: 76, set: [[1, 1, 80]], bg: [YE, YE] },
    { t: 77.5, bg: [OK, OK] },
  ],
  [72, 92.6]
);
codePanel(v, { x: 120, y: 200, size: 23, width: 1030, lines: ["BEGIN;", "UPDATE accounts SET balance = balance - 30 WHERE owner = 'Ava';", "UPDATE accounts SET balance = balance + 30 WHERE owner = 'Ben';", "COMMIT;   -- or ROLLBACK; to undo both"] }).at(
  [
    { t: 72, on: [0] },
    { t: 74, on: [1] },
    { t: 75.6, on: [2] },
    { t: 77.2, on: [3] },
  ],
  [72.2, 92.6]
);
const ACID: [string, string][] = [
  ["Atomic", "both updates happen, or neither does"],
  ["Consistent", "constraints hold before and after"],
  ["Isolated", "others don't see the half-done state"],
  ["Durable", "after COMMIT, it survives a crash"],
];
ACID.forEach(([a, b], i) => {
  life(text(`{green:${a}}`, { x: 160, y: 520 + i * 70 }, { size: 32 }), 79 + i * 0.8, 92.6, "fade");
  life(text(b, { x: 440, y: 522 + i * 70 }, { size: 30 }), 79.2 + i * 0.8, 92.6, "fade");
});
life(text("(This site's editor wraps every run in BEGIN ... ROLLBACK, so you can't break anything.)", { x: W / 2, y: 880 }, { size: 26, ax: 0.5, color: C.dim }), 84, 92.6, "fade");

v.endCard(93.2, 99.6, [
  { text: "Store facts once. Let the database enforce the rules.", size: 42, y: 260 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
