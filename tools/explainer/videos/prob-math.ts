import { createVideo, plotFrame, prog, smooth, span } from "./engine";
import { DAYS, DAY_N, P_BUY, binomPMF, histogram, mean, sd } from "../../../lib/explainers/stats";

const DURATION = 116;
const v = createVideo({
  theme: "dark",
  width: 1920,
  height: 1080,
  duration: DURATION,
  macros: {
    "\\pp": "\\textcolor{#F4D35E}{p}",
    "\\nn": "\\textcolor{#58C4DD}{n}",
    "\\K": "\\textcolor{#83C167}{K}",
    "\\Xb": "\\textcolor{#83C167}{X}",
  },
});
const { C, W, tex, text, life, s, set, frame } = v;
const ORANGE = C.orange;

// ---------------- 1: title (0 – 9) ----------------
v.centerTitle("Probability", 0.2, 8.4, 70, 64, 600);
life(text("A visitor buys with probability {yellow:10%}. What does that predict?", { x: W / 2, y: 330 }, { size: 38, ax: 0.5 }), 1.4, 8.4, "fade");
life(text("Not one visitor's choice, but the {green:pattern} across many.", { x: W / 2, y: 400 }, { size: 38, ax: 0.5 }), 3.2, 8.4, "fade");
life(text("Let's build it up from a single visitor.", { x: W / 2, y: 470 }, { size: 38, ax: 0.5 }), 5, 8.4, "fade");

v.divider([
  [9.2, 23.6],
  [42.2, 105.6],
]);

// ---------------- 2: one visitor (9 – 24) ----------------
v.sectionTitle("Probability:", "One Visitor", 9.2, 23.6);
life(text("$\\Xb = 1$ if the visitor buys, $\\Xb = 0$ if not", { x: 70, y: 260 }, { size: 32 }), 9.8, 23.6);
life(tex("P(\\Xb = 1) = \\pp = 0.1", { x: 70, y: 320 }, { size: 32 }), 10.6, 23.6, "write", 0.8);
life(tex("P(\\Xb = 0) = 1 - \\pp = 0.9", { x: 70, y: 375 }, { size: 32 }), 11, 23.6, "write", 0.8);
life(text("Expected value: the long-run average", { x: 70, y: 450 }, { size: 30, color: C.dim }), 13, 23.6, "fade");
life(tex("E[\\Xb] = 1 \\cdot \\pp + 0 \\cdot (1 - \\pp) = \\pp = 0.1", { x: 70, y: 500 }, { size: 32 }), 13.6, 23.6, "write", 1.2);
life(text("Variance: the average squared distance from it", { x: 70, y: 620 }, { size: 30, color: C.dim }), 16.4, 23.6, "fade");
life(tex("\\operatorname{Var}(\\Xb) = E[\\Xb^2] - E[\\Xb]^2", { x: 70, y: 670 }, { size: 30 }), 17, 23.6, "write", 1);
life(tex("= \\pp - \\pp^2 = \\pp(1 - \\pp) = 0.09", { x: 70, y: 725 }, { size: 30 }), 17.8, 23.6, "write", 1);
life(text("This is a {yellow:Bernoulli} random variable.", { x: 70, y: 820 }, { size: 30 }), 19.4, 23.6, "fade");
{
  const B = plotFrame(v, { left: 1180, right: 1780, top: 220, bottom: 820 }, [-0.7, 1.7], [0, 1], {
    xticks: [0, 1],
    yticks: [0, 0.5, 1],
    xfmt: (x) => (x ? "1 (buy)" : "0 (no)"),
    ylabel: "probability",
    spans: [[9.6, 23.6]],
    plainTicks: true,
  });
  const bs = [0.9, 0.1].map((h, k) => s("rect", { x: B.px(k - 0.3), width: B.px(0.6) - B.px(0), y: B.py(0), height: 0, fill: k ? C.green : C.dim }, B.inner));
  const lbl = [0.9, 0.1].map((h, k) => v.text(String(h), { x: B.px(k), y: B.py(h) - 50 }, { size: 32, ax: 0.5 }));
  lbl.forEach((l, k) => life(l, 11.4 + k * 0.2, 23.6, "fade"));
  const mline = s("line", { x1: B.px(0.1), x2: B.px(0.1), y1: B.py(0), y2: B.py(1), stroke: C.yellow, "stroke-width": 4, "stroke-dasharray": "10 8", opacity: 0 }, B.top);
  frame((t) => {
    const g = smooth(prog(t, 10.8, 0.8));
    bs.forEach((b, k) => {
      const h = [0.9, 0.1][k] * g;
      set(b, { y: B.py(h), height: B.py(0) - B.py(h) });
    });
    set(mline, { opacity: span(t, 14.6, 23.6) });
  });
  life(text("$E[\\Xb] = 0.1$", { x: B.px(0.1) + 14, y: B.py(0.6) }, { size: 28, color: C.yellow }), 14.6, 23.6, "fade");
}

