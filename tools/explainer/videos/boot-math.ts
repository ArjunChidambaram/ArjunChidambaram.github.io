import { createVideo, plotFrame, prog, smooth, span } from "./engine";
import { BOOT_SAMPLE, BOOT_DRAWS, BOOT_MEDIANS, BOOT_MEANS, BOOT_P90, TRUE_MEDIANS, BOOT_N, median, mean, quantile, sd, binned, normPDF, rng } from "../../../lib/explainers/stats";

const DURATION = 114;
const v = createVideo({
  theme: "dark",
  width: 1920,
  height: 1080,
  duration: DURATION,
  macros: {
    "\\th": "\\textcolor{#C77DFF}{\\hat{\\theta}}",
    "\\ths": "\\textcolor{#C77DFF}{\\hat{\\theta}^{*}}",
    "\\Fh": "\\textcolor{#58C4DD}{\\hat{F}}",
  },
});
const { C, W, tex, text, life, s, set, frame } = v;
const box = { left: 1100, right: 1830, top: 200, bottom: 860 };
const money = (x: number) => `&#36;${x}`;
const D2 = (x: number) => `\\$${x.toFixed(2)}`;
const med0 = median(BOOT_SAMPLE);
const s0 = sd(BOOT_SAMPLE, 1);
const q = (xs: number[], p: number) => quantile(xs, p);

// ---------------- 1: title (0 – 9) ----------------
v.centerTitle("The Bootstrap", 0.2, 8.4, 70, 64, 520);
life(text("One sample. A statistic with {red:no formula} for its error bar.", { x: W / 2, y: 330 }, { size: 38, ax: 0.5 }), 1.4, 8.4, "fade");
life(text("Resample the data to {green:simulate} the uncertainty instead.", { x: W / 2, y: 400 }, { size: 38, ax: 0.5 }), 3.2, 8.4, "fade");

v.divider([[9.2, 75.6]]);

// ---------------- shared strip of the sample (9 – 40) ----------------
const S = plotFrame(v, { left: 1100, right: 1830, top: 260, bottom: 560 }, [0, 240], [0, 1], {
  xticks: [0, 50, 100, 150, 200],
  yticks: [],
  xfmt: money,
  xlabel: "the 50 orders we have",
  spans: [[9.6, 39.6]],
  plainTicks: true,
});
const jr = rng(5);
const jit = BOOT_SAMPLE.map(() => 0.12 + 0.76 * jr());
const dots = BOOT_SAMPLE.map((x, i) => s("circle", { cx: S.px(x), cy: S.py(jit[i]), r: 0, fill: C.blue }, S.top));
const mline = s("line", { x1: S.px(med0), x2: S.px(med0), y1: S.py(0), y2: S.py(1), stroke: C.orange, "stroke-width": 3, "stroke-dasharray": "8 6", opacity: 0 }, S.inner);
const rline = s("line", { y1: S.py(0), y2: S.py(1), stroke: C.purple, "stroke-width": 4, opacity: 0 }, S.top);
const DEMO = BOOT_DRAWS.map((d) => median(d.map((i) => BOOT_SAMPLE[i])));
const demoAt = (t: number) => (t >= 31 && t < 39.6 ? Math.min(BOOT_DRAWS.length - 1, Math.floor((t - 31) / 1.05)) : -1);
const resLbl = v.html("", { x: 1100, y: 690 }, { size: 30 });
life(resLbl, 31, 39.6, "fade", 0.3);
frame((t) => {
  const k = demoAt(t);
  const counts = new Array(BOOT_N).fill(0);
  if (k >= 0) for (const i of BOOT_DRAWS[k]) counts[i]++;
  dots.forEach((d, i) => {
    const p = prog(t, 10 + i * 0.03, 0.3);
    const r = k >= 0 ? (counts[i] ? 6 + counts[i] * 4 : 5) : p > 0 ? 8 : 0;
    set(d, { r, opacity: k >= 0 && !counts[i] ? 0.25 : 1, fill: k >= 0 && counts[i] ? C.purple : C.blue });
  });
  set(mline, { opacity: span(t, 12, 39.6) });
  set(rline, { x1: S.px(k >= 0 ? DEMO[k] : 0), x2: S.px(k >= 0 ? DEMO[k] : 0), opacity: k >= 0 ? 1 : 0 });
  if (k >= 0) {
    const distinct = counts.filter((c) => c > 0).length;
    resLbl.el.innerHTML = `<div>Resample ${k + 1}: <b>${distinct}</b> distinct orders, <b>${BOOT_N - distinct}</b> left out</div><div style="margin-top:8px">median <b style="color:${C.purple}">$${DEMO[k].toFixed(2)}</b></div>`;
  }
});
life(text(`median $${med0.toFixed(2)}`.replace("$", "&#36;"), { x: S.px(med0) + 10, y: S.py(1) - 10 }, { size: 26, color: C.orange }), 12, 30.6, "fade");

