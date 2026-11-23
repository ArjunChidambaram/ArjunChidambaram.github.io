import { createVideo, plotFrame, prog, smooth, span } from "./engine";
import { AB, AB_RESULT as R, AA_ZS, AA_EXAMPLE, AA_FINAL_FP, AA_PEEK_FP, AB_DAYS, normCDF, normPDF, power, sampleSize } from "../../../lib/explainers/stats";

const DURATION = 130;
const v = createVideo({
  theme: "dark",
  width: 1920,
  height: 1080,
  duration: DURATION,
  macros: {
    "\\pa": "\\textcolor{#9AA0A6}{\\hat{p}_A}",
    "\\pb": "\\textcolor{#83C167}{\\hat{p}_B}",
    "\\zz": "\\textcolor{#58C4DD}{z}",
    "\\al": "\\textcolor{#FC6255}{\\alpha}",
  },
});
const { C, W, tex, text, life, s, set, frame } = v;
const box = { left: 1100, right: 1830, top: 200, bottom: 860 };
const pt = (x: number, d = 2) => (x * 100).toFixed(d);
const PWR = power(0.1, 0.11, AB.nA);
const NN = sampleSize(0.1, 0.11);

// ---------------- 1: title (0 – 9) ----------------
v.centerTitle("A/B Testing", 0.2, 8.4, 70, 64, 480);
life(text("Checkout {green:B} converted better than checkout A. Is it real?", { x: W / 2, y: 330 }, { size: 38, ax: 0.5 }), 1.4, 8.4, "fade");
life(text("The z-test, the p-value, the confidence interval, power, and the peeking trap.", { x: W / 2, y: 400 }, { size: 34, ax: 0.5, color: C.dim }), 3.2, 8.4, "fade");

v.divider([[9.2, 121.6]]);

// ---------------- 2: setup (9 – 24) ----------------
v.sectionTitle("A/B Testing:", "The Experiment", 9.2, 23.6);
life(text("Visitors randomly split, 15,000 per checkout, for 14 days:", { x: 70, y: 250 }, { size: 26, width: 620 }), 9.8, 23.6, "fade");
life(tex(`\\pa = \\frac{${AB.kA.toLocaleString("en-US").replace(",", "{,}")}}{15{,}000} = ${pt(R.pA)}\\%`, { x: 90, y: 330 }, { size: 32 }), 10.6, 23.6, "write", 1);
life(tex(`\\pb = \\frac{${AB.kB.toLocaleString("en-US").replace(",", "{,}")}}{15{,}000} = ${pt(R.pB)}\\%`, { x: 90, y: 420 }, { size: 32 }), 11.4, 23.6, "write", 1);
life(tex(`\\pb - \\pa = +${pt(R.diff)} \\text{ points}`, { x: 90, y: 510 }, { size: 30 }), 13, 23.6, "write", 1);
life(text(`a +${(R.lift * 100).toFixed(1)}% relative lift`, { x: 90, y: 565 }, { size: 26, color: C.dim }), 13.6, 23.6, "fade");
life(text("{yellow:Null hypothesis} $H_0$: the checkouts convert equally.", { x: 70, y: 630 }, { size: 26, width: 620 }), 15.6, 23.6, "fade");
life(text("Could a +0.83 gap appear by chance if $H_0$ were true?", { x: 70, y: 690 }, { size: 26, width: 620 }), 17, 23.6, "fade");
{
  const P = plotFrame(v, box, [-0.6, 1.6], [0, 0.12], {
    xticks: [0, 1],
    yticks: [0, 0.04, 0.08, 0.12],
    xfmt: (x) => (x ? "B" : "A"),
    yfmt: (y) => `${Math.round(y * 100)}%`,
    ylabel: "conversion rate",
    spans: [[9.6, 23.6]],
    plainTicks: true,
  });
  const bs = [R.pA, R.pB].map((p, k) => s("rect", { x: P.px(k - 0.3), width: P.px(0.6) - P.px(0), y: P.py(0), height: 0, fill: k ? C.green : "#777" }, P.inner));
  frame((t) => {
    const g = smooth(prog(t, 10.4, 1));
    [R.pA, R.pB].forEach((p, k) => set(bs[k], { y: P.py(p * g), height: P.py(0) - P.py(p * g) }));
  });
  [R.pA, R.pB].forEach((p, k) => life(text(`${pt(p)}%`, { x: P.px(k), y: P.py(p) - 50 }, { size: 32, ax: 0.5 }), 11.4 + k * 0.3, 23.6, "fade"));
}