// ---------------- 3: rules (24 – 42) ----------------
v.centerTitle("Three Rules You'll Use Everywhere", 24.2, 41.6, 60, 46, 560);
life(text("{blue:Complement}: something either happens or it doesn't", { x: W / 2, y: 210 }, { size: 32, ax: 0.5 }), 25, 41.6, "fade");
life(tex("P(\\text{not } A) = 1 - P(A)", { x: W / 2, y: 270 }, { size: 42, ax: 0.5 }), 25.6, 41.6, "write", 1);
life(text("{blue:Independence}: one visitor's choice doesn't affect another's", { x: W / 2, y: 400 }, { size: 32, ax: 0.5 }), 28, 41.6, "fade");
life(tex("P(A \\text{ and } B) = P(A)\\,P(B) \\qquad P(\\text{two visitors both buy}) = 0.1 \\times 0.1 = 0.01", { x: W / 2, y: 460 }, { size: 40, ax: 0.5 }), 28.6, 41.6, "write", 1.4);
life(text("Together: the chance that {green:at least one} of 20 visitors buys", { x: W / 2, y: 600 }, { size: 32, ax: 0.5 }), 32, 41.6, "fade");
life(tex("1 - P(\\text{nobody buys}) = 1 - 0.9^{20} = 1 - 0.122 = 0.878", { x: W / 2, y: 660 }, { size: 44, ax: 0.5 }), 33, 41.6, "write", 1.4);
life(text("{yellow:Expected value adds up}, even without independence:", { x: W / 2, y: 800 }, { size: 32, ax: 0.5 }), 36, 41.6, "fade");
life(tex("E[X_1 + X_2 + \\cdots + X_n] = E[X_1] + E[X_2] + \\cdots + E[X_n]", { x: W / 2, y: 860 }, { size: 40, ax: 0.5 }), 36.8, 41.6, "write", 1.2);

// ---------------- shared binomial plot (42 – 106) ----------------
const P = plotFrame(v, { left: 1100, right: 1830, top: 200, bottom: 860 }, [-0.5, 24.5], [0, 0.16], {
  xticks: [0, 4, 8, 12, 16, 20, 24],
  yticks: [0, 0.05, 0.1, 0.15],
  yfmt: (y) => y.toFixed(2),
  xlabel: "buyers in a day, $k$",
  ylabel: "$P(\\K = k)$",
  spans: [[42.4, 85.6]],
  plainTicks: true,
});
const bw = P.px(1) - P.px(0);
const bars = Array.from({ length: 25 }, (_, k) => s("rect", { x: P.px(k - 0.4), width: bw * 0.8, y: P.py(0), height: 0, fill: C.blue }, P.inner));
const sims = Array.from({ length: 25 }, (_, k) => s("circle", { cx: P.px(k), r: 0, fill: ORANGE, stroke: "#000", "stroke-width": 2 }, P.top));
const bands = [2, 1].map((m) => s("rect", { y: P.py(0.15), height: P.py(0) - P.py(0.15), x: P.px(10 - 3 * m), width: P.px(10 + 3 * m) - P.px(10 - 3 * m), fill: C.green, opacity: 0 }, P.inner));
const mu = s("line", { x1: P.px(10), x2: P.px(10), y1: P.py(0), y2: P.py(0.15), stroke: C.yellow, "stroke-width": 4, "stroke-dasharray": "10 8", opacity: 0 }, P.top);
const H = histogram(DAYS, 0, 24);
frame((t) => {
  bars.forEach((b, k) => {
    const g = smooth(prog(t, 47 + k * 0.04, 0.6));
    const h = binomPMF(DAY_N, P_BUY, k) * g;
    set(b, { y: P.py(h), height: P.py(0) - P.py(h), fill: t > 52 && t < 64 && k === 10 ? C.yellow : C.blue });
  });
  const sv = span(t, 76, 85.6, 0.5);
  sims.forEach((c, k) => set(c, { cy: P.py(H[k] / DAYS.length), r: 8 * sv }));
  set(mu, { opacity: span(t, 66, 85.6) });
  set(bands[0], { opacity: 0.1 * span(t, 72, 85.6) });
  set(bands[1], { opacity: 0.12 * span(t, 69, 85.6) });
});

