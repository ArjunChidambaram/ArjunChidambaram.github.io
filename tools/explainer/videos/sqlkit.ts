/**
 * Animated tables and a SQL code panel for the SQL series videos.
 *
 *   const T = table(v, { x, y, cols, rows });
 *   rows(v, T, [ { t: 3, slot: [...] , bg: [...] }, ... ], [showAt, hideAt]);
 *   const code = codePanel(v, { x, y, lines });
 *   code.at([{ t: 2, on: [0, 1] }, ...], [showAt, hideAt]);
 *
 * Every row is an absolutely positioned div; keyframes move rows between
 * slots (row positions), hide them (slot null), tint them, show/hide
 * columns, and fill in cell values, all as functions of time.
 */
import { type Video, prog, smooth, lerp, span } from "./engine";

export type Val = string | number | null;
export type Col = { key: string; w: number; align?: "left" | "right" | "center" };
export type TableOpts = {
  x: number;
  y: number;
  cols: Col[];
  rows: Val[][];
  rowH?: number;
  size?: number;
  title?: string;
  titleColor?: string;
  headBg?: string;
  border?: string;
};
export type Table = ReturnType<typeof table>;

export const fmtVal = (v: Val) => (v === null ? "NULL" : typeof v === "number" ? (Number.isInteger(v) ? String(v) : v.toFixed(2)) : v);

export function table(v: Video, o: TableOpts) {
  const { C } = v;
  const dark = C.bg === "#000000";
  const rowH = o.rowH ?? 44;
  const size = o.size ?? 24;
  const headH = rowH;
  const titleH = o.title ? size * 1.7 : 0;
  const width = o.cols.reduce((a, c) => a + c.w, 0);
  const stage = document.getElementById("stage") as HTMLDivElement;
  const root = document.createElement("div");
  root.style.cssText = `position:absolute;left:${o.x}px;top:${o.y}px;width:${width}px;opacity:0;font-family:Jost,'Helvetica Neue',Arial,sans-serif;font-size:${size}px;`;
  stage.appendChild(root);
  if (o.title) {
    const t = document.createElement("div");
    t.textContent = o.title;
    t.style.cssText = `position:absolute;left:0;top:0;font-weight:600;color:${o.titleColor ?? C.ink};font-size:${size * 1.05}px;`;
    root.appendChild(t);
  }
  const border = o.border ?? (dark ? "#3a3a3a" : "#CBD5E1");
  const head = document.createElement("div");
  head.style.cssText = `position:absolute;left:0;top:${titleH}px;width:${width}px;height:${headH}px;display:flex;align-items:center;background:${o.headBg ?? (dark ? "#1b1b1b" : "#E2E8F0")};border-bottom:2px solid ${border};font-weight:600;`;
  root.appendChild(head);
  const headCells = o.cols.map((c) => {
    const d = document.createElement("div");
    d.textContent = c.key;
    d.style.cssText = `width:${c.w}px;padding:0 12px;box-sizing:border-box;text-align:${c.align ?? "left"};white-space:nowrap;overflow:hidden;color:${dark ? C.ink : "#0F172A"};`;
    head.appendChild(d);
    return d;
  });
  const rowEls: HTMLDivElement[] = [];
  const cells: HTMLDivElement[][] = [];
  o.rows.forEach((r, i) => {
    const d = document.createElement("div");
    d.style.cssText = `position:absolute;left:0;top:0;width:${width}px;height:${rowH}px;display:flex;align-items:center;border-bottom:1px solid ${border};transform:translateY(${titleH + headH + i * rowH}px);`;
    root.appendChild(d);
    rowEls.push(d);
    cells.push(
      o.cols.map((c, j) => {
        const e = document.createElement("div");
        e.textContent = fmtVal(r[j] ?? null);
        e.style.cssText = `width:${c.w}px;padding:0 12px;box-sizing:border-box;text-align:${c.align ?? "left"};white-space:nowrap;overflow:hidden;${r[j] === null ? `color:${C.dim};font-style:italic;` : ""}`;
        d.appendChild(e);
        return e;
      })
    );
  });
  const slotY = (k: number) => titleH + headH + k * rowH;
  return { root, head, headCells, rowEls, cells, rowH, headH, titleH, width, slotY, n: o.rows.length, x: o.x, y: o.y, cols: o.cols };
}

