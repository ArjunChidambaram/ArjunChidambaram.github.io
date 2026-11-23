/**
 * Timeline engine for explainer videos.
 *
 * Every element's state is a function of time t, so a page can be stepped
 * frame by frame (window.setTime) and screenshotted into a video. Text and
 * math are KaTeX; plots are SVG.
 *
 *   const v = createVideo({ theme: "dark", width: 1920, height: 1080, duration: 100 });
 *   v.life(v.tex("\\hat y = \\beta_0", { x: 100, y: 100 }), 1, 9);
 *   v.frame((t) => { ...update svg attributes... });
 *   v.ready();
 */
import katex from "katex";

export type Style = "write" | "fade" | "pop";
export type Pos = { x: number; y: number; s?: number };
export type Item = {
  el: HTMLElement;
  ins: { t: number; d: number; style: Style }[];
  outs: { t: number; d: number }[];
  moves: { t: number; d: number; to: Pos }[];
  base: Required<Pos>;
  ax: number;
  ay: number;
};
export type AddOpts = {
  size?: number;
  ax?: number;
  ay?: number;
  color?: string;
  width?: number;
  align?: string;
  weight?: number;
  font?: string;
};

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const prog = (t: number, a: number, d: number) => (d <= 0 ? (t >= a ? 1 : 0) : clamp((t - a) / d));
export const smooth = (p: number) => p * p * (3 - 2 * p);
export const easeOut = (p: number) => 1 - (1 - p) ** 3;
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const fmt = (n: number, d = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
/** visible between a and b with fades */
export const span = (t: number, a: number, b: number, d = 0.4) => Math.min(prog(t, a, d), 1 - prog(t, b, d));

export const DARK = {
  bg: "#000000",
  ink: "#FFFFFF",
  dim: "#9AA0A6",
  grid: "#2A2A2A",
  blue: "#58C4DD",
  orange: "#FF862F",
  red: "#FC6255",
  green: "#83C167",
  purple: "#C77DFF",
  yellow: "#F4D35E",
  teal: "#5CD0B3",
  pink: "#E07A9F",
};
export const LIGHT = {
  bg: "#F9FAFB",
  ink: "#0F172A",
  dim: "#64748B",
  grid: "#E2E8F0",
  blue: "#2B8CBE",
  orange: "#E8772E",
  red: "#E2483D",
  green: "#3E9B4F",
  purple: "#9B59D0",
  yellow: "#D4A017",
  teal: "#007A7A",
  pink: "#C2507A",
};
export type Palette = typeof DARK;

const tightCommas = (m: string) => m.replace(/(\d),(\d)/g, "$1{,}$2");

export function createVideo(opts: {
  theme: "dark" | "light";
  width: number;
  height: number;
  duration: number;
  macros?: Record<string, string>;
}) {
  const C: Palette = opts.theme === "dark" ? DARK : LIGHT;
  const W = opts.width;
  const H = opts.height;
  const textFont = opts.theme === "dark" ? "KaTeX_Main, serif" : "Jost, 'Helvetica Neue', Arial, sans-serif";
  const macros: Record<string, string> = { ...(opts.macros ?? {}) };
  // colour helpers usable in any tex string: \cB{..} \cO{..} \cR{..} \cG{..} \cP{..} \cY{..} \cT{..} \cK{..}
  const helper: Record<string, keyof Palette> = { cB: "blue", cO: "orange", cR: "red", cG: "green", cP: "purple", cY: "yellow", cT: "teal", cK: "pink", cD: "dim" };
  for (const [k, c] of Object.entries(helper)) macros["\\" + k] = `\\textcolor{#${C[c]}}{#1}`;

  const items: Item[] = [];
  const hooks: ((t: number) => void)[] = [];

  const stage = document.getElementById("stage") as HTMLDivElement;
  stage.style.cssText = `position:relative;width:${W}px;height:${H}px;background:${C.bg};overflow:hidden;color:${C.ink};font-family:${textFont};`;

  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width", String(W));
  svg.setAttribute("height", String(H));
  svg.style.cssText = "position:absolute;left:0;top:0;pointer-events:none;";
  stage.appendChild(svg);

  const K = (s: string, display = false) =>
    katex.renderToString(tightCommas(s), { macros, throwOnError: false, displayMode: display });

  function renderMixed(s: string) {
    return s
      .split(/(\$[^$]+\$)/g)
      .map((part) =>
        part.startsWith("$")
          ? K(part.slice(1, -1))
          : part.replace(/\{([a-z]+):([^}]+)\}/g, (_, k, w) => `<span style="color:${(C as any)[k] ?? k}">${w}</span>`)
      )
      .join("");
  }

  function add(html: string, pos: Pos, o: AddOpts = {}): Item {
    const el = document.createElement("div");
    el.innerHTML = html;
    el.style.cssText = `position:absolute;left:0;top:0;white-space:${o.width ? "normal" : "nowrap"};font-size:${o.size ?? 40}px;color:${
      o.color ?? C.ink
    };line-height:1.35;${o.width ? `width:${o.width}px;` : ""}text-align:${o.align ?? "left"};font-weight:${o.weight ?? 400};${
      o.font ? `font-family:${o.font};` : ""
    }opacity:0;will-change:transform,opacity,clip-path;`;
    stage.appendChild(el);
    const it: Item = { el, ins: [], outs: [], moves: [], base: { s: 1, ...pos } as Required<Pos>, ax: o.ax ?? 0, ay: o.ay ?? 0 };
    items.push(it);
    return it;
  }
  const tex = (s: string, pos: Pos, o: AddOpts = {}) => add(K(s), pos, o);
  const text = (s: string, pos: Pos, o: AddOpts = {}) => add(renderMixed(s), pos, o);
  const html = (h: string, pos: Pos, o: AddOpts = {}) => add(h, pos, o);

  const show = (it: Item, t: number, d = 0.8, style: Style = "write") => (it.ins.push({ t, d, style }), it);
  const hide = (it: Item, t: number, d = 0.5) => (it.outs.push({ t, d }), it);
  const move = (it: Item, t: number, d: number, to: Pos) => (it.moves.push({ t, d, to }), it);
  const life = (it: Item, a: number, b: number, style: Style = "write", d = 0.8) => hide(show(it, a, d, style), b);

  function s<K2 extends keyof SVGElementTagNameMap>(tag: K2, attrs: Record<string, string | number>, parent: SVGElement = svg) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    parent.appendChild(e);
    return e as SVGElementTagNameMap[K2];
  }
  const set = (e: Element, attrs: Record<string, string | number>) => {
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  };

  function apply(t: number) {
    for (const it of items) {
      let p = 0;
      let style: Style = "fade";
      let since = -Infinity;
      for (const a of it.ins)
        if (t >= a.t) {
          p = prog(t, a.t, a.d);
          style = a.style;
          since = a.t;
        }
      for (const o of it.outs) if (t >= o.t && o.t >= since) p = Math.min(p, 1 - prog(t, o.t, o.d));
      let pos = { ...it.base };
      for (const m of it.moves) {
        const q = smooth(prog(t, m.t, m.d));
        if (q > 0) pos = { x: lerp(pos.x, m.to.x, q), y: lerp(pos.y, m.to.y, q), s: lerp(pos.s, m.to.s ?? pos.s, q) };
      }
      const el = it.el;
      if (p <= 0) {
        el.style.opacity = "0";
        continue;
      }
      let scale = pos.s;
      let clip = "none";
      let op = p;
      const sp = smooth(p);
      if (style === "write") {
        clip = p < 1 ? `inset(-20% ${(1 - sp) * 100}% -20% -5%)` : "none";
        op = Math.min(1, p * 2.5);
      } else if (style === "pop") {
        scale *= 0.6 + 0.4 * sp + Math.sin(sp * Math.PI) * 0.12;
        op = sp;
      }
      el.style.opacity = String(op);
      el.style.clipPath = clip;
      el.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(${-it.ax * 100}%, ${-it.ay * 100}%) scale(${scale})`;
      el.style.transformOrigin = `${it.ax * 100}% ${it.ay * 100}%`;
    }
  }

  /** Two-line section title, top-left (Manim-reference layout). */
  function sectionTitle(a: string, b: string, t0: number, t1: number, x = 70) {
    life(text(a, { x, y: 70 }, { size: 44 }), t0, t1, "write", 0.9);
    life(text(b, { x, y: 128 }, { size: 44 }), t0 + 0.2, t1, "write", 0.9);
  }
  /** Vertical divider between the left panel and the right area, drawn on during [a, b]. */
  function divider(spans: [number, number][], x = 720) {
    const d = s("line", { x1: x, y1: 70, x2: x, y2: 70, stroke: C.ink, "stroke-width": 2, opacity: 0 });
    hooks.push((t) => {
      let vis = 0;
      let grow = 0;
      for (const [a, b] of spans) {
        const v = span(t, a, b, 0.5);
        if (v > vis) {
          vis = v;
          grow = smooth(prog(t, a, 0.8));
        }
      }
      set(d, { opacity: vis, y2: 70 + (H - 140) * grow });
    });
  }
  /** Centred title with an underline that draws outward. */
  function centerTitle(str: string, t0: number, t1: number, y = 70, size = 50, half = 520) {
    life(text(str, { x: W / 2, y }, { size, ax: 0.5 }), t0, t1, "write", 1);
    const rule = s("line", { x1: W / 2, y1: y + size * 1.55, x2: W / 2, y2: y + size * 1.55, stroke: C.ink, "stroke-width": 2 });
    hooks.push((t) => {
      const g = smooth(prog(t, t0 + 0.3, 0.8)) * (1 - prog(t, t1, 0.5));
      set(rule, { x1: W / 2 - half * g, x2: W / 2 + half * g, opacity: g > 0 ? 1 : 0 });
    });
  }
  /** Name card at the end. */
  function endCard(t0: number, t1: number, lines: { tex?: string; text?: string; size?: number; color?: string; y: number }[]) {
    lines.forEach((l, i) => {
      const it = l.tex
        ? tex(l.tex, { x: W / 2, y: l.y }, { size: l.size ?? 60, ax: 0.5 })
        : text(l.text!, { x: W / 2, y: l.y }, { size: l.size ?? 40, ax: 0.5, color: l.color });
      life(it, t0 + i * 0.4, t1 + 1, l.tex ? "write" : "fade", 1);
    });
  }

  function setTime(t: number) {
    apply(t);
    for (const h of hooks) h(t);
  }
  function ready() {
    (window as any).setTime = setTime;
    (window as any).DURATION = opts.duration;
    (window as any).SIZE = [W, H];
    setTime(0);
  }

  return {
    C, W, H, K, add, tex, text, html, show, hide, move, life, s, set, svg,
    frame: (f: (t: number) => void) => hooks.push(f),
    sectionTitle, divider, centerTitle, endCard, ready,
  };
}
export type Video = ReturnType<typeof createVideo>;

/** A simple 2-D plot frame (axes, ticks, labels) that maps data to pixels. */
export function plotFrame(
  v: Video,
  box: { left: number; right: number; top: number; bottom: number },
  xr: [number, number],
  yr: [number, number],
  o: {
    xticks?: number[];
    yticks?: number[];
    xfmt?: (n: number) => string;
    yfmt?: (n: number) => string;
    xlabel?: string;
    ylabel?: string;
    spans: [number, number][];
    grid?: boolean;
    /** use the body font for tick labels instead of KaTeX */
    plainTicks?: boolean;
    tickColor?: string;
  }
) {
  const { C } = v;
  const px = (x: number) => box.left + ((x - xr[0]) / (xr[1] - xr[0])) * (box.right - box.left);
  const py = (y: number) => box.bottom - ((y - yr[0]) / (yr[1] - yr[0])) * (box.bottom - box.top);
  const g = v.s("g", { opacity: 0 });
  if (o.grid)
    for (const y of o.yticks ?? []) v.s("line", { x1: box.left, x2: box.right, y1: py(y), y2: py(y), stroke: C.grid, "stroke-width": 1.5 }, g);
  const ax = v.s("line", { x1: box.left, y1: box.bottom, x2: box.left, y2: box.bottom, stroke: C.ink, "stroke-width": 2.5 }, g);
  const ay = v.s("line", { x1: box.left, y1: box.bottom, x2: box.left, y2: box.bottom, stroke: C.ink, "stroke-width": 2.5 }, g);
  for (const x of o.xticks ?? []) v.s("line", { x1: px(x), y1: box.bottom - 7, x2: px(x), y2: box.bottom + 7, stroke: C.ink, "stroke-width": 2 }, g);
  for (const y of o.yticks ?? []) v.s("line", { x1: box.left - 7, y1: py(y), x2: box.left + 7, y2: py(y), stroke: C.ink, "stroke-width": 2 }, g);
  const labels: Item[] = [];
  const tick = (str: string, pos: { x: number; y: number }, a: { ax: number; ay?: number }) =>
    o.plainTicks ? v.text(str, pos, { size: 24, color: o.tickColor ?? C.dim, ...a }) : v.tex(str, pos, { size: 24, ...a });
  for (const x of o.xticks ?? []) labels.push(tick(o.xfmt ? o.xfmt(x) : String(x), { x: px(x), y: box.bottom + 18 }, { ax: 0.5 }));
  for (const y of o.yticks ?? []) labels.push(tick(o.yfmt ? o.yfmt(y) : String(y), { x: box.left - 16, y: py(y) }, { ax: 1, ay: 0.5 }));
  if (o.xlabel) labels.push(v.text(o.xlabel, { x: (box.left + box.right) / 2, y: box.bottom + 58 }, { size: 28, ax: 0.5, color: o.plainTicks ? C.dim : undefined }));
  if (o.ylabel) labels.push(v.text(o.ylabel, { x: box.left - 60, y: box.top - 50 }, { size: 28, color: o.plainTicks ? C.dim : undefined }));
  for (const l of labels) for (const [a, b] of o.spans) v.life(l, a + 0.6, b, "fade", 0.6);
  const clipId = "clip" + Math.random().toString(36).slice(2, 8);
  const cp = v.s("clipPath", { id: clipId }, g);
  v.s("rect", { x: box.left, y: box.top - 30, width: box.right - box.left + 20, height: box.bottom - box.top + 30 }, cp);
  const inner = v.s("g", { "clip-path": `url(#${clipId})` }, g);
  const top = v.s("g", {}, g);
  v.frame((t) => {
    let vis = 0;
    let grow = 0;
    for (const [a, b] of o.spans) {
      const s = span(t, a, b, 0.4);
      if (s > vis) {
        vis = s;
        grow = smooth(prog(t, a, 1));
      }
    }
    v.set(g, { opacity: vis });
    v.set(ax, { x2: box.left + (box.right - box.left) * grow });
    v.set(ay, { y2: box.bottom - (box.bottom - box.top + 20) * grow });
  });
  return { px, py, g, inner, top, box, visibleAt: (t: number) => o.spans.some(([a, b]) => t >= a - 0.5 && t <= b + 0.5) };
}