// ---------------- 4: counting buyers (42 – 64) ----------------
v.sectionTitle("Probability:", "Counting Buyers", 42.2, 63.6);
life(text("$\\K$ = number of buyers among $\\nn = 100$ visitors", { x: 70, y: 250 }, { size: 30 }), 42.8, 63.6, "fade");
life(tex("\\K = X_1 + X_2 + \\cdots + X_{100}", { x: 70, y: 310 }, { size: 32 }), 43.4, 63.6, "write", 1);
life(text("One arrangement of $k$ buyers: $\\pp^k (1-\\pp)^{\\nn-k}$", { x: 70, y: 400 }, { size: 26, color: C.dim }), 45, 63.6, "fade");
life(text("Number of arrangements: $\\binom{\\nn}{k}$", { x: 70, y: 440 }, { size: 26, color: C.dim }), 45.4, 63.6, "fade");
life(tex("P(\\K = k) = \\binom{\\nn}{k}\\, \\pp^{\\,k} (1 - \\pp)^{\\nn - k}", { x: 70, y: 500 }, { size: 36 }), 46, 63.6, "write", 1.4);
life(text("the {blue:binomial distribution}", { x: 70, y: 600 }, { size: 28 }), 48, 63.6, "fade");
life(text("Exactly 10 buyers:", { x: 70, y: 680 }, { size: 28, color: C.yellow }), 52, 63.6, "fade");
life(tex("\\binom{100}{10}(0.1)^{10}(0.9)^{90}", { x: 70, y: 730 }, { size: 32 }), 52.6, 63.6, "write", 1);
life(tex("= (1.73 \\times 10^{13})(10^{-10})(7.62 \\times 10^{-5}) = \\textcolor{#F4D35E}{0.132}", { x: 70, y: 790 }, { size: 26 }), 54.4, 63.6, "write", 1.2);
life(text("Even the most likely count happens only 13% of days.", { x: 70, y: 870 }, { size: 26, color: C.dim }), 57, 63.6, "fade");

// ---------------- 5: mean and spread (64 – 86) ----------------
v.sectionTitle("Probability:", "Center and Spread", 64.2, 85.6);
life(text("Adding up expected values:", { x: 70, y: 250 }, { size: 28, color: C.dim }), 64.8, 85.6, "fade");
life(tex("E[\\K] = \\nn\\pp = 100 \\times 0.1 = \\textcolor{#F4D35E}{10}", { x: 70, y: 300 }, { size: 34 }), 65.4, 85.6, "write", 1);
life(text("Independent, so variances add up too:", { x: 70, y: 400 }, { size: 28, color: C.dim }), 67, 85.6, "fade");
life(tex("\\operatorname{Var}(\\K) = \\nn\\pp(1 - \\pp) = 100 \\times 0.1 \\times 0.9 = 9", { x: 70, y: 450 }, { size: 26 }), 67.6, 85.6, "write", 1.2);
life(tex("\\operatorname{SD}(\\K) = \\sqrt{9} = \\textcolor{#83C167}{3}", { x: 70, y: 520 }, { size: 34 }), 69, 85.6, "write", 1);
life(text("About 95% of days land within 2 SDs: {green:4 to 16} buyers.", { x: 70, y: 620 }, { size: 28, width: 600 }), 72, 85.6, "fade");
life(text(`{orange:1,000 simulated days}: mean ${mean(DAYS).toFixed(2)}, SD ${sd(DAYS).toFixed(2)},`, { x: 70, y: 730 }, { size: 28 }), 76.4, 85.6, "fade");
life(text(`${Math.round((DAYS.filter((k) => k >= 4 && k <= 16).length / DAYS.length) * 100)}% of days within 4 to 16.`, { x: 70, y: 772 }, { size: 28 }), 76.6, 85.6, "fade");

