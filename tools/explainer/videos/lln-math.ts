import { createVideo, plotFrame, prog, smooth, span } from "./engine";
import { CHECKS, STREAMS, OUR, PAGES, P_BUY, idxOf, tailProb, chebyshev } from "../../../lib/explainers/stats";

const DURATION = 112;
const v = createVideo({
  theme: "dark",
  width: 1920,
  height: 1080,
  duration: DURATION,
  macros: {
    "\\pp": "\\textcolor{#F4D35E}{p}",
    "\\nn": "\\textcolor{#58C4DD}{n}",
    "\\Xn": "\\textcolor{#83C167}{\\bar{X}_n}",
    "\\ee": "\\textcolor{#E07A9F}{\\varepsilon}",
  },
});
const { C, W, tex, text, life, s, set, frame } = v;
const EPS = 0.02;
const LOGF = ["1", "10", "100", "1,000", "10,000"];
const ours = STREAMS[OUR];
const at = (n: number) => idxOf(n);
const fmtP = (x: number) => (x < 1e-4 ? "\\lt 0.0001" : "= " + x.toFixed(4));

// ---------------- 1: title (0 – 9) ----------------
v.centerTitle("The Law of Large Numbers", 0.2, 8.4, 70, 64, 760);
life(text("Why does a measured conversion rate {green:settle down}?", { x: W / 2, y: 330 }, { size: 38, ax: 0.5 }), 1.4, 8.4, "fade");
life(text("And how fast? And what does it {red:not} promise?", { x: W / 2, y: 400 }, { size: 38, ax: 0.5 }), 3.2, 8.4, "fade");

v.divider([[9.2, 101.6]]);

// ---------------- plots ----------------
const box = { left: 1100, right: 1830, top: 200, bottom: 860 };
const A = plotFrame(v, box, [0, 4.35], [0, 0.4], {
  xticks: [0, 1, 2, 3, 4],
  yticks: [0, 0.1, 0.2, 0.3, 0.4],
  xfmt: (x) => LOGF[x],
  yfmt: (y) => `${Math.round(y * 100)}%`,
  xlabel: "visitors $\\nn$ (log scale)",
  ylabel: "running rate $\\Xn$",
  spans: [[9.6, 63.6]],
  plainTicks: true,
});
const clip = s("clipPath", { id: "cA" });
s("rect", { x: box.left, y: box.top, width: box.right - box.left, height: box.bottom - box.top }, clip);
const lx = (n: number) => A.px(Math.log10(n));
const truth = s("line", { x1: A.px(0), x2: A.px(4.35), y1: A.py(P_BUY), y2: A.py(P_BUY), stroke: C.yellow, "stroke-width": 3, "stroke-dasharray": "10 8", opacity: 0 }, A.top);
const band = s("rect", { x: A.px(0), width: A.px(4.35) - A.px(0), y: A.py(P_BUY + EPS), height: A.py(P_BUY - EPS) - A.py(P_BUY + EPS), fill: C.pink, opacity: 0 }, A.inner);
const thin = STREAMS.map(() => s("path", { fill: "none", stroke: "#777", "stroke-width": 1.6, opacity: 0, "clip-path": "url(#cA)" }, A.inner));
const main = s("path", { fill: "none", stroke: C.green, "stroke-width": 4, opacity: 0, "clip-path": "url(#cA)" }, A.inner);
const ratePath = (st: number, upTo = 1e9) => {
  let d = "";
  const r = STREAMS[st].rate;
  for (let i = 0; i < CHECKS.length && CHECKS[i] <= upTo; i++) d += `${i ? "L" : "M"}${lx(CHECKS[i]).toFixed(1)},${A.py(r[i]).toFixed(1)}`;
  return d;
};
const checkLines = [100, 1000, 10000].map(() => s("line", { stroke: C.blue, "stroke-width": 2, opacity: 0 }, A.top));
frame((t) => {
  const on = span(t, 9.6, 63.6);
  const n = Math.round(Math.pow(10, 4 * smooth(prog(t, 10.4, 6))));
  set(main, { d: ratePath(OUR, n), opacity: on });
  set(truth, { opacity: span(t, 12, 63.6) });
  thin.forEach((p, j) => set(p, { d: j === OUR ? "" : ratePath(j), opacity: 0.7 * span(t, 27 + j * 0.05, 63.6) }));
  set(band, { opacity: 0.22 * span(t, 29, 63.6) });
  [100, 1000, 10000].forEach((m, k) => set(checkLines[k], { x1: lx(m), x2: lx(m), y1: A.py(0), y2: A.py(0.4), opacity: 0.7 * span(t, 33 + k * 1.2, 63.6) }));
});

