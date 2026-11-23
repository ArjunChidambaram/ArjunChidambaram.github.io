import { createVideo } from "./engine";
import { table, rows, codePanel, shorts, type Val } from "./sqlkit";

const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: 48 });
const BL = "rgba(43,140,190,0.20)";
const GR = "rgba(5,206,145,0.22)";
const RD = "rgba(226,72,61,0.20)";
const YE = "rgba(212,160,23,0.28)";

shorts(
  v,
  "Tables, Keys and Changes",
  "Designing tables and changing data safely",
  "In one line",
  ["Store each fact once.", "Let constraints and transactions guard it."],
  [
    [5, 13.8, "A wide table repeats the customer on every row. Split it: store each customer once, point to them by ID."],
    [14, 22.8, "Constraints reject bad rows: duplicate keys, impossible values, missing or unknown references."],
    [23, 30.8, "UPDATE changes the rows its WHERE matches. Forget the WHERE and it changes them all."],
    [31, 41, "A transaction is all or nothing: if anything fails, ROLLBACK undoes every step."],
  ]
);

// normalization
const WIDE: Val[][] = [
  [1001, "Kenji Martin", "Miami", "Chocolate"],
  [1002, "Kenji Martin", "Miami", "Charger"],
  [1009, "Kenji Martin", "Miami", "Earbuds"],
  [1064, "Kenji Martin", "Miami", "USB-C Cable"],
];
const WT = table(v, {
  x: 110,
  y: 250,
  rowH: 54,
  size: 25,
  title: "orders (wide)",
  cols: [
    { key: "order_id", w: 150 },
    { key: "customer", w: 220 },
    { key: "city", w: 150 },
    { key: "product", w: 200 },
    { key: "customer_id", w: 170, align: "right" },
  ],
  rows: WIDE.map((r) => [...r, 85]),
});
rows(
  v,
  WT,
  [
    { t: 0, cols: [true, true, true, true, false], dur: 0.01 },
    { t: 7, bg: WIDE.map(() => RD) },
    { t: 9.5, cols: [true, false, false, true, true], bg: WIDE.map(() => BL) },
  ],
  [5.3, 13.8]
);
const CU = table(v, {
  x: 330,
  y: 640,
  rowH: 54,
  size: 25,
  title: "customers",
  cols: [
    { key: "customer_id", w: 170, align: "right" },
    { key: "name", w: 220 },
    { key: "city", w: 150 },
  ],
  rows: [[85, "Kenji Martin", "Miami"]],
});
rows(v, CU, [{ t: 0, bg: [GR], dur: 0.01 }], [10.2, 13.8]);
v.life(v.text("Kenji's name and city, 4 times. Change his city: 4 updates, or a mismatch.", { x: 540, y: 600 }, { size: 27, ax: 0.5, color: "#C0392B" }), 7.2, 9.6, "fade");

// constraints
const TRY: Val[][] = [
  [1, 3, 5, "✓ stored"],
  [1, 7, 4, "✗ duplicate review_id"],
  [2, 3, 6, "✗ rating must be 1–5"],
  [3, null, 5, "✗ product_id is NOT NULL"],
  [4, 999, 5, "✗ no product 999"],
  [5, 7, 4, "✓ stored"],
];
const CT = table(v, {
  x: 90,
  y: 380,
  rowH: 56,
  size: 25,
  title: "INSERT INTO reviews ...",
  cols: [
    { key: "review_id", w: 150, align: "right" },
    { key: "product_id", w: 160, align: "right" },
    { key: "rating", w: 120, align: "right" },
    { key: "result", w: 470 },
  ],
  rows: TRY,
});
const ok = (i: number) => (TRY[i][3] as string).startsWith("✓");
rows(
  v,
  CT,
  [
    { t: 0, slot: TRY.map(() => null), dur: 0.01 },
    ...TRY.map((_, k) => ({ t: 14.6 + k * 1.1, slot: TRY.map((_, i) => (i <= k ? i : null)), bg: TRY.map((_, i) => (i <= k ? (ok(i) ? GR : RD) : null)), dur: 0.4 })),
  ],
  [14.3, 22.8]
);
codePanel(v, {
  x: 90,
  y: 165,
  size: 21,
  width: 900,
  lines: ["review_id  INTEGER PRIMARY KEY,", "product_id INTEGER NOT NULL REFERENCES products,", "rating     INTEGER CHECK (rating BETWEEN 1 AND 5)"],
}).at([{ t: 14, on: "all" }], [14.2, 22.8]);