// ---------------- 2: the problem (9 – 24) ----------------
v.sectionTitle("The Bootstrap:", "The Problem", 9.2, 23.6);
life(text("50 orders from the new checkout:", { x: 70, y: 250 }, { size: 28 }), 9.8, 23.6, "fade");
life(tex(`\\text{median } \\th = ${D2(med0)}`, { x: 90, y: 320 }, { size: 34 }), 11, 23.6, "write", 1);
life(text("How far from the true median could that be?", { x: 70, y: 420 }, { size: 26 }), 13, 23.6, "fade");
life(text("For a {blue:mean}, the CLT gives the standard error:", { x: 70, y: 500 }, { size: 26, width: 600 }), 15, 23.6, "fade");
life(tex(`\\text{SE} = s/\\sqrt{n} = ${s0.toFixed(2)}/\\sqrt{50} = ${D2(s0 / Math.sqrt(50))}`, { x: 90, y: 560 }, { size: 30 }), 15.8, 23.6, "write", 1);
life(text("For a {purple:median}, a 90th percentile or a ratio of two metrics, there's no simple formula.", { x: 70, y: 660 }, { size: 26, width: 600 }), 18, 23.6, "fade");

// ---------------- 3: plug-in (24 – 40) ----------------
v.sectionTitle("The Bootstrap:", "The Plug-in Idea", 24.2, 39.6);
life(text("If we could draw fresh samples from the population $F$, we'd just look at how the median varies.", { x: 70, y: 245 }, { size: 26, width: 600 }), 24.8, 39.6, "fade");
life(text("We can't. But the sample is our best picture of $F$:", { x: 70, y: 350 }, { size: 26, width: 600 }), 26.6, 39.6, "fade");
life(tex("\\Fh: \\text{ each order has probability } \\tfrac{1}{50}", { x: 90, y: 420 }, { size: 28 }), 27.4, 39.6, "write", 1.2);
life(text("Drawing from $\\Fh$ = drawing 50 of our orders {yellow:with replacement}.", { x: 70, y: 520 }, { size: 26, width: 600 }), 29.4, 39.6, "fade");
life(text("Some orders come up twice or more (bigger dots); others not at all (faded).", { x: 70, y: 620 }, { size: 26, width: 600, color: C.dim }), 31.6, 39.6, "fade");

// ---------------- 4: algorithm (40 – 60) ----------------
const Bp = plotFrame(v, box, [20, 80], [0, 1], {
  xticks: [20, 30, 40, 50, 60, 70, 80],
  yticks: [],
  xfmt: money,
  xlabel: "bootstrap medians $\\ths$",
  spans: [[40.4, 59.6]],
  plainTicks: true,
});
const BW = 2;
const bh = binned(BOOT_MEDIANS, 20, 80, BW);
const btop = Math.max(...bh) * 1.12;
const bbars = bh.map((c, i) => s("rect", { x: Bp.px(20 + i * BW) + 1, width: Bp.px(BW) - Bp.px(0) - 2, y: Bp.py(0), height: 0, fill: C.purple }, Bp.inner));
const blo = q(BOOT_MEDIANS, 0.025);
const bhi = q(BOOT_MEDIANS, 0.975);
const band = s("rect", { x: Bp.px(blo), width: Bp.px(bhi) - Bp.px(blo), y: Bp.py(1), height: Bp.py(0) - Bp.py(1), fill: C.green, opacity: 0 }, Bp.inner);
frame((t) => {
  const g = smooth(prog(t, 41.4, 3));
  bbars.forEach((b, i) => set(b, { y: Bp.py((bh[i] / btop) * g), height: Bp.py(0) - Bp.py((bh[i] / btop) * g) }));
  set(band, { opacity: 0.2 * span(t, 52, 59.6) });
});
v.sectionTitle("The Bootstrap:", "The Algorithm", 40.2, 59.6);
life(text("Repeat $B = 2{,}000$ times:", { x: 70, y: 245 }, { size: 28 }), 40.8, 59.6, "fade");
life(text("1. Draw 50 orders from the sample, with replacement.", { x: 90, y: 305 }, { size: 26, width: 600 }), 41.4, 59.6, "fade");
life(text("2. Compute the median of that resample: $\\ths_b$.", { x: 90, y: 355 }, { size: 26, width: 600 }), 42, 59.6, "fade");
life(text("The spread of the $\\ths$ estimates the spread of $\\th$:", { x: 70, y: 440 }, { size: 26, width: 600 }), 45, 59.6, "fade");
life(tex(`\\text{SE}_{\\text{boot}} = \\operatorname{SD}(\\ths_1, \\ldots, \\ths_B) = ${D2(sd(BOOT_MEDIANS, 1))}`, { x: 90, y: 510 }, { size: 30 }), 46, 59.6, "write", 1.2);
life(text("{green:Percentile interval}: the middle 95% of the $\\ths$", { x: 70, y: 610 }, { size: 26, width: 600 }), 51, 59.6, "fade");
life(tex(`[\\,q_{2.5\\%},\\ q_{97.5\\%}\\,] = [\\,${D2(blo)},\\ ${D2(bhi)}\\,]`, { x: 90, y: 680 }, { size: 32 }), 52, 59.6, "write", 1.2);
life(text(`Lopsided around ${"&#36;"}${med0.toFixed(2)}, like the data. A ±1.96 SE interval would be symmetric.`, { x: 70, y: 780 }, { size: 26, width: 600, color: C.dim }), 55, 59.6, "fade");