// ---------------- 2: setup (9 – 26) ----------------
v.sectionTitle("Law of Large Numbers:", "The Running Average", 9.2, 25.6);
life(text("Visitors $X_1, X_2, \\ldots$ independent, each 1 (buy) with prob. $\\pp = 0.1$", { x: 70, y: 250 }, { size: 26, width: 620 }), 9.8, 25.6, "fade");
life(tex("\\Xn = \\frac{X_1 + X_2 + \\cdots + X_{\\nn}}{\\nn}", { x: 70, y: 340 }, { size: 38 }), 10.6, 25.6, "write", 1.2);
life(text("the conversion rate after $\\nn$ visitors", { x: 70, y: 440 }, { size: 26, color: C.dim }), 11.6, 25.6, "fade");
life(tex("E[\\Xn] = \\pp", { x: 70, y: 520 }, { size: 34 }), 17, 25.6, "write", 0.8);
life(tex("\\operatorname{Var}(\\Xn) = \\frac{\\pp(1 - \\pp)}{\\nn} \\;\\to\\; 0", { x: 70, y: 590 }, { size: 34 }), 18.4, 25.6, "write", 1.2);
life(text("Right on average from the start, with a variance that shrinks to zero.", { x: 70, y: 720 }, { size: 28, width: 600 }), 21, 25.6, "fade");

// ---------------- 3: the law (26 – 44) ----------------
v.sectionTitle("Law of Large Numbers:", "The Statement", 26.2, 43.6);
life(text("For any margin $\\ee > 0$, however small:", { x: 70, y: 250 }, { size: 28 }), 26.8, 43.6, "fade");
life(tex("P\\big(|\\Xn - \\pp| > \\ee\\big) \\to 0 \\ \\text{as } \\nn \\to \\infty", { x: 70, y: 320 }, { size: 34 }), 27.4, 43.6, "write", 1.4);
life(text(`With $\\ee = 0.02$ (the {pink:pink band}, 8% to 12%), exactly:`, { x: 70, y: 450 }, { size: 26 }), 30, 43.6, "fade");
[100, 1000, 10000].forEach((n, k) =>
  life(tex(`\\nn = ${n.toLocaleString("en-US").replace(",", "{,}")}: \\quad P ${fmtP(tailProb(n, P_BUY, EPS))}`, { x: 90, y: 510 + k * 60 }, { size: 30 }), 33 + k * 1.2, 43.6, "write", 0.8)
);
life(text("The chance of being off by more than 2 points vanishes.", { x: 70, y: 740 }, { size: 26, color: C.dim, width: 600 }), 37.6, 43.6, "fade");

// ---------------- 4: Chebyshev (44 – 64) ----------------
v.sectionTitle("Law of Large Numbers:", "Why It Works", 44.2, 63.6);
life(text("{blue:Chebyshev's inequality}: big deviations are rare when variance is small.", { x: 70, y: 245 }, { size: 26, width: 620 }), 44.8, 63.6, "fade");
life(tex("P\\big(|\\Xn - \\pp| \\ge \\ee\\big) \\le \\frac{\\operatorname{Var}(\\Xn)}{\\ee^2} = \\frac{\\pp(1 - \\pp)}{\\nn\\,\\ee^2}", { x: 70, y: 330 }, { size: 32 }), 45.6, 63.6, "write", 1.4);
life(text("The right side goes to 0 as $\\nn$ grows. That's the whole proof.", { x: 70, y: 440 }, { size: 26, width: 600 }), 48, 63.6, "fade");
life(text("Bound vs exact, with $\\ee = 0.02$:", { x: 70, y: 520 }, { size: 26, color: C.dim }), 50, 63.6, "fade");
[100, 1000, 10000].forEach((n, k) => {
  const b = chebyshev(n, P_BUY, EPS);
  life(
    tex(`\\nn = ${n.toLocaleString("en-US").replace(",", "{,}")}: \\quad \\le ${b < 1 ? b.toFixed(4) : b.toFixed(2)} \\quad \\text{vs} \\quad ${fmtP(tailProb(n, P_BUY, EPS)).replace("= ", "")}`, { x: 90, y: 580 + k * 58 }, { size: 28 }),
    51 + k * 1.2,
    63.6,
    "write",
    0.8
  );
});
life(text("Loose (2.25 isn't even a probability), but it always holds.", { x: 70, y: 800 }, { size: 26, color: C.dim, width: 620 }), 55, 63.6, "fade");

