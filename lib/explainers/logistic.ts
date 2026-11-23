/**
 * Logistic regression explainer data and math, shared by the videos and the
 * blog article so every number matches.
 *
 * 25 visitors to an online store: minutes spent on a product page, and
 * whether they bought (1) or not (0).
 */

export const XS = [0.6, 0.9, 1.7, 1.8, 2.1, 2.2, 2.3, 3.2, 3.6, 3.9, 4.0, 4.4, 4.5, 5.4, 6.4, 6.6, 7.2, 7.4, 8.0, 8.3, 8.4, 9.0, 9.9, 10.1, 11.9];
export const YS = [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1];
export const N = XS.length;

export type Coef = { b0: number; b1: number };

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
export const prob = (c: Coef, x: number) => sigmoid(c.b0 + c.b1 * x);

/** mean log loss (cross-entropy) */
export function logLoss(c: Coef, xs = XS, ys = YS) {
  let s = 0;
  for (let i = 0; i < xs.length; i++) {
    const p = Math.min(1 - 1e-12, Math.max(1e-12, prob(c, xs[i])));
    s += ys[i] ? -Math.log(p) : -Math.log(1 - p);
  }
  return s / xs.length;
}

/** gradient of the mean log loss */
export function gradient(c: Coef, xs = XS, ys = YS) {
  let g0 = 0;
  let g1 = 0;
  for (let i = 0; i < xs.length; i++) {
    const r = prob(c, xs[i]) - ys[i];
    g0 += r;
    g1 += r * xs[i];
  }
  return { g0: g0 / xs.length, g1: g1 / xs.length };
}

export const ALPHA = 0.1;
export const GD_STEPS = 5000;

/** Plain gradient descent from (0, 0) with α = 0.1; path[k] is after k steps. */
export const GD_PATH: Coef[] = (() => {
  const path: Coef[] = [{ b0: 0, b1: 0 }];
  let c = { b0: 0, b1: 0 };
  for (let k = 0; k < GD_STEPS; k++) {
    const g = gradient(c);
    c = { b0: c.b0 - ALPHA * g.g0, b1: c.b1 - ALPHA * g.g1 };
    path.push(c);
  }
  return path;
})();

/** Maximum-likelihood fit (Newton's method), the answer gradient descent converges to. */
export const BEST: Coef = (() => {
  let b0 = 0;
  let b1 = 0;
  for (let it = 0; it < 50; it++) {
    let g0 = 0, g1 = 0, h00 = 0, h01 = 0, h11 = 0;
    for (let i = 0; i < N; i++) {
      const p = sigmoid(b0 + b1 * XS[i]);
      const w = p * (1 - p);
      g0 += p - YS[i];
      g1 += (p - YS[i]) * XS[i];
      h00 += w;
      h01 += w * XS[i];
      h11 += w * XS[i] * XS[i];
    }
    const det = h00 * h11 - h01 * h01;
    b0 -= (h11 * g0 - h01 * g1) / det;
    b1 -= (-h01 * g0 + h00 * g1) / det;
  }
  return { b0, b1 };
})();

export const BOUNDARY = -BEST.b0 / BEST.b1;
export const L_BEST = logLoss(BEST);

/** The ordinary least-squares line through the 0/1 data (to show why a line fails). */
export const OLS: Coef = (() => {
  const mx = XS.reduce((a, b) => a + b, 0) / N;
  const my = YS.reduce((a, b) => a + b, 0) / N;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < N; i++) {
    sxy += (XS[i] - mx) * (YS[i] - my);
    sxx += (XS[i] - mx) ** 2;
  }
  const b1 = sxy / sxx;
  return { b0: my - b1 * mx, b1 };
})();

export function confusion(c: Coef, threshold = 0.5) {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (let i = 0; i < N; i++) {
    const yhat = prob(c, XS[i]) >= threshold ? 1 : 0;
    if (yhat && YS[i]) tp++;
    else if (yhat && !YS[i]) fp++;
    else if (!yhat && !YS[i]) tn++;
    else fn++;
  }
  return { tp, fp, tn, fn };
}