// ---------------- 5: does it work? (60 – 76) ----------------
v.sectionTitle("The Bootstrap:", "Does It Work?", 60.2, 75.6);
life(text("Test it where we know the answer: the {blue:mean}.", { x: 70, y: 245 }, { size: 26, width: 600 }), 60.8, 75.6, "fade");
life(tex(`\\text{SE}_{\\text{boot}} = ${D2(sd(BOOT_MEANS, 1))} \\quad \\text{vs} \\quad s/\\sqrt{n} = ${D2(s0 / Math.sqrt(50))}`, { x: 90, y: 320 }, { size: 30 }), 61.6, 75.6, "write", 1.2);
life(tex(`\\text{CI}_{\\text{boot}} = [${D2(q(BOOT_MEANS, 0.025))},\\ ${D2(q(BOOT_MEANS, 0.975))}]`, { x: 90, y: 390 }, { size: 28 }), 62.8, 75.6, "write", 1);
life(tex(`\\bar{x} \\pm 1.96\\,\\text{SE} = [${D2(mean(BOOT_SAMPLE) - (1.96 * s0) / Math.sqrt(50))},\\ ${D2(mean(BOOT_SAMPLE) + (1.96 * s0) / Math.sqrt(50))}]`, { x: 90, y: 450 }, { size: 28 }), 63.6, 75.6, "write", 1);
life(text("And for the median, against 2,000 fresh samples from the population (only possible in a simulation):", { x: 70, y: 560 }, { size: 26, width: 600 }), 67, 75.6, "fade");
life(tex(`\\text{SE}_{\\text{boot}} = ${D2(sd(BOOT_MEDIANS, 1))} \\quad \\text{vs} \\quad \\text{true SE} = ${D2(sd(TRUE_MEDIANS, 1))}`, { x: 90, y: 670 }, { size: 30 }), 68.6, 75.6, "write", 1.2);
life(text("Close. The bootstrap gets the spread, not the center: it's centered on our sample.", { x: 70, y: 770 }, { size: 26, width: 600, color: C.dim }), 71, 75.6, "fade");
{
  const M = plotFrame(v, box, [30, 90], [0, 1], {
    xticks: [30, 40, 50, 60, 70, 80, 90],
    yticks: [],
    xfmt: money,
    xlabel: "bootstrap means",
    spans: [[60.4, 75.6]],
    plainTicks: true,
  });
  const h = binned(BOOT_MEANS, 30, 90, 1.5);
  const top = Math.max(...h) * 1.12;
  const bars = h.map((c, i) => s("rect", { x: M.px(30 + i * 1.5) + 1, width: M.px(1.5) - M.px(0) - 2, y: M.py(0), height: 0, fill: C.blue }, M.inner));
  let d = "";
  const se = s0 / Math.sqrt(50);
  for (let x = 30; x <= 90; x += 0.5) d += `${x === 30 ? "M" : "L"}${M.px(x).toFixed(1)},${M.py((normPDF(x, mean(BOOT_SAMPLE), se) * BOOT_MEANS.length * 1.5) / top).toFixed(1)}`;
  const cv = s("path", { d, fill: "none", stroke: C.orange, "stroke-width": 4, opacity: 0 }, M.top);
  frame((t) => {
    const g = smooth(prog(t, 61, 1.5));
    bars.forEach((b, i) => set(b, { y: M.py((h[i] / top) * g), height: M.py(0) - M.py((h[i] / top) * g) }));
    set(cv, { opacity: span(t, 62.6, 75.6) });
  });
  life(text("{orange:CLT normal curve}", { x: M.px(70), y: M.py(0.9) }, { size: 26 }), 62.6, 75.6, "fade");
}