export type RowKey = {
  t: number;
  /** new slot for each row (null = hidden) */
  slot?: (number | null)[];
  /** row background (null = none) */
  bg?: (string | null)[];
  /** dimmed rows (true = faded but visible) */
  dim?: boolean[];
  /** visible columns */
  cols?: boolean[];
  /** cell text overrides: [row, col, value] */
  set?: [number, number, Val][];
  dur?: number;
};
type State = { slot: (number | null)[]; bg: (string | null)[]; dim: boolean[]; cols: boolean[]; text: Map<string, Val> };

/** Drive a table's rows through keyframes; the whole table is visible during [a, b]. */
export function rows(v: Video, T: Table, keys: RowKey[], when: [number, number], fadeIn = 0.6) {
  const init: State = { slot: T.rowEls.map((_, i) => i), bg: T.rowEls.map(() => null), dim: T.rowEls.map(() => false), cols: T.cols.map(() => true), text: new Map() };
  const states: State[] = [init];
  const sorted = [...keys].sort((a, b) => a.t - b.t);
  for (const k of sorted) {
    const p = states[states.length - 1];
    const text = new Map(p.text);
    for (const [r, c, val] of k.set ?? []) text.set(`${r},${c}`, val);
    states.push({ slot: k.slot ?? p.slot, bg: k.bg ?? p.bg, dim: k.dim ?? p.dim, cols: k.cols ?? p.cols, text });
  }
  const orig = T.cells.map((row) => row.map((c) => c.textContent));
  v.frame((t) => {
    T.root.style.opacity = String(span(t, when[0], when[1], fadeIn));
    let k = 0;
    while (k < sorted.length && sorted[k].t <= t) k++;
    const cur = states[k];
    const prev = states[Math.max(0, k - 1)];
    const p = k === 0 ? 1 : smooth(prog(t, sorted[k - 1].t, sorted[k - 1].dur ?? 0.8));
    T.rowEls.forEach((el, i) => {
      const a = prev.slot[i];
      const b = cur.slot[i];
      const ya = a === null ? (b === null ? 0 : T.slotY(b)) : T.slotY(a);
      const yb = b === null ? ya : T.slotY(b);
      const oa = (a === null ? 0 : 1) * (prev.dim[i] ? 0.22 : 1);
      const ob = (b === null ? 0 : 1) * (cur.dim[i] ? 0.22 : 1);
      el.style.transform = `translateY(${lerp(ya, yb, p)}px)`;
      el.style.opacity = String(lerp(oa, ob, p));
      const bg = p > 0.5 ? cur.bg[i] : prev.bg[i];
      el.style.background = bg ?? "transparent";
      T.cells[i].forEach((c, j) => {
        const key = `${i},${j}`;
        const now = cur.text.has(key) ? cur.text.get(key)! : null;
        const before = prev.text.has(key) ? prev.text.get(key)! : null;
        const txt = p > 0.5 ? (cur.text.has(key) ? fmtVal(now) : orig[i][j]) : prev.text.has(key) ? fmtVal(before) : orig[i][j];
        if (c.textContent !== txt) c.textContent = txt;
      });
    });
    T.cols.forEach((c, j) => {
      const op = lerp(prev.cols[j] ? 1 : 0, cur.cols[j] ? 1 : 0, p);
      const w = `${c.w * op}px`;
      const pad = `0 ${12 * op}px`;
      for (const e of [T.headCells[j], ...T.cells.map((r) => r[j])]) {
        e.style.opacity = String(op);
        e.style.width = w;
        e.style.padding = pad;
      }
    });
  });
}