// ---------------- shared z plot (24 – 60) ----------------
const Z = plotFrame(v, box, [-4, 4], [0, 0.45], {
  xticks: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
  yticks: [],
  xlabel: "$\\zz$ under $H_0$: standard normal",
  spans: [[24.4, 59.6]],
  plainTicks: true,
});
const curveD = (() => {
  let d = "";
  for (let i = 0; i <= 200; i++) {
    const x = -4 + (8 * i) / 200;
    d += `${i ? "L" : "M"}${Z.px(x).toFixed(1)},${Z.py(normPDF(x)).toFixed(1)}`;
  }
  return d;
})();
const tailD = (a: number, b: number) => {
  let d = `M${Z.px(a).toFixed(1)},${Z.py(0).toFixed(1)}`;
  for (let i = 0; i <= 60; i++) {
    const x = a + ((b - a) * i) / 60;
    d += `L${Z.px(x).toFixed(1)},${Z.py(normPDF(x)).toFixed(1)}`;
  }
  return d + `L${Z.px(b).toFixed(1)},${Z.py(0).toFixed(1)}Z`;
};
const zc = s("path", { d: curveD, fill: "none", stroke: C.ink, "stroke-width": 3, opacity: 0 }, Z.inner);
const tails = [tailD(R.z, 4), tailD(-4, -R.z)].map((d) => s("path", { d, fill: C.red, opacity: 0 }, Z.inner));
const crit = [1.96, -1.96].map((x) => s("line", { x1: Z.px(x), x2: Z.px(x), y1: Z.py(0), y2: Z.py(0.42), stroke: C.yellow, "stroke-width": 2, "stroke-dasharray": "8 6", opacity: 0 }, Z.top));
const zline = s("line", { x1: Z.px(R.z), x2: Z.px(R.z), y1: Z.py(0), y2: Z.py(0.42), stroke: C.blue, "stroke-width": 5, opacity: 0 }, Z.top);
life(text(`$\\zz = ${R.z.toFixed(2)}$`, { x: Z.px(R.z) + 12, y: Z.py(0.42) }, { size: 30 }), 38, 59.6, "fade");
frame((t) => {
  set(zc, { opacity: span(t, 25, 59.6) });
  set(zline, { opacity: span(t, 37.6, 59.6) });
  tails.forEach((p) => set(p, { opacity: 0.6 * span(t, 46, 59.6) }));
  crit.forEach((l) => set(l, { opacity: span(t, 53, 59.6) }));
});

// ---------------- 3: z statistic (24 – 44) ----------------
v.sectionTitle("A/B Testing:", "The Test Statistic", 24.2, 43.6);
life(text("Under $H_0$ both checkouts share one rate. Pool them:", { x: 70, y: 245 }, { size: 26, width: 620 }), 24.8, 43.6, "fade");
life(tex(`\\hat{p} = \\frac{${AB.kA} + ${AB.kB}}{30{,}000} = ${R.pool.toFixed(4)}`, { x: 90, y: 320 }, { size: 30 }), 25.6, 43.6, "write", 1);
life(text("Standard error of the gap (from the CLT):", { x: 70, y: 410 }, { size: 26, color: C.dim }), 28, 43.6, "fade");
life(tex("\\text{SE}_0 = \\sqrt{\\hat{p}(1 - \\hat{p})\\left(\\tfrac{1}{n_A} + \\tfrac{1}{n_B}\\right)}", { x: 90, y: 470 }, { size: 30 }), 28.6, 43.6, "write", 1.2);
life(tex(`= ${R.se0.toFixed(5)} \\;(${pt(R.se0)} \\text{ points})`, { x: 90, y: 565 }, { size: 30 }), 30, 43.6, "write", 0.8);
life(text("How many standard errors is our gap?", { x: 70, y: 630 }, { size: 26, color: C.dim }), 33, 43.6, "fade");
life(tex(`\\zz = \\frac{\\pb - \\pa}{\\text{SE}_0} = \\frac{${R.diff.toFixed(5)}}{${R.se0.toFixed(5)}} = \\textcolor{#58C4DD}{${R.z.toFixed(2)}}`, { x: 90, y: 700 }, { size: 32 }), 34, 43.6, "write", 1.2);
life(text("By the CLT, if $H_0$ is true, $\\zz$ is standard normal.", { x: 70, y: 800 }, { size: 26, width: 620 }), 38, 43.6, "fade");

