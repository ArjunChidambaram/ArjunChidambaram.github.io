/**
 * Support vector machine explainer data and solver, shared by the videos and
 * the blog article.
 *
 * 30 store visitors: minutes on the product page (x1), pages viewed (x2), and
 * whether they bought (+1) or not (-1).
 */

export const X1 = [4.9, 3.9, 7.9, 2.2, 9.2, 1.5, 4.5, 1.2, 11.1, 4.4, 6.5, 10.2, 6.8, 3.4, 9.5, 6.6, 1.2, 9.8, 10.3, 2.6, 3.1, 2.3, 6.7, 3.7, 3.7, 10.4, 7.1, 1.5, 0.6, 11.2];
export const X2 = [4.5, 11.4, 3.3, 1.3, 4.6, 1.1, 4.0, 8.2, 9.2, 4.8, 7.6, 1.5, 6.1, 5.7, 3.2, 7.8, 9.2, 9.4, 3.5, 3.6, 4.8, 9.7, 1.1, 6.5, 5.2, 3.7, 4.6, 3.6, 7.2, 4.6];
export const Y = [-1, 1, 1, -1, 1, -1, -1, -1, 1, 1, 1, 1, 1, -1, 1, 1, -1, 1, 1, -1, -1, -1, -1, -1, -1, 1, -1, -1, -1, 1];

export const N = Y.length;
export type SVM = { w: [number, number]; b: number; alpha: number[]; C: number };

/**
 * Linear soft-margin SVM, solved exactly in the dual with SMO using the
 * maximal-violating-pair rule (the same idea as libsvm, which scikit-learn's SVC uses).
 */
export function fitSVM(C: number, xs1 = X1, xs2 = X2, ys = Y, tol = 1e-6): SVM {
  const n = ys.length;
  const K = (i: number, j: number) => xs1[i] * xs1[j] + xs2[i] * xs2[j];
  const alpha = new Array(n).fill(0);
  // gradient of the dual objective: G_i = y_i * f(x_i) - 1 (without bias)
  const G = new Array(n).fill(-1);
  for (let iter = 0; iter < 100000; iter++) {
    let i = -1;
    let gmax = -Infinity;
    let j = -1;
    let gmin = Infinity;
    for (let t = 0; t < n; t++) {
      const v = -ys[t] * G[t];
      const upOk = (ys[t] === 1 && alpha[t] < C) || (ys[t] === -1 && alpha[t] > 0);
      const lowOk = (ys[t] === 1 && alpha[t] > 0) || (ys[t] === -1 && alpha[t] < C);
      if (upOk && v > gmax) {
        gmax = v;
        i = t;
      }
      if (lowOk && v < gmin) {
        gmin = v;
        j = t;
      }
    }
    if (i < 0 || j < 0 || gmax - gmin < tol) break;
    // analytic two-variable update
    const eta = Math.max(1e-12, K(i, i) + K(j, j) - 2 * K(i, j));
    const ai = alpha[i];
    const aj = alpha[j];
    // move along direction that keeps sum(y*alpha) fixed
    let delta = (gmax - gmin) / eta;
    // bounds for alpha_i (step delta on y_i * alpha_i) and alpha_j
    const capI = ys[i] === 1 ? C - ai : ai;
    const capJ = ys[j] === 1 ? aj : C - aj;
    delta = Math.min(delta, capI, capJ);
    alpha[i] = ai + ys[i] * delta;
    alpha[j] = aj - ys[j] * delta;
    const di = alpha[i] - ai;
    const dj = alpha[j] - aj;
    for (let t = 0; t < n; t++) G[t] += ys[t] * (ys[i] * di * K(t, i) + ys[j] * dj * K(t, j));
  }
  const w: [number, number] = [0, 0];
  for (let t = 0; t < n; t++) {
    w[0] += alpha[t] * ys[t] * xs1[t];
    w[1] += alpha[t] * ys[t] * xs2[t];
  }
  // bias from free support vectors (0 < alpha < C): y_t (w.x_t + b) = 1
  let bs = 0;
  let cnt = 0;
  for (let t = 0; t < n; t++)
    if (alpha[t] > 1e-8 && alpha[t] < C - 1e-8) {
      bs += ys[t] - (w[0] * xs1[t] + w[1] * xs2[t]);
      cnt++;
    }
  let b: number;
  if (cnt) b = bs / cnt;
  else {
    // no free vectors: take the midpoint of the feasible range
    let lo = -Infinity;
    let hi = Infinity;
    for (let t = 0; t < n; t++) {
      const fx = w[0] * xs1[t] + w[1] * xs2[t];
      const v = ys[t] - fx;
      if ((ys[t] === 1 && alpha[t] < C - 1e-8) || (ys[t] === -1 && alpha[t] > 1e-8)) lo = Math.max(lo, v);
      else hi = Math.min(hi, v);
    }
    b = isFinite(lo) && isFinite(hi) ? (lo + hi) / 2 : isFinite(lo) ? lo : hi;
  }
  return { w, b, alpha, C };
}

export const decision = (m: SVM, x1: number, x2: number) => m.w[0] * x1 + m.w[1] * x2 + m.b;
export const norm = (m: SVM) => Math.hypot(m.w[0], m.w[1]);
export const marginWidth = (m: SVM) => 2 / norm(m);
export const supportVectors = (m: SVM) => m.alpha.map((a, i) => (a > 1e-6 ? i : -1)).filter((i) => i >= 0);
export const hinge = (m: SVM) => Y.reduce((s, y, i) => s + Math.max(0, 1 - y * decision(m, X1[i], X2[i])), 0);
export const objective = (m: SVM) => 0.5 * (m.w[0] ** 2 + m.w[1] ** 2) + m.C * hinge(m);
export const accuracy = (m: SVM) => Y.reduce((s, y, i) => s + (Math.sign(decision(m, X1[i], X2[i])) === y ? 1 : 0), 0) / N;

export const MODEL = fitSVM(1);
