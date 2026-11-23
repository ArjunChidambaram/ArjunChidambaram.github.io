import { createVideo, plotFrame, prog, smooth, span, easeOut } from "./engine";
import { CHECKS, STREAMS, OUR, PAGES, P_BUY, idxOf } from "../../../lib/explainers/stats";

const DURATION = 47;
const v = createVideo({ theme: "light", width: 1080, height: 1080, duration: DURATION });
const { C, W, text, life, s, set, frame } = v;
const TEAL = "#007A7A";
const GREEN = "#05CE91";
const BLUE = "#2B8CBE";
const ORANGE = "#E8772E";

life(text("Data science, one concept at a time", { x: W / 2, y: 400 }, { size: 30, ax: 0.5, color: TEAL, weight: 500 }), 0.2, 4.4, "fade", 0.8);
life(text("The Law of Large Numbers", { x: W / 2, y: 460 }, { size: 76, ax: 0.5, weight: 600 }), 0.3, 4.4, "fade", 0.9);
life(text("Why averages settle down", { x: W / 2, y: 590 }, { size: 36, ax: 0.5, color: C.dim }), 0.6, 4.4, "fade", 0.9);
life(text("The Law of Large Numbers", { x: 100, y: 70 }, { size: 52, weight: 600 }), 4.4, 41, "fade", 0.6);
const bar = s("rect", { x: 100, y: 146, width: 0, height: 6, fill: TEAL });
frame((t) => set(bar, { width: 90 * easeOut(prog(t, 4.6, 0.6)), opacity: 1 - prog(t, 41, 0.5) }));

const LOGF = ["1", "10", "100", "1,000", "10,000"];
const P = plotFrame(v, { left: 170, right: 990, top: 350, bottom: 850 }, [0, 4.35], [0, 0.4], {
  xticks: [0, 1, 2, 3, 4],
  yticks: [0, 0.1, 0.2, 0.3, 0.4],
  xfmt: (x) => LOGF[x],
  yfmt: (y) => `${Math.round(y * 100)}%`,
  xlabel: "Visitors so far",
  ylabel: "Conversion rate",
  spans: [[4.8, 41]],
  plainTicks: true,
});
const { px, py } = P;
const clip = s("clipPath", { id: "plotclip" });
s("rect", { x: px(0), y: py(0.4), width: px(4.35) - px(0), height: py(0) - py(0.4) }, clip);
const lx = (n: number) => px(Math.log10(n));
// ±2 SD funnel around the true rate
const funnel = s("path", { fill: GREEN, opacity: 0 }, P.inner);
{
  let up = "";
  let dn = "";
  for (let i = 0; i <= 100; i++) {
    const n = Math.pow(10, (4.35 * i) / 100);
    const sd = Math.sqrt((P_BUY * (1 - P_BUY)) / n);
    up += `${i ? "L" : "M"}${lx(n).toFixed(1)},${py(Math.min(0.4, P_BUY + 2 * sd)).toFixed(1)}`;
    dn = `L${lx(n).toFixed(1)},${py(Math.max(0, P_BUY - 2 * sd)).toFixed(1)}` + dn;
  }
  set(funnel, { d: up + dn + "Z" });
}
const truth = s("line", { x1: px(0), x2: px(4.35), y1: py(P_BUY), y2: py(P_BUY), stroke: ORANGE, "stroke-width": 3, "stroke-dasharray": "10 8", opacity: 0 }, P.top);
const others = STREAMS.map(() => s("path", { fill: "none", stroke: "#94A3B8", "stroke-width": 2, opacity: 0, "clip-path": "url(#plotclip)" }, P.inner));
const ours = s("path", { fill: "none", stroke: BLUE, "stroke-width": 4.5, "clip-path": "url(#plotclip)" }, P.inner);
const marks = [100, 10000].map(() => s("circle", { r: 0, fill: BLUE, stroke: "#fff", "stroke-width": 3 }, P.top));
const pages = PAGES.map((p) => s("circle", { cx: lx(p.n), cy: py(p.k / p.n), r: 0, fill: BLUE, stroke: "#fff", "stroke-width": 2 }, P.top));
const sorted = PAGES.map((p, i) => i).sort((a, b) => PAGES[b].k / PAGES[b].n - PAGES[a].k / PAGES[a].n);
const extremes = new Set([...sorted.slice(0, 3), ...sorted.slice(-3)]);
const head = v.html("", { x: 100, y: 196 }, { size: 28 });
life(head, 5, 41, "fade", 0.3);

const path = (st: number, upTo: number) => {
  let d = "";
  const r = STREAMS[st].rate;
  for (let i = 0; i < CHECKS.length && CHECKS[i] <= upTo; i++) d += `${i ? "L" : "M"}${lx(CHECKS[i]).toFixed(1)},${py(r[i]).toFixed(1)}`;
  return d;
};
const nAt = (t: number) => Math.max(1, Math.round(Math.pow(10, 4 * smooth(prog(t, 5.6, 8.4)))));
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