// ---------------- 4: p-value (44 – 60) ----------------
v.sectionTitle("A/B Testing:", "The p-value", 44.2, 59.6);
life(text("The chance of a gap at least this extreme, in either direction, if $H_0$ were true:", { x: 70, y: 245 }, { size: 26, width: 600 }), 44.8, 59.6, "fade");
life(tex(`p = 2\\big(1 - \\Phi(${R.z.toFixed(2)})\\big) = \\textcolor{#FC6255}{${R.p.toFixed(4)}}`, { x: 90, y: 350 }, { size: 34 }), 46, 59.6, "write", 1.2);
life(text("Rule: reject $H_0$ if $p < \\al = 0.05$, i.e. if $|\\zz| > 1.96$.", { x: 70, y: 460 }, { size: 26, width: 600 }), 50, 59.6, "fade");
life(text(`${R.p.toFixed(3)} < 0.05, so the result is {green:statistically significant}.`, { x: 70, y: 520 }, { size: 26, width: 600 }), 53, 59.6, "fade");
life(text("It is {red:not} the probability that $H_0$ is true, and not the probability that B is better.", { x: 70, y: 640 }, { size: 26, width: 600, color: C.dim }), 55.6, 59.6, "fade");

// ---------------- 5: confidence interval (60 – 74) ----------------
v.sectionTitle("A/B Testing:", "How Big Is the Gain?", 60.2, 73.6);
life(text("For the interval, use each arm's own rate:", { x: 70, y: 245 }, { size: 26 }), 60.8, 73.6, "fade");
life(tex("\\text{SE} = \\sqrt{\\frac{\\pa(1 - \\pa)}{n_A} + \\frac{\\pb(1 - \\pb)}{n_B}}", { x: 90, y: 320 }, { size: 30 }), 61.4, 73.6, "write", 1.2);
life(tex(`= ${R.se.toFixed(5)}`, { x: 90, y: 400 }, { size: 30 }), 62.8, 73.6, "write", 0.6);
life(tex(`(\\pb - \\pa) \\pm 1.96\\,\\text{SE} = ${pt(R.diff)} \\pm ${pt(1.96 * R.se)}`, { x: 90, y: 490 }, { size: 30 }), 64, 73.6, "write", 1.2);
life(tex(`= [\\,+${pt(R.lo)},\\ +${pt(R.hi)}\\,] \\text{ points}`, { x: 90, y: 560 }, { size: 32 }), 65.6, 73.6, "write", 1);
life(text(`In relative terms: +${((R.lo / R.pA) * 100).toFixed(0)}% to +${((R.hi / R.pA) * 100).toFixed(0)}%. Zero is excluded (matching $p < 0.05$), but the gain could be tiny or large.`, { x: 70, y: 660 }, { size: 26, width: 600 }), 67.6, 73.6, "fade");
{
  const Q = plotFrame(v, box, [-0.01, 0.025], [0, 1], {
    xticks: [-0.01, 0, 0.01, 0.02],
    yticks: [],
    xfmt: (x) => `${x > 0 ? "+" : ""}${(x * 100).toFixed(0)}`,
    xlabel: "gap B − A (percentage points)",
    spans: [[60.4, 73.6]],
    plainTicks: true,
  });
  const z0 = s("line", { x1: Q.px(0), x2: Q.px(0), y1: Q.py(0), y2: Q.py(1), stroke: C.dim, "stroke-width": 2, "stroke-dasharray": "8 6" }, Q.inner);
  const ln = s("line", { y1: Q.py(0.5), y2: Q.py(0.5), stroke: C.blue, "stroke-width": 12, "stroke-linecap": "round" }, Q.top);
  const dot = s("circle", { cx: Q.px(R.diff), cy: Q.py(0.5), r: 0, fill: "#000", stroke: C.blue, "stroke-width": 5 }, Q.top);
  frame((t) => {
    const g = smooth(prog(t, 65.6, 1));
    set(ln, { x1: Q.px(R.diff + (R.lo - R.diff) * g), x2: Q.px(R.diff + (R.hi - R.diff) * g), opacity: g > 0 ? 1 : 0 });
    set(dot, { r: 12 * span(t, 64, 73.6) });
    set(z0, { opacity: span(t, 61, 73.6) });
  });
}

