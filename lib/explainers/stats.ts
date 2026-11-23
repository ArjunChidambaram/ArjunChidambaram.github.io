/**
 * Shared statistics for the probability / LLN / CLT / A-B testing /
 * bootstrap explainers. One running example: visitors to a store's checkout
 * page, each of whom buys with some probability.
 */

/** Seeded uniform random numbers (mulberry32), so every chart and video shows the same draws. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal draws (Box–Muller) from a uniform generator. */
export function gauss(r: () => number) {
  let u = 0;
  while (u === 0) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

// ---------- special functions ----------
/** log Γ(x), Lanczos approximation (|error| < 1e-14 for x > 0). */
export function lgamma(x: number): number {
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
export const logChoose = (n: number, k: number) => lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
export const choose = (n: number, k: number) => Math.round(Math.exp(logChoose(n, k)));
export const binomPMF = (n: number, p: number, k: number) =>
  k < 0 || k > n ? 0 : p === 0 ? (k === 0 ? 1 : 0) : p === 1 ? (k === n ? 1 : 0) : Math.exp(logChoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
export const binomCDF = (n: number, p: number, k: number) => {
  let s = 0;
  for (let i = 0; i <= k; i++) s += binomPMF(n, p, i);
  return Math.min(1, s);
};

/** erfc with relative error < 1.2e-7 (Numerical Recipes). */
export function erfc(x: number) {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))
    );
  return x >= 0 ? r : 2 - r;
}
export const normPDF = (x: number, mu = 0, sd = 1) => Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
export const normCDF = (x: number, mu = 0, sd = 1) => 0.5 * erfc(-(x - mu) / (sd * Math.SQRT2));
/** Inverse standard normal CDF (Acklam's algorithm, |relative error| < 1.2e-9). */
export function normQuantile(p: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425;
  if (p < lo) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - lo) return -normQuantile(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// ---------- probability post ----------
/** Each visitor buys with probability 10%. */
export const P_BUY = 0.1;
export const DAY_N = 100;

/** Bernoulli draws for `n` visitors from a seed. */
export const visitors = (n: number, p: number, seed: number) => {
  const r = rng(seed);
  return Array.from({ length: n }, () => (r() < p ? 1 : 0));
};

/**
 * 1,000 simulated days of 100 visitors each, all from one seeded stream.
 * DAY_GRID(d) is who bought on day d; DAYS[d] is how many bought.
 */
const DAY_DRAWS: number[] = (() => {
  const r = rng(99);
  return Array.from({ length: 1000 * DAY_N }, () => (r() < P_BUY ? 1 : 0));
})();
export const DAY_GRID = (d: number) => DAY_DRAWS.slice(d * DAY_N, (d + 1) * DAY_N);
export const DAYS: number[] = Array.from({ length: 1000 }, (_, d) => DAY_GRID(d).reduce((a, b) => a + b, 0));
export const histogram = (xs: number[], lo: number, hi: number) => {
  const h = new Array(hi - lo + 1).fill(0);
  for (const x of xs) if (x >= lo && x <= hi) h[x - lo]++;
  return h;
};
export const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
export const sd = (xs: number[], ddof = 0) => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - ddof));
};

// ---------- law of large numbers post ----------
export const STREAM_N = 10000;
/** Log-spaced checkpoints 1 … 10,000 where running rates are recorded. */
export const CHECKS: number[] = (() => {
  const out = new Set<number>();
  for (let i = 0; i <= 240; i++) out.add(Math.round(Math.pow(10, (4 * i) / 240)));
  return Array.from(out).sort((a, b) => a - b);
})();
/**
 * Running conversion rate of a stream of visitors at each checkpoint, plus the
 * running count of buyers. Stream 0 is "our" stream; streams 1–29 are
 * parallel replays of the same page.
 */
export type Stream = { rate: number[]; buyers: number[] };
export const STREAMS: Stream[] = Array.from({ length: 30 }, (_, s) => {
  const r = rng(5000 + s);
  const rate: number[] = [];
  const buyers: number[] = [];
  let k = 0;
  let c = 0;
  for (let i = 1; i <= STREAM_N; i++) {
    if (r() < P_BUY) k++;
    if (i === CHECKS[c]) {
      rate.push(k / i);
      buyers.push(k);
      c++;
    }
  }
  return { rate, buyers };
});
/** Exact P(|K/n − p| > eps) for K ~ Binomial(n, p). */
export function tailProb(n: number, p: number, eps: number) {
  let s = 0;
  for (let k = 0; k <= n; k++) if (Math.abs(k / n - p) > eps + 1e-12) s += binomPMF(n, p, k);
  return s;
}
export const chebyshev = (n: number, p: number, eps: number) => (p * (1 - p)) / (n * eps * eps);

/** 60 product pages with the same true 10% rate but very different traffic. */
export type Page = { n: number; k: number };
export const PAGES: Page[] = (() => {
  const r = rng(311);
  return Array.from({ length: 60 }, () => {
    const n = Math.round(Math.pow(10, 1.3 + r() * 3));
    let k = 0;
    for (let i = 0; i < n; i++) if (r() < P_BUY) k++;
    return { n, k };
  });
})();
/** The stream the story follows: an early lucky streak (18 buyers in the first 100). */
export const OUR = 23;
export const idxOf = (n: number) => CHECKS.indexOf(n);