// ---------------- 5: dilution (64 – 84) ----------------
v.sectionTitle("Law of Large Numbers:", "Dilution, Not Correction", 64.2, 83.6);
life(text("Our run had 18 buyers in its first 100 visitors: 8 extra.", { x: 70, y: 245 }, { size: 26, width: 620 }), 64.8, 83.6, "fade");
life(text("Does the page \"pay them back\"? No. The {orange:extra count} keeps wandering:", { x: 70, y: 300 }, { size: 26, width: 620 }), 65.6, 83.6, "fade");
life(tex("\\operatorname{SD}(K_{\\nn} - \\nn\\pp) = \\sqrt{\\nn\\pp(1 - \\pp)} \\quad \\text{grows}", { x: 70, y: 400 }, { size: 30 }), 67, 83.6, "write", 1);
life(text("but it's divided by an ever larger $\\nn$:", { x: 70, y: 480 }, { size: 26 }), 69, 83.6, "fade");
life(tex("\\operatorname{SD}(\\Xn - \\pp) = \\sqrt{\\pp(1 - \\pp) / \\nn} \\quad \\text{shrinks}", { x: 70, y: 550 }, { size: 30 }), 69.8, 83.6, "write", 1);
const ex = (n: number) => ours.buyers[at(n)] - n * P_BUY;
life(tex(`\\nn = 100: \\quad +${ex(100)} \\text{ buyers} \\;\\Rightarrow\\; ${((ours.rate[at(100)] - P_BUY) * 100).toFixed(1)} \\text{ points}`, { x: 90, y: 660 }, { size: 28 }), 73, 83.6, "write", 0.8);
life(tex(`\\nn = 10{,}000: \\quad +${ex(10000)} \\text{ buyers} \\;\\Rightarrow\\; ${((ours.rate[at(10000)] - P_BUY) * 100).toFixed(2)} \\text{ points}`, { x: 90, y: 720 }, { size: 28 }), 74.4, 83.6, "write", 0.8);
life(text("No memory, no compensation: the {red:gambler's fallacy} is wrong.", { x: 70, y: 810 }, { size: 26, width: 620 }), 77, 83.6, "fade");
{
  const B = plotFrame(v, box, [0, 4.35], [-100, 100], {
    xticks: [0, 1, 2, 3, 4],
    yticks: [-100, -50, 0, 50, 100],
    xfmt: (x) => LOGF[x],
    yfmt: (y) => (y > 0 ? `+${y}` : String(y)),
    xlabel: "visitors $\\nn$ (log scale)",
    ylabel: "extra buyers $K_{\\nn} - \\nn\\pp$",
    spans: [[64.4, 83.6]],
    plainTicks: true,
  });
  const bx = (n: number) => B.px(Math.log10(n));
  const fun = s("path", { fill: C.orange, opacity: 0 }, B.inner);
  let up = "";
  let dn = "";
  for (let i = 0; i <= 100; i++) {
    const n = Math.pow(10, (4.35 * i) / 100);
    const sd = Math.sqrt(n * P_BUY * (1 - P_BUY));
    up += `${i ? "L" : "M"}${bx(n).toFixed(1)},${B.py(2 * sd).toFixed(1)}`;
    dn = `L${bx(n).toFixed(1)},${B.py(-2 * sd).toFixed(1)}` + dn;
  }
  set(fun, { d: up + dn + "Z" });
  const ex2 = STREAMS.map((st, j) => {
    let d = "";
    CHECKS.forEach((c, i) => (d += `${i ? "L" : "M"}${bx(c).toFixed(1)},${B.py(st.buyers[i] - c * P_BUY).toFixed(1)}`));
    return s("path", { d, fill: "none", stroke: j === OUR ? C.green : "#777", "stroke-width": j === OUR ? 4 : 1.6, opacity: 0 }, j === OUR ? B.top : B.inner);
  });
  frame((t) => {
    set(fun, { opacity: 0.16 * span(t, 67, 83.6) });
    ex2.forEach((p, j) => set(p, { opacity: (j === OUR ? 1 : 0.7) * span(t, 65.6 + (j === OUR ? 0 : 1.4), 83.6) }));
  });
}