// ---------------- 6: power (74 – 96) ----------------
v.sectionTitle("A/B Testing:", "Errors and Power", 74.2, 95.6);
life(text("{red:Type I error}: declaring a winner when there's no difference. Probability $\\al = 5\\%$.", { x: 70, y: 245 }, { size: 26, width: 600 }), 74.8, 95.6, "fade");
life(text("{yellow:Type II error}: missing a real difference. Probability $\\beta$.", { x: 70, y: 320 }, { size: 26, width: 600 }), 76, 95.6, "fade");
life(text("{green:Power} $= 1 - \\beta$: the chance of detecting a real lift.", { x: 70, y: 395 }, { size: 26, width: 600 }), 77.2, 95.6, "fade");
life(text("If B truly converts at 11% vs 10%, with 15,000 per arm:", { x: 70, y: 500 }, { size: 26, width: 600, color: C.dim }), 81, 95.6, "fade");
life(tex(`\\text{power} = \\Phi\\!\\left(\\frac{0.01 - 1.96\\,\\text{SE}_0}{\\text{SE}_1}\\right) = \\textcolor{#83C167}{${(PWR * 100).toFixed(1)}\\%}`, { x: 90, y: 580 }, { size: 30 }), 82, 95.6, "write", 1.2);
life(text(`Even with a real lift, about 1 test in 5 would miss it. With 8,000 per arm, power drops to ${Math.round(power(0.1, 0.11, 8000) * 100)}%.`, { x: 70, y: 690 }, { size: 26, width: 600 }), 86, 95.6, "fade");
{
  const se1 = Math.sqrt((0.1 * 0.9 + 0.11 * 0.89) / AB.nA);
  const se0 = Math.sqrt((2 * 0.105 * 0.895) / AB.nA);
  const Q = plotFrame(v, box, [-0.012, 0.024], [0, 125], {
    xticks: [-0.01, 0, 0.01, 0.02],
    yticks: [],
    xfmt: (x) => `${x > 0 ? "+" : ""}${(x * 100).toFixed(0)}`,
    xlabel: "observed gap (points)",
    spans: [[74.4, 95.6]],
    plainTicks: true,
  });
  const cut = 1.96 * se0;
  const area = (mu: number, sdv: number, a: number, b: number) => {
    let d = `M${Q.px(a).toFixed(1)},${Q.py(0).toFixed(1)}`;
    for (let i = 0; i <= 80; i++) {
      const x = a + ((b - a) * i) / 80;
      d += `L${Q.px(x).toFixed(1)},${Q.py(normPDF(x, mu, sdv)).toFixed(1)}`;
    }
    return d + `L${Q.px(b).toFixed(1)},${Q.py(0).toFixed(1)}Z`;
  };
  const h0 = s("path", { d: area(0, se0, -0.012, 0.024), fill: "#777", opacity: 0 }, Q.inner);
  const h1 = s("path", { d: area(0.01, se1, -0.012, 0.024), fill: C.green, opacity: 0 }, Q.inner);
  const pw = s("path", { d: area(0.01, se1, cut, 0.024), fill: C.green, opacity: 0 }, Q.inner);
  const al = [area(0, se0, cut, 0.024), area(0, se0, -0.012, -cut)].map((d) => s("path", { d, fill: C.red, opacity: 0 }, Q.inner));
  const cl = s("line", { x1: Q.px(cut), x2: Q.px(cut), y1: Q.py(0), y2: Q.py(122), stroke: C.yellow, "stroke-width": 3, "stroke-dasharray": "8 6", opacity: 0 }, Q.top);
  frame((t) => {
    set(h0, { opacity: 0.35 * span(t, 75, 95.6) });
    al.forEach((p) => set(p, { opacity: 0.8 * span(t, 75.6, 95.6) }));
    set(h1, { opacity: 0.2 * span(t, 81, 95.6) });
    set(pw, { opacity: 0.55 * span(t, 82.6, 95.6) });
    set(cl, { opacity: span(t, 75.6, 95.6) });
  });
  life(text("if $H_0$", { x: Q.px(-0.008), y: Q.py(118) }, { size: 26, color: C.dim }), 75, 95.6, "fade");
  life(text("{green:if B is 11%}", { x: Q.px(0.014), y: Q.py(118) }, { size: 26 }), 81, 95.6, "fade");
}