/** A SQL code panel; keyframes choose which lines are lit (others dim). */
export function codePanel(v: Video, o: { x: number; y: number; lines: string[]; size?: number; width?: number }) {
  const { C } = v;
  const dark = C.bg === "#000000";
  const size = o.size ?? 30;
  const stage = document.getElementById("stage") as HTMLDivElement;
  const root = document.createElement("div");
  root.style.cssText = `position:absolute;left:${o.x}px;top:${o.y}px;${o.width ? `width:${o.width}px;` : ""}opacity:0;font-family:'DejaVu Sans Mono',monospace;font-size:${size}px;line-height:1.55;padding:18px 24px;border-radius:12px;background:${dark ? "#111827" : "#0F172A"};color:#E5E7EB;white-space:pre;`;
  stage.appendChild(root);
  const KW = /\b(SELECT|FROM|WHERE|AND|OR|NOT|IN|IS|NULL|AS|ON|JOIN|LEFT|RIGHT|FULL|OUTER|INNER|CROSS|GROUP|BY|ORDER|HAVING|LIMIT|DISTINCT|CASE|WHEN|THEN|ELSE|END|WITH|RECURSIVE|UNION|ALL|OVER|PARTITION|ROWS|BETWEEN|PRECEDING|FOLLOWING|CURRENT|ROW|ASC|DESC|LIKE|EXISTS|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|EXPLAIN|USING|QUALIFY|FILTER|INTERVAL|COALESCE)\b/g;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const lineEls = o.lines.map((l) => {
    const d = document.createElement("div");
    d.innerHTML =
      esc(l)
        .replace(/('[^']*')/g, '<span style="color:#FCD34D">$1</span>')
        .replace(KW, '<span style="color:#7DD3FC;font-weight:600">$1</span>')
        .replace(/(--.*)$/, '<span style="color:#94A3B8">$1</span>') || "&nbsp;";
    d.style.transition = "none";
    root.appendChild(d);
    return d;
  });
  return {
    root,
    lineEls,
    at(keys: { t: number; on: number[] | "all" }[], when: [number, number]) {
      const ks = [...keys].sort((a, b) => a.t - b.t);
      v.frame((t) => {
        root.style.opacity = String(span(t, when[0], when[1], 0.6));
        let on: number[] | "all" = "all";
        for (const k of ks) if (k.t <= t) on = k.on;
        lineEls.forEach((el, i) => {
          const lit = on === "all" || on.includes(i);
          el.style.opacity = lit ? "1" : "0.28";
          el.style.background = on !== "all" && lit ? "rgba(125,211,252,0.13)" : "transparent";
        });
      });
    },
  };
}

/** A straight connector between two points, visible during [a, b], drawn on over `d` seconds. */
export function connector(v: Video, from: [number, number], to: [number, number], color: string, a: number, b: number, d = 0.5, width = 3) {
  const l = v.s("line", { x1: from[0], y1: from[1], x2: from[0], y2: from[1], stroke: color, "stroke-width": width, opacity: 0 });
  v.frame((t) => {
    const g = smooth(prog(t, a, d));
    v.set(l, { x2: lerp(from[0], to[0], g), y2: lerp(from[1], to[1], g), opacity: span(t, a, b, 0.3) });
  });
  return l;
}

/** Light-theme intuition video shell: title card, persistent header, captions, end card. */
export function shorts(v: Video, title: string, tagline: string, oneLineIntro: string, oneLine: [string, string], captions: [number, number, string][], end = 41) {
  const { C, W, text, life, s, set, frame } = v;
  const TEAL = "#007A7A";
  life(text("Data science, one concept at a time", { x: W / 2, y: 400 }, { size: 30, ax: 0.5, color: TEAL, weight: 500 }), 0.2, 4.4, "fade", 0.8);
  life(text(title, { x: W / 2, y: 460 }, { size: title.length > 18 ? 72 : 90, ax: 0.5, weight: 600 }), 0.3, 4.4, "fade", 0.9);
  life(text(tagline, { x: W / 2, y: 600 }, { size: 36, ax: 0.5, color: C.dim }), 0.6, 4.4, "fade", 0.9);
  life(text(title, { x: 100, y: 60 }, { size: 52, weight: 600 }), 4.4, end, "fade", 0.6);
  const bar = s("rect", { x: 100, y: 134, width: 0, height: 6, fill: TEAL });
  frame((t) => set(bar, { width: 90 * smooth(prog(t, 4.6, 0.6)), opacity: 1 - prog(t, end, 0.5) }));
  for (const [a, b, str] of captions) life(text(str, { x: W / 2, y: 985 }, { size: 32, ax: 0.5, weight: 500, width: 960, align: "center" }), a, b, "fade", 0.35);
  life(text(oneLineIntro, { x: W / 2, y: 300 }, { size: 34, ax: 0.5, color: C.dim }), end + 0.4, end + 7, "fade");
  life(text(oneLine[0], { x: W / 2, y: 380 }, { size: 54, ax: 0.5, weight: 600 }), end + 0.6, end + 7, "fade");
  life(text(oneLine[1], { x: W / 2, y: 460 }, { size: 54, ax: 0.5, weight: 600 }), end + 0.7, end + 7, "fade");
  life(text("Arjun Chidambaram Subbiah", { x: W / 2, y: 760 }, { size: 38, ax: 0.5, weight: 600 }), end + 1.4, end + 7, "fade");
  life(text("Data science, one concept at a time", { x: W / 2, y: 815 }, { size: 28, ax: 0.5, color: TEAL }), end + 1.7, end + 7, "fade");
  life(text("arjunchidambaram.github.io", { x: W / 2, y: 930 }, { size: 26, ax: 0.5, color: C.dim }), end + 2, end + 7, "fade");
}