// ---------------- 6: small samples (84 – 102) ----------------
v.sectionTitle("Law of Large Numbers:", "Small Samples Mislead", 84.2, 101.6);
life(text(`${PAGES.length} product pages, all with the same true rate: 10%.`, { x: 70, y: 245 }, { size: 26, width: 620 }), 84.8, 101.6, "fade");
life(text("Rank them by measured rate. Who comes top and bottom?", { x: 70, y: 300 }, { size: 26, width: 620 }), 86, 101.6, "fade");
const sorted = PAGES.map((p, i) => i).sort((a, b) => PAGES[b].k / PAGES[b].n - PAGES[a].k / PAGES[a].n);
const top3 = sorted.slice(0, 3).map((i) => PAGES[i]);
const bot3 = sorted.slice(-3).map((i) => PAGES[i]);
life(text(`Top 3: ${top3.map((p) => `${p.k}/${p.n}`).join(", ")}`, { x: 70, y: 390 }, { size: 26, color: C.orange }), 89, 101.6, "fade");
life(text(`Bottom 3: ${bot3.map((p) => `${p.k}/${p.n}`).join(", ")}`, { x: 70, y: 440 }, { size: 26, color: C.orange }), 89.6, 101.6, "fade");
life(text("All tiny. The biggest pages hug 10%.", { x: 70, y: 500 }, { size: 26 }), 91, 101.6, "fade");
life(text("For A/B tests: an early, dramatic result on little traffic is {red:the least trustworthy kind}. Decide the sample size first.", { x: 70, y: 610 }, { size: 26, width: 600 }), 93.4, 101.6, "fade");
{
  const Cp = plotFrame(v, box, [1, 4.5], [0, 0.4], {
    xticks: [1, 2, 3, 4],
    yticks: [0, 0.1, 0.2, 0.3, 0.4],
    xfmt: (x) => LOGF[x],
    yfmt: (y) => `${Math.round(y * 100)}%`,
    xlabel: "visitors to the page (log scale)",
    ylabel: "measured rate",
    spans: [[84.4, 101.6]],
    plainTicks: true,
  });
  const cx = (n: number) => Cp.px(Math.log10(n));
  const fun = s("path", { fill: C.green, opacity: 0 }, Cp.inner);
  let up = "";
  let dn = "";
  for (let i = 0; i <= 100; i++) {
    const n = Math.pow(10, 1 + (3.5 * i) / 100);
    const sd = Math.sqrt((P_BUY * (1 - P_BUY)) / n);
    up += `${i ? "L" : "M"}${cx(n).toFixed(1)},${Cp.py(Math.min(0.4, P_BUY + 2 * sd)).toFixed(1)}`;
    dn = `L${cx(n).toFixed(1)},${Cp.py(Math.max(0, P_BUY - 2 * sd)).toFixed(1)}` + dn;
  }
  set(fun, { d: up + dn + "Z" });
  const ext = new Set([...sorted.slice(0, 3), ...sorted.slice(-3)]);
  const dots = PAGES.map((p) => s("circle", { cx: cx(p.n), cy: Cp.py(p.k / p.n), r: 0, fill: C.blue }, Cp.top));
  const tl = s("line", { x1: Cp.px(1), x2: Cp.px(4.5), y1: Cp.py(P_BUY), y2: Cp.py(P_BUY), stroke: C.yellow, "stroke-width": 3, "stroke-dasharray": "10 8", opacity: 0 }, Cp.top);
  frame((t) => {
    set(fun, { opacity: 0.14 * span(t, 91, 101.6) });
    set(tl, { opacity: span(t, 85, 101.6) });
    dots.forEach((d, i) => set(d, { r: 9 * span(t, 85.4 + i * 0.03, 101.6, 0.3), fill: t > 89 && ext.has(i) ? C.orange : C.blue }));
  });
}

// ---------------- 7: end (102 – 112) ----------------
v.endCard(102.4, 111, [
  { tex: "P\\big(|\\Xn - \\pp| > \\ee\\big) \\le \\frac{\\pp(1-\\pp)}{\\nn\\,\\ee^2} \\;\\longrightarrow\\; 0", size: 54, y: 230 },
  { text: "Averages settle by dilution, not by correction.", size: 36, y: 400 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