// ---------------- 6: with replacement (76 – 90) ----------------
const leftOut = BOOT_DRAWS.reduce((a, d) => a + (BOOT_N - new Set(d).size), 0) / (BOOT_DRAWS.length * BOOT_N);
v.centerTitle("Why With Replacement?", 76.2, 89.6, 60, 46, 520);
life(text("Without replacement, every resample would be the same 50 orders, with the same median.", { x: W / 2, y: 220 }, { size: 32, ax: 0.5 }), 77, 89.6, "fade");
life(text("With replacement, each order is left out of a resample with probability", { x: W / 2, y: 340 }, { size: 32, ax: 0.5 }), 79, 89.6, "fade");
life(tex("\\left(1 - \\tfrac{1}{50}\\right)^{50} = 0.364 \\;\\xrightarrow{\\;n \\to \\infty\\;}\\; \\tfrac{1}{e} = 0.368", { x: W / 2, y: 400 }, { size: 44, ax: 0.5 }), 80, 89.6, "write", 1.4);
life(text(`Our 8 example resamples left out ${(leftOut * 100).toFixed(0)}% of the orders on average.`, { x: W / 2, y: 540 }, { size: 32, ax: 0.5, color: C.dim }), 83, 89.6, "fade");
life(text("That variation between resamples mimics the variation between real samples.", { x: W / 2, y: 640 }, { size: 32, ax: 0.5 }), 85, 89.6, "fade");
life(text("(The same trick, called {green:bagging}, makes random forests work.)", { x: W / 2, y: 740 }, { size: 30, ax: 0.5, color: C.dim }), 87, 89.6, "fade");

// ---------------- 7: limits (90 – 104) ----------------
v.centerTitle("When the Bootstrap Struggles", 90.2, 103.6, 60, 46, 640);
life(text("{yellow:Small samples}: 50 orders can't reveal tails they never saw.", { x: W / 2, y: 220 }, { size: 32, ax: 0.5 }), 91, 103.6, "fade");
life(text(`{yellow:Extreme statistics}: the 90th percentile's interval is &#36;${q(BOOT_P90, 0.025).toFixed(0)} to &#36;${q(BOOT_P90, 0.975).toFixed(0)}. Honest, but wide.`, { x: W / 2, y: 320 }, { size: 32, ax: 0.5 }), 92.6, 103.6, "fade");
life(text("A bootstrap maximum can never exceed the sample's maximum, so it fails for the max.", { x: W / 2, y: 380 }, { size: 28, ax: 0.5, color: C.dim }), 93.4, 103.6, "fade");
life(text("{yellow:Dependent data}: resample whole users, days or blocks, not single rows.", { x: W / 2, y: 480 }, { size: 32, ax: 0.5 }), 95.4, 103.6, "fade");
life(text("{yellow:Biased samples}: resampling can't fix how the data was collected.", { x: W / 2, y: 580 }, { size: 32, ax: 0.5 }), 97.4, 103.6, "fade");
life(text("Medians of small samples come out spiky: they can only take a few values.", { x: W / 2, y: 680 }, { size: 28, ax: 0.5, color: C.dim }), 99.4, 103.6, "fade");

// ---------------- 8: end (104 – 114) ----------------
v.endCard(104.2, 113, [
  { tex: "\\ths_b = \\text{stat}\\big(x^{*}_{1}, \\ldots, x^{*}_{n}\\big), \\quad x^{*} \\sim \\Fh \\qquad \\text{CI} = [q_{2.5\\%},\\ q_{97.5\\%}]", size: 48, y: 230 },
  { text: "When there's no formula, resample.", size: 36, y: 400 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