// ---------------- 7: sample size (96 – 110) ----------------
v.sectionTitle("A/B Testing:", "How Many Visitors?", 96.2, 109.6);
life(text("Solve the power formula for $n$ (per arm):", { x: 70, y: 245 }, { size: 26 }), 96.8, 109.6, "fade");
life(tex("n = \\frac{\\left(z_{\\al/2}\\sqrt{2\\bar{p}(1-\\bar{p})} + z_{\\beta}\\sqrt{p_A(1-p_A) + p_B(1-p_B)}\\right)^2}{(p_B - p_A)^2}", { x: 70, y: 330 }, { size: 28 }), 97.6, 109.6, "write", 1.4);
life(text("With $\\al = 0.05$, 80% power, baseline 10%:", { x: 70, y: 450 }, { size: 26, color: C.dim }), 100, 109.6, "fade");
[
  [0.105, "+5% (10% → 10.5%)"],
  [0.11, "+10% (10% → 11%)"],
  [0.12, "+20% (10% → 12%)"],
].forEach(([pb, lbl], k) => {
  life(text(String(lbl), { x: 90, y: 510 + k * 56 }, { size: 28 }), 101 + k * 0.8, 109.6, "fade", 0.4);
  life(text(`${sampleSize(0.1, pb as number).toLocaleString("en-US")} per arm`, { x: 440, y: 510 + k * 56 }, { size: 28, color: C.yellow }), 101 + k * 0.8, 109.6, "fade", 0.4);
});
life(text("Halve the lift you want to detect and you need about 4× the visitors.", { x: 70, y: 720 }, { size: 26, width: 600 }), 104, 109.6, "fade");
life(text(`That's why this test ran 15,000 per arm (≥ ${NN.toLocaleString("en-US")}).`, { x: 70, y: 800 }, { size: 26, width: 600, color: C.dim }), 106, 109.6, "fade");
{
  const Q = plotFrame(v, box, [2000, 30000], [0, 1], {
    xticks: [5000, 10000, 15000, 20000, 25000, 30000],
    yticks: [0, 0.2, 0.4, 0.6, 0.8, 1],
    xfmt: (x) => `${x / 1000}k`,
    yfmt: (y) => `${Math.round(y * 100)}%`,
    xlabel: "visitors per arm",
    ylabel: "power",
    spans: [[96.4, 109.6]],
    plainTicks: true,
  });
  const curves = [0.105, 0.11, 0.12].map((pb, k) => s("path", { fill: "none", stroke: [C.blue, C.green, C.orange][k], "stroke-width": 4 }, Q.inner));
  const eighty = s("line", { x1: Q.px(2000), x2: Q.px(30000), y1: Q.py(0.8), y2: Q.py(0.8), stroke: C.dim, "stroke-width": 2, "stroke-dasharray": "8 6" }, Q.inner);
  frame((t) => {
    const g = smooth(prog(t, 97, 2));
    [0.105, 0.11, 0.12].forEach((pb, k) => {
      let d = "";
      for (let i = 0; i <= 100 * g; i++) {
        const n = 2000 + 280 * i;
        d += `${i ? "L" : "M"}${Q.px(n).toFixed(1)},${Q.py(power(0.1, pb, n)).toFixed(1)}`;
      }
      set(curves[k], { d });
    });
    set(eighty, { opacity: span(t, 97, 109.6) });
  });
  life(text("{orange:+20%}", { x: Q.px(2300), y: Q.py(0.97) }, { size: 26 }), 99, 109.6, "fade");
  life(text("{green:+10%}", { x: Q.px(16000), y: Q.py(0.9) }, { size: 26 }), 99, 109.6, "fade");
  life(text("{blue:+5%}", { x: Q.px(25000), y: Q.py(0.45) }, { size: 26 }), 99, 109.6, "fade");
}