// update
const PR: Val[][] = [
  ["Coffee Beans", "Grocery", 12.49],
  ["Trail Mix", "Grocery", 7.99],
  ["Rain Boots", "Footwear", 44.5],
  ["Green Tea", "Grocery", 6.99],
  ["Camping Lantern", "Outdoor", 34.99],
];
const UT = table(v, {
  x: 190,
  y: 380,
  rowH: 56,
  size: 26,
  title: "products",
  cols: [
    { key: "name", w: 290 },
    { key: "category", w: 200, align: "left" },
    { key: "price", w: 210, align: "right" },
  ],
  rows: PR,
});
const isG = PR.map((r) => r[1] === "Grocery");
rows(
  v,
  UT,
  [
    { t: 0, dur: 0.01 },
    { t: 24.5, bg: isG.map((g) => (g ? YE : null)) },
    { t: 26, set: PR.flatMap((r, i) => (isG[i] ? [[i, 2, Math.round((r[2] as number) * 110) / 100] as [number, number, Val]] : [])) },
    { t: 28.3, bg: PR.map(() => RD), set: PR.map((r, i) => [i, 2, 0.99] as [number, number, Val]) },
  ],
  [23.3, 30.8]
);
codePanel(v, { x: 190, y: 190, size: 24, width: 700, lines: ["UPDATE products SET price = price * 1.10", "WHERE category = 'Grocery';"] }).at([{ t: 23, on: "all" }], [23.2, 27.9]);
codePanel(v, { x: 190, y: 190, size: 24, width: 700, lines: ["UPDATE products SET price = 0.99;", "-- no WHERE: every row"] }).at([{ t: 28, on: "all" }], [28, 30.8]);

// transaction
const AC = table(v, {
  x: 620,
  y: 400,
  rowH: 60,
  size: 28,
  title: "accounts",
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
    { t: 33.2, set: [[0, 1, 70]], bg: [YE, null] },
    { t: 35, bg: [RD, RD] },
    { t: 36.3, set: [[0, 1, 100]], bg: [null, null] },
    { t: 38.2, set: [[0, 1, 70]], bg: [YE, null] },
    { t: 39.2, set: [[1, 1, 80]], bg: [GR, GR] },
  ],
  [31.3, 41]
);
codePanel(v, { x: 70, y: 400, size: 22, width: 440, lines: ["BEGIN;", "UPDATE: Ava − 30", "-- crash before Ben + 30!", "ROLLBACK;"] }).at(
  [
    { t: 31.5, on: [0] },
    { t: 33, on: [1] },
    { t: 34.8, on: [2] },
    { t: 36, on: [3] },
  ],
  [31.4, 37.6]
);
codePanel(v, { x: 70, y: 400, size: 22, width: 440, lines: ["BEGIN;", "UPDATE: Ava − 30", "UPDATE: Ben + 30", "COMMIT;"] }).at(
  [
    { t: 37.6, on: [0] },
    { t: 38, on: [1] },
    { t: 39, on: [2] },
    { t: 39.8, on: [3] },
  ],
  [37.6, 41]
);
v.life(v.text("Money never disappears halfway.", { x: 540, y: 760 }, { size: 32, ax: 0.5, weight: 500 }), 36.5, 41, "fade");

v.ready();
