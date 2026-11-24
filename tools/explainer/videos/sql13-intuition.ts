import { createVideo, span } from "./engine";
import { codePanel, shorts } from "./sqlkit";

const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: 48 });
const { text, life, s, set, frame } = v;
const BLUE = "#2B8CBE";
const GREEN = "#05A57A";
const RED = "#E2483D";
const GREY = "#94A3B8";

shorts(
  v,
  "Query Performance",
  "How the database runs your query, and how to help it",
  "In one line",
  ["Read the plan.", "Skip work, don't just do it faster."],
  [
    [5, 13.8, "A query plan is a tree. Read it from the bottom: scan, join, group, return."],
    [14, 22.8, "Data is stored in blocks with min/max values. A plain filter skips most blocks."],
    [23, 30.8, "Wrap the column in a function and no block can be skipped: every row is computed."],
    [31, 41, "Joining two one-to-many tables multiplies rows: 16 × 10 = 160, and SUM is 10× too big."],
  ]
);

/** A rounded box with a label; visible during [a, b]. */
function box(x: number, y: number, w: number, h: number, label: string, sub: string, a: number, b: number, color = BLUE) {
  const r = s("rect", { x, y, width: w, height: h, rx: 10, fill: "white", stroke: color, "stroke-width": 3, opacity: 0 });
  frame((t) => set(r, { opacity: span(t, a, b, 0.4) }));
  life(text(label, { x: x + w / 2, y: y + 18 }, { size: 26, ax: 0.5, weight: 600, color }), a, b, "fade", 0.4);
  if (sub) life(text(sub, { x: x + w / 2, y: y + 54 }, { size: 22, ax: 0.5, color: "#555" }), a + 0.1, b, "fade", 0.4);
  return r;
}
function line(x1: number, y1: number, x2: number, y2: number, a: number, b: number, color = GREY) {
  const l = s("line", { x1, y1, x2, y2, stroke: color, "stroke-width": 3, opacity: 0 });
  frame((t) => set(l, { opacity: span(t, a, b, 0.4) }));
}

// plan tree, bottom-up
const E = 13.8;
box(140, 760, 340, 92, "SCAN orders", "filter → 89 rows", 5.6, E);
box(600, 760, 340, 92, "SCAN customers", "150 rows", 6.2, E);
line(310, 760, 540, 680, 7.6, E);
line(770, 760, 540, 680, 7.6, E);
box(370, 588, 340, 92, "HASH JOIN", "89 rows", 7.8, E, GREEN);
line(540, 588, 540, 520, 9.4, E);
box(370, 428, 340, 92, "GROUP BY state", "12 rows", 9.6, E, GREEN);
line(540, 428, 540, 360, 11.2, E);
box(370, 268, 340, 92, "RESULT", "12 rows", 11.4, E, "#111");
life(text("↑ read bottom-up", { x: 980, y: 520 }, { size: 26, ax: 1, color: "#666" }), 8, E, "fade");

// storage blocks with zone maps
const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const blocks = MONTHS.map((m, i) => {
  const x = 90 + (i % 6) * 152;
  const y = 470 + Math.floor(i / 6) * 170;
  const r = s("rect", { x, y, width: 132, height: 140, rx: 8, fill: "#E2E8F0", stroke: "#CBD5E1", "stroke-width": 2, opacity: 0 });
  life(text(`${m} 1–${DAYS[i]}`, { x: x + 66, y: y + 50 }, { size: 19, ax: 0.5, color: "#334155" }), 14.6, 30.8, "fade", 0.4);
  life(text("min / max", { x: x + 66, y: y + 86 }, { size: 17, ax: 0.5, color: "#64748B" }), 14.6, 30.8, "fade", 0.4);
  return r;
});
frame((t) => {
  blocks.forEach((r, i) => {
    let fill = "#E2E8F0";
    let op = span(t, 14.4, 30.8, 0.4);
    if (t > 17.5 && t < 23) {
      fill = i === 5 ? "rgba(5,206,145,0.45)" : "#F1F5F9";
      if (i !== 5) op *= 0.35;
    }
    if (t >= 23 && t < 30.8) {
      const k = Math.floor((t - 24) / 0.35);
      fill = i <= k ? "rgba(226,72,61,0.35)" : "#E2E8F0";
    }
    set(r, { fill, opacity: op });
  });
});
codePanel(v, { x: 90, y: 200, size: 24, width: 900, lines: ["WHERE sale_date >= DATE '2025-06-01'", "  AND sale_date <  DATE '2025-07-01'"] }).at([{ t: 14.4, on: "all" }], [14.6, 22.8]);
life(text("June's block is read. The other 11 are skipped.", { x: 540, y: 850 }, { size: 30, ax: 0.5, color: GREEN, weight: 500 }), 18, 22.8, "fade");
codePanel(v, { x: 90, y: 200, size: 24, width: 900, lines: ["WHERE month(sale_date) = 6", "-- min/max can't answer this"] }).at([{ t: 23, on: "all" }], [23, 30.8]);
life(text("Every block is read and every row computed.", { x: 540, y: 850 }, { size: 30, ax: 0.5, color: RED, weight: 500 }), 25, 30.8, "fade");

// fan-out
const F = 41;
const grid = (x0: number, y0: number, n: number, cols: number, color: string, a: number) => {
  for (let i = 0; i < n; i++) {
    const r = s("rect", { x: x0 + (i % cols) * 26, y: y0 + Math.floor(i / cols) * 26, width: 20, height: 20, rx: 3, fill: color, opacity: 0 });
    frame((t) => set(r, { opacity: span(t, a + i * 0.004, F, 0.3) }));
  }
};
life(text("16 item rows", { x: 190, y: 300 }, { size: 28, ax: 0.5, weight: 600, color: BLUE }), 31.4, F, "fade");
grid(110, 350, 16, 4, BLUE, 31.6);
life(text("× 10 sessions", { x: 190, y: 500 }, { size: 28, ax: 0.5, weight: 600, color: GREEN }), 32.4, F, "fade");
grid(60, 550, 10, 5, GREEN, 32.6);
life(text("= 160 joined rows", { x: 690, y: 300 }, { size: 28, ax: 0.5, weight: 600, color: RED }), 34, F, "fade");
grid(430, 350, 160, 20, "rgba(226,72,61,0.7)", 34.2);
life(text("SUM(revenue): 7,664 instead of 766", { x: 540, y: 690 }, { size: 32, ax: 0.5, weight: 600, color: RED }), 36, F, "fade");
life(text("Fix: aggregate each table first, then join one row to one row.", { x: 540, y: 760 }, { size: 28, ax: 0.5, color: "#333" }), 37.5, F, "fade");

v.ready();