// ---------------- 6: rates (86 – 106) ----------------
v.sectionTitle("Probability:", "From Counts to Rates", 86.2, 105.6);
life(text("The {yellow:conversion rate} is the count divided by $\\nn$:", { x: 70, y: 250 }, { size: 28 }), 86.8, 105.6, "fade");
life(tex("\\hat{\\pp} = \\frac{\\K}{\\nn} \\qquad E[\\hat{\\pp}] = \\pp", { x: 70, y: 300 }, { size: 32 }), 87.4, 105.6, "write", 1);
life(tex("\\operatorname{SD}(\\hat{\\pp}) = \\sqrt{\\frac{\\pp(1 - \\pp)}{\\nn}}", { x: 70, y: 370 }, { size: 32 }), 88.4, 105.6, "write", 1);
life(tex("\\nn = 100: \\quad \\sqrt{0.09 / 100} = 0.030", { x: 70, y: 480 }, { size: 30 }), 90, 105.6, "write", 1);
life(tex("\\nn = 1{,}000: \\quad \\sqrt{0.09 / 1000} = 0.0095", { x: 70, y: 535 }, { size: 30 }), 92, 105.6, "write", 1);
life(text("10× the visitors, about 3× less wobble ($\\sqrt{10} \\approx 3.2$).", { x: 70, y: 620 }, { size: 28, width: 600 }), 94.4, 105.6, "fade");
life(text("As $\\nn$ grows the rate pins down $\\pp$: the {green:law of large numbers}.", { x: 70, y: 710 }, { size: 28, width: 600 }), 97, 105.6, "fade");
life(text("Next post.", { x: 70, y: 810 }, { size: 26, color: C.dim }), 98, 105.6, "fade");
{
  const R = plotFrame(v, { left: 1100, right: 1830, top: 200, bottom: 860 }, [0, 0.25], [0, 45], {
    xticks: [0, 0.05, 0.1, 0.15, 0.2, 0.25],
    yticks: [0, 10, 20, 30, 40],
    xfmt: (x) => `${Math.round(x * 100)}%`,
    xlabel: "conversion rate $\\hat{\\pp}$",
    ylabel: "density",
    spans: [[86.4, 105.6]],
    plainTicks: true,
  });
  const curves = [100, 1000].map((n) => s("path", { fill: n === 100 ? C.blue : C.green, "fill-opacity": 0.25, stroke: n === 100 ? C.blue : C.green, "stroke-width": 3 }, R.inner));
  frame((t) => {
    [100, 1000].forEach((n, j) => {
      const g = smooth(prog(t, j ? 92 : 90, 1.2));
      let d = `M${R.px(0)},${R.py(0)}`;
      for (let k = 0; k <= 0.25 * n; k++) d += `L${R.px(k / n).toFixed(1)},${R.py(binomPMF(n, P_BUY, k) * n * g).toFixed(1)}`;
      d += `L${R.px(0.25)},${R.py(0)}Z`;
      set(curves[j], { d, opacity: g > 0 ? 1 : 0 });
    });
  });
  life(text("{blue:100 visitors}", { x: 1560, y: 520 }, { size: 28 }), 90.6, 105.6, "fade");
  life(text("{green:1,000 visitors}", { x: 1440, y: 330 }, { size: 28 }), 92.6, 105.6, "fade");
}

// ---------------- 7: end (106 – 116) ----------------
v.endCard(106.4, 115, [
  { tex: "P(\\K = k) = \\binom{\\nn}{k}\\pp^{\\,k}(1-\\pp)^{\\nn-k} \\qquad E[\\K] = \\nn\\pp \\qquad \\operatorname{SD}(\\hat{\\pp}) = \\sqrt{\\tfrac{\\pp(1-\\pp)}{\\nn}}", size: 46, y: 230 },
  { text: "One visitor is a coin flip. A thousand are a pattern.", size: 36, y: 400 },
  { text: "Arjun Chidambaram Subbiah", size: 44, y: 700 },
  { text: "Data science, one concept at a time", size: 32, color: C.dim, y: 770 },
  { text: "arjunchidambaram.github.io", size: 30, color: C.blue, y: 860 },
]);
v.ready();