frame((t) => {
  const fade = 1 - prog(t, 41, 0.5);
  const streamsOn = span(t, 5, 33, 0.5) * fade;
  const n = nAt(t);
  set(ours, { d: path(OUR, n), opacity: streamsOn });
  set(truth, { opacity: span(t, 7, 41, 0.5) * fade });
  others.forEach((o, j) => set(o, { d: j === OUR ? "" : path(j, 10000), opacity: 0.55 * span(t, 15.4 + j * 0.08, 33, 0.4) }));
  set(funnel, { opacity: 0.16 * span(t, 19, 41, 0.5) * fade });
  const mk = span(t, 24.6, 33, 0.3) * fade;
  [100, 10000].forEach((m, k) => set(marks[k], { cx: lx(m), cy: py(STREAMS[OUR].rate[idxOf(m)]), r: 10 * mk * (k === 0 || t > 27 ? 1 : 0) }));
  const pv = span(t, 33.4, 41, 0.4) * fade;
  pages.forEach((c, i) => set(c, { r: 9 * pv * (i / PAGES.length < prog(t, 33.4, 1.5) ? 1 : 0), fill: t > 36.4 && extremes.has(i) ? ORANGE : BLUE }));

  const ci = CHECKS.findIndex((c) => c >= n);
  if (t < 15.2) {
    const k = STREAMS[OUR].buyers[ci];
    const nn = CHECKS[ci];
    head.el.innerHTML = `<span style="color:${C.dim}">Visitors</span> <b>${nn.toLocaleString("en-US")}</b>&nbsp;&nbsp;<span style="color:${C.dim}">buyers</span> <b>${k.toLocaleString("en-US")}</b>&nbsp;&nbsp;<span style="color:${C.dim}">rate</span> <b style="color:${BLUE};font-size:36px">${pct(k / nn)}</b>`;
  } else if (t < 24.4) head.el.innerHTML = `<span style="color:${C.dim}">30 replays of the same page. All start wild,</span> <b>all end near 10%</b>`;
  else if (t < 33.2) {
    const a = STREAMS[OUR].buyers[idxOf(100)];
    const b = STREAMS[OUR].buyers[idxOf(10000)];
    head.el.innerHTML = `<div><span style="color:${C.dim}">After 100:</span> <b>${a}</b> <span style="color:${C.dim}">buyers,</span> <b>+${a - 10}</b> <span style="color:${C.dim}">extra → rate</span> <b style="color:${BLUE}">${pct(a / 100)}</b></div>${
      t > 27 ? `<div style="margin-top:6px"><span style="color:${C.dim}">After 10,000:</span> <b>${b.toLocaleString("en-US")}</b> <span style="color:${C.dim}">buyers,</span> <b>+${b - 1000}</b> <span style="color:${C.dim}">extra → rate</span> <b style="color:${BLUE}">${pct(b / 10000)}</b></div>` : ""
    }`;
  } else head.el.innerHTML = `<span style="color:${C.dim}">${PAGES.length} product pages, all truly 10%.</span>${t > 36.4 ? ` <b style="color:${ORANGE}">The extremes are all small.</b>` : ""}`;
});

const CAP: [number, number, string][] = [
  [5, 15.2, "Early on, the rate swings wildly."],
  [15.4, 24.4, "With more visitors, every run settles on the truth."],
  [24.6, 33.2, "The lucky streak isn't undone. It's diluted."],
  [33.4, 41, "Small samples produce the most extreme results."],
];
for (const [a, b, str] of CAP) life(text(str, { x: W / 2, y: 975 }, { size: 32, ax: 0.5, weight: 500 }), a, b, "fade", 0.35);

life(text("The law in one line", { x: W / 2, y: 300 }, { size: 34, ax: 0.5, color: C.dim }), 41.4, 48, "fade");
life(text("Average enough independent draws", { x: W / 2, y: 380 }, { size: 52, ax: 0.5, weight: 600 }), 41.6, 48, "fade");
life(text("and you get the true mean.", { x: W / 2, y: 455 }, { size: 52, ax: 0.5, weight: 600 }), 41.7, 48, "fade");
life(text("Arjun Chidambaram Subbiah", { x: W / 2, y: 760 }, { size: 38, ax: 0.5, weight: 600 }), 42.4, 48, "fade");
life(text("Data science, one concept at a time", { x: W / 2, y: 815 }, { size: 28, ax: 0.5, color: TEAL }), 42.7, 48, "fade");
life(text("arjunchidambaram.github.io", { x: W / 2, y: 930 }, { size: 26, ax: 0.5, color: C.dim }), 43, 48, "fade");

v.ready();