// ---------------- 8: peeking (110 – 122) ----------------
v.sectionTitle("A/B Testing:", "The Peeking Trap", 110.2, 121.6);
life(text("2,000 simulated A/A tests (no real difference):", { x: 70, y: 245 }, { size: 26, width: 600 }), 110.8, 121.6, "fade");
life(text(`Test once, at the end: {green:${(AA_FINAL_FP * 100).toFixed(1)}%} false winners.`, { x: 90, y: 320 }, { size: 28, width: 600 }), 111.6, 121.6, "fade");
life(text(`Check daily, stop at the first $p < 0.05$: {red:${(AA_PEEK_FP * 100).toFixed(1)}%}.`, { x: 90, y: 380 }, { size: 28, width: 600 }), 112.8, 121.6, "fade");
life(text("Every look is another chance for noise to cross the line.", { x: 70, y: 480 }, { size: 26, width: 600, color: C.dim }), 114, 121.6, "fade");
life(text("Fix the sample size in advance, or use a {blue:sequential test} built for repeated looks.", { x: 70, y: 560 }, { size: 26, width: 600 }), 116, 121.6, "fade");
{
  const Q = plotFrame(v, box, [0.5, 14.5], [0, 1], {
    xticks: [1, 4, 7, 10, 14],
    yticks: [0.05, 0.25, 0.5, 0.75, 1],
    yfmt: (y) => (y === 0.05 ? "0.05" : y.toFixed(2)),
    xlabel: "day of an A/A test",
    ylabel: "p-value",
    spans: [[110.4, 121.6]],
    plainTicks: true,
  });
  const pv = AA_ZS[AA_EXAMPLE].map((z) => 2 * (1 - normCDF(Math.abs(z))));
  s("rect", { x: Q.px(0.5), width: Q.px(14.5) - Q.px(0.5), y: Q.py(0.05), height: Q.py(0) - Q.py(0.05), fill: C.red, opacity: 0.25 }, Q.inner);
  const line = s("path", { fill: "none", stroke: C.blue, "stroke-width": 4 }, Q.inner);
  const dots = pv.map((p, d) => s("circle", { cx: Q.px(d + 1), cy: Q.py(p), r: 0, fill: p < 0.05 ? C.red : C.blue }, Q.top));
  frame((t) => {
    const k = Math.floor(prog(t, 111, 4) * AB_DAYS);
    set(line, { d: pv.slice(0, Math.max(1, k)).map((p, d) => `${d ? "L" : "M"}${Q.px(d + 1).toFixed(1)},${Q.py(p).toFixed(1)}`).join("") });
    dots.forEach((c, d) => set(c, { r: d < k ? 8 : 0 }));
  });
}

// ---------------- 9: end (122 – 130) ----------------
v.endCard(122.2, 129, [
  { tex: "\\zz = \\frac{\\pb - \\pa}{\\sqrt{\\hat{p}(1-\\hat{p})\\left(\\frac{1}{n_A} + \\frac{1}{n_B}\\right)}} \\qquad p = 2\\big(1 - \\Phi(|\\zz|)\\big)", size: 46, y: 220 },
  { text: "Plan the sample size. Run to the end. Report the interval.", size: 36, y: 400 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
