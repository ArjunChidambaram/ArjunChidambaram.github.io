/**
 * Decision tree and random forest explainer data and algorithms, shared by
 * the videos and the blog articles so every number matches.
 *
 * Store visitors: minutes on the product page, number of past purchases, and
 * whether they bought. 40 for training, 500 held out for testing.
 */

export const MINUTES = [5.4, 3.1, 10.1, 10.2, 9.1, 5.7, 9.8, 5.5, 2.7, 5.9, 8.2, 11.0, 6.8, 1.7, 1.3, 11.8, 5.3, 7.1, 4.3, 9.0, 9.4, 6.7, 2.5, 6.6, 11.5, 2.0, 11.5, 2.0, 8.3, 1.0, 4.7, 6.7, 10.9, 6.2, 2.6, 10.4, 4.1, 2.2, 3.6, 7.4];
export const PAST = [1, 6, 0, 1, 1, 2, 1, 4, 7, 7, 3, 4, 3, 0, 5, 8, 7, 2, 4, 6, 3, 8, 0, 5, 6, 6, 3, 8, 6, 3, 1, 6, 8, 5, 3, 1, 8, 5, 0, 7];
export const BOUGHT = [0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0];
export const TEST_MINUTES = [11.2, 5.2, 9.0, 10.0, 6.6, 8.6, 3.0, 2.2, 6.3, 7.6, 1.9, 10.3, 6.5, 11.1, 9.1, 11.4, 11.9, 4.8, 3.0, 4.4, 9.1, 2.9, 7.1, 1.3, 1.0, 2.9, 8.0, 11.7, 10.8, 10.3, 7.6, 5.5, 7.2, 3.2, 2.9, 1.7, 9.3, 0.9, 5.3, 5.8, 3.0, 7.0, 0.8, 11.4, 8.7, 6.6, 9.8, 8.3, 6.8, 3.7, 3.2, 3.8, 4.4, 3.5, 3.5, 5.3, 9.8, 5.6, 1.7, 11.4, 3.3, 7.0, 6.7, 9.9, 11.1, 11.5, 10.6, 5.2, 7.3, 8.2, 11.5, 3.2, 5.5, 2.4, 1.8, 11.3, 1.6, 1.2, 3.0, 9.7, 3.2, 2.3, 2.4, 5.0, 10.9, 1.5, 8.8, 7.9, 7.2, 0.7, 4.2, 10.7, 3.2, 5.8, 1.2, 5.8, 1.6, 8.2, 1.6, 4.8, 1.2, 9.2, 0.6, 6.7, 8.3, 7.9, 11.7, 9.6, 10.1, 10.9, 3.2, 4.1, 6.5, 9.2, 4.6, 4.7, 0.6, 7.2, 11.5, 1.3, 3.5, 9.1, 9.0, 3.3, 8.5, 9.4, 3.7, 4.5, 0.6, 1.4, 10.5, 3.2, 7.4, 5.7, 7.5, 11.4, 8.1, 1.0, 7.4, 4.5, 1.9, 11.8, 7.4, 1.1, 0.9, 6.3, 4.0, 5.9, 8.4, 10.9, 3.3, 5.5, 3.8, 11.3, 11.6, 6.0, 11.5, 4.1, 7.0, 9.0, 6.9, 7.8, 8.0, 8.9, 9.1, 7.3, 4.6, 8.2, 9.4, 9.4, 4.0, 11.9, 3.9, 8.8, 6.3, 6.8, 8.6, 4.9, 7.6, 5.8, 8.0, 3.4, 6.1, 7.9, 7.3, 9.8, 2.3, 2.2, 2.2, 6.9, 1.1, 5.8, 1.1, 7.7, 11.3, 7.6, 4.0, 11.9, 10.5, 2.8, 5.9, 2.3, 6.2, 7.0, 1.1, 11.1, 3.3, 2.1, 9.1, 3.0, 6.6, 1.6, 7.5, 2.4, 11.3, 9.6, 11.3, 4.3, 11.3, 9.7, 5.0, 3.1, 8.7, 4.7, 3.9, 4.2, 8.7, 10.4, 1.6, 2.4, 6.4, 8.3, 8.4, 2.3, 1.2, 6.1, 1.3, 8.1, 7.7, 5.7, 3.7, 8.2, 3.3, 6.0, 10.5, 2.2, 4.2, 2.0, 2.4, 1.6, 10.4, 4.2, 10.4, 6.9, 1.8, 5.7, 6.6, 11.2, 7.8, 3.3, 4.1, 4.8, 1.8, 3.0, 5.6, 7.3, 11.2, 8.3, 10.7, 1.8, 8.2, 4.6, 8.5, 1.8, 7.7, 5.6, 5.4, 11.2, 3.7, 1.4, 4.3, 9.4, 10.1, 1.8, 5.5, 0.9, 4.9, 6.2, 8.9, 4.6, 11.8, 11.8, 8.2, 10.9, 5.3, 8.1, 9.6, 8.6, 10.0, 11.0, 0.5, 5.5, 1.1, 0.7, 2.9, 4.1, 9.3, 5.2, 6.6, 5.7, 10.8, 8.8, 0.9, 1.9, 2.5, 0.8, 10.9, 11.2, 0.9, 1.2, 9.5, 4.5, 8.5, 11.3, 5.2, 6.3, 3.2, 5.3, 8.8, 1.1, 9.8, 2.9, 1.8, 11.9, 2.1, 8.7, 1.7, 8.7, 10.8, 4.5, 1.0, 9.4, 4.8, 9.0, 3.0, 1.1, 4.6, 4.4, 2.6, 1.9, 7.8, 4.9, 8.6, 4.3, 9.4, 1.9, 3.5, 9.5, 5.4, 7.1, 4.9, 5.2, 9.4, 5.0, 9.8, 4.7, 3.0, 3.7, 6.7, 9.5, 0.9, 1.2, 5.7, 7.2, 9.2, 6.8, 2.6, 5.9, 6.8, 7.5, 2.1, 1.8, 11.3, 7.0, 3.0, 3.7, 8.3, 5.2, 11.8, 10.7, 4.7, 5.8, 4.0, 8.6, 11.0, 3.9, 10.3, 4.8, 5.9, 9.4, 11.5, 7.8, 6.9, 2.8, 3.8, 1.8, 4.2, 3.0, 5.9, 1.9, 8.2, 11.3, 5.8, 9.5, 9.2, 3.2, 6.8, 4.2, 7.8, 4.9, 10.6, 7.4, 3.9, 8.9, 1.9, 1.3, 8.0, 5.1, 7.5, 5.0, 9.8, 5.5, 10.1, 7.8, 0.8, 5.7, 8.1, 7.2, 1.2, 3.3, 8.8, 3.1, 4.6, 10.4, 3.9, 3.7, 4.8, 7.0, 8.2, 9.4, 5.8, 6.5, 3.4, 2.7, 0.9, 5.9, 1.9, 11.5, 5.6, 3.5, 4.8, 9.4, 8.3, 5.4, 10.2, 2.8, 2.8, 2.0, 7.6, 9.1, 1.9, 6.5, 4.6, 2.0, 7.6, 1.5, 7.5, 8.1, 3.1, 2.0, 10.7, 4.1, 1.5, 11.0, 4.0, 11.5, 6.5, 4.8, 9.1, 7.4, 10.7, 5.3, 0.8, 10.2, 2.4, 11.2, 9.2, 6.8, 2.5, 2.2];
export const TEST_PAST = [8, 4, 0, 7, 7, 2, 4, 4, 4, 2, 1, 3, 2, 2, 0, 2, 6, 5, 3, 4, 8, 6, 2, 5, 2, 0, 6, 2, 0, 7, 1, 8, 4, 5, 6, 8, 6, 6, 0, 0, 2, 6, 4, 4, 4, 5, 3, 2, 1, 7, 8, 8, 6, 1, 6, 4, 3, 5, 4, 0, 7, 2, 2, 7, 6, 4, 0, 0, 4, 2, 8, 5, 5, 0, 4, 4, 5, 8, 4, 1, 4, 1, 2, 2, 6, 2, 4, 8, 3, 1, 4, 5, 3, 8, 5, 7, 4, 7, 7, 5, 4, 6, 4, 0, 5, 3, 0, 7, 6, 5, 1, 0, 7, 1, 2, 5, 3, 0, 7, 5, 2, 3, 6, 4, 7, 2, 6, 0, 7, 2, 0, 6, 0, 2, 7, 4, 2, 5, 4, 2, 2, 8, 6, 4, 5, 1, 5, 3, 6, 0, 8, 0, 3, 1, 3, 7, 2, 2, 6, 7, 6, 1, 4, 0, 3, 2, 6, 1, 0, 6, 2, 6, 8, 0, 6, 5, 0, 4, 8, 5, 0, 1, 6, 0, 0, 3, 5, 3, 5, 5, 2, 8, 3, 8, 0, 1, 3, 0, 0, 5, 4, 4, 6, 2, 1, 2, 2, 4, 0, 5, 4, 1, 3, 7, 1, 8, 1, 2, 2, 2, 4, 3, 6, 7, 1, 3, 0, 7, 8, 7, 0, 6, 6, 0, 2, 3, 8, 7, 0, 7, 5, 4, 0, 8, 1, 5, 6, 1, 5, 4, 4, 8, 0, 1, 7, 1, 6, 2, 4, 6, 5, 5, 3, 4, 8, 5, 1, 1, 7, 4, 5, 4, 1, 6, 1, 4, 8, 2, 2, 6, 3, 6, 8, 4, 6, 1, 1, 7, 1, 6, 5, 3, 0, 6, 6, 7, 3, 6, 6, 0, 8, 2, 8, 6, 2, 7, 0, 8, 5, 0, 6, 4, 3, 0, 3, 4, 6, 7, 5, 6, 5, 1, 8, 1, 5, 7, 1, 8, 5, 5, 3, 5, 2, 8, 6, 3, 6, 1, 3, 6, 3, 1, 7, 6, 0, 5, 5, 5, 5, 1, 1, 2, 8, 6, 1, 6, 3, 2, 8, 0, 7, 1, 4, 6, 5, 4, 2, 7, 7, 3, 5, 5, 7, 4, 2, 4, 1, 1, 0, 7, 2, 7, 0, 2, 8, 4, 1, 7, 2, 5, 6, 1, 8, 1, 6, 8, 8, 3, 3, 5, 0, 6, 6, 3, 7, 1, 4, 1, 0, 2, 6, 5, 0, 1, 0, 1, 4, 7, 8, 6, 8, 5, 6, 0, 7, 3, 7, 1, 1, 4, 7, 8, 7, 5, 2, 8, 4, 6, 4, 3, 3, 1, 4, 3, 2, 0, 6, 3, 8, 5, 3, 1, 0, 0, 2, 0, 6, 6, 4, 5, 2, 3, 0, 8, 2, 6, 3, 8, 4, 2, 8, 2, 3, 3, 8, 1, 0, 2, 7, 8, 1, 8, 8, 7, 8, 1, 2, 5, 3, 6, 2, 4, 7, 3, 5, 7, 5, 6, 4, 6];
export const TEST_BOUGHT = [1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1];

export const FEATURES = ["minutes on page", "past purchases"] as const;
export type Point = { x: [number, number]; y: number };
export const TRAIN: Point[] = MINUTES.map((m, i) => ({ x: [m, PAST[i]], y: BOUGHT[i] }));
export const TEST: Point[] = TEST_MINUTES.map((m, i) => ({ x: [m, TEST_PAST[i]], y: TEST_BOUGHT[i] }));

export function gini(pts: Point[]) {
  if (!pts.length) return 0;
  const p = pts.reduce((s, q) => s + q.y, 0) / pts.length;
  return 1 - p * p - (1 - p) * (1 - p);
}
export const countBuy = (pts: Point[]) => pts.reduce((s, q) => s + q.y, 0);

export type Candidate = { feature: 0 | 1; threshold: number; left: Point[]; right: Point[]; score: number };

/** Every midpoint split on the given features, scored by weighted Gini (lower is better). */
export function candidates(pts: Point[], features: (0 | 1)[] = [0, 1]): Candidate[] {
  const out: Candidate[] = [];
  for (const f of features) {
    const vals = Array.from(new Set(pts.map((p) => p.x[f]))).sort((a, b) => a - b);
    for (let i = 0; i < vals.length - 1; i++) {
      const threshold = Math.round(((vals[i] + vals[i + 1]) / 2) * 1e6) / 1e6;
      const left = pts.filter((p) => p.x[f] <= threshold);
      const right = pts.filter((p) => p.x[f] > threshold);
      const score = (left.length * gini(left) + right.length * gini(right)) / pts.length;
      out.push({ feature: f, threshold, left, right, score });
    }
  }
  return out;
}
export function bestSplit(pts: Point[], features: (0 | 1)[] = [0, 1]): Candidate | null {
  let best: Candidate | null = null;
  for (const c of candidates(pts, features)) if (!best || c.score < best.score - 1e-12) best = c;
  return best;
}

export type Node =
  | { leaf: true; n: number; buy: number; pred: number; depth: number }
  | { leaf: false; n: number; buy: number; pred: number; depth: number; feature: 0 | 1; threshold: number; left: Node; right: Node; gain: number };

/** CART with Gini. `pickFeatures` lets the random forest restrict features at each split. */
export function grow(pts: Point[], maxDepth: number, depth = 0, pickFeatures?: () => (0 | 1)[]): Node {
  const n = pts.length;
  const buy = countBuy(pts);
  const pred = buy * 2 >= n ? 1 : 0;
  const pure = buy === 0 || buy === n;
  if (depth >= maxDepth || pure || n < 2) return { leaf: true, n, buy, pred, depth };
  const s = bestSplit(pts, pickFeatures ? pickFeatures() : [0, 1]);
  if (!s || s.score >= gini(pts) - 1e-12) return { leaf: true, n, buy, pred, depth };
  return {
    leaf: false,
    n,
    buy,
    pred,
    depth,
    feature: s.feature,
    threshold: s.threshold,
    gain: gini(pts) - s.score,
    left: grow(s.left, maxDepth, depth + 1, pickFeatures),
    right: grow(s.right, maxDepth, depth + 1, pickFeatures),
  };
}
export function predict(node: Node, x: [number, number]): number {
  while (!node.leaf) node = x[node.feature] <= node.threshold ? node.left : node.right;
  return node.pred;
}
/** fraction of buyers in the leaf (the tree's "probability") */
export function leafShare(node: Node, x: [number, number]): number {
  while (!node.leaf) node = x[node.feature] <= node.threshold ? node.left : node.right;
  return node.buy / node.n;
}
export const accuracy = (predictFn: (x: [number, number]) => number, pts: Point[]) =>
  pts.reduce((s, p) => s + (predictFn(p.x) === p.y ? 1 : 0), 0) / pts.length;
export function leaves(node: Node): number {
  return node.leaf ? 1 : leaves(node.left) + leaves(node.right);
}

export const TREE2 = grow(TRAIN, 2);
export const DEPTHS = [1, 2, 3, 4, 5, 6, 7, 8];
export const DEPTH_CURVE = DEPTHS.map((d) => {
  const t = grow(TRAIN, d);
  return { depth: d, train: accuracy((x) => predict(t, x), TRAIN), test: accuracy((x) => predict(t, x), TEST), leaves: leaves(t) };
});

// ---------------- random forest ----------------
/** small seeded RNG so the forest is identical on every load */
export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type ForestTree = { tree: Node; inBag: boolean[]; counts: number[] };

/** Bagging + one random feature considered per split (max_features = 1 of 2), fully grown trees. */
export function growForest(nTrees: number, seed = 7, maxDepth = 12): ForestTree[] {
  const r = rng(seed);
  const out: ForestTree[] = [];
  for (let t = 0; t < nTrees; t++) {
    const inBag = TRAIN.map(() => false);
    const counts = TRAIN.map(() => 0);
    const sample: Point[] = [];
    for (let i = 0; i < TRAIN.length; i++) {
      const j = Math.floor(r() * TRAIN.length);
      inBag[j] = true;
      counts[j]++;
      sample.push(TRAIN[j]);
    }
    const tree = grow(sample, maxDepth, 0, () => [r() < 0.5 ? 0 : 1]);
    out.push({ tree, inBag, counts });
  }
  return out;
}
export const FOREST = growForest(200);

/** share of trees voting "buy" */
export const voteShare = (forest: ForestTree[], x: [number, number]) => forest.reduce((s, f) => s + predict(f.tree, x), 0) / forest.length;
export const forestPredict = (forest: ForestTree[], x: [number, number]) => (voteShare(forest, x) >= 0.5 ? 1 : 0);

/** out-of-bag accuracy: each training point is judged only by trees that never saw it */
export function oobAccuracy(forest: ForestTree[]) {
  let right = 0;
  let counted = 0;
  TRAIN.forEach((p, i) => {
    const judges = forest.filter((f) => !f.inBag[i]);
    if (!judges.length) return;
    const share = judges.reduce((s, f) => s + predict(f.tree, p.x), 0) / judges.length;
    counted++;
    if ((share >= 0.5 ? 1 : 0) === p.y) right++;
  });
  return counted ? right / counted : 0;
}

export const FOREST_SIZES = [1, 2, 3, 5, 10, 20, 50, 100, 200];
export const FOREST_CURVE = FOREST_SIZES.map((n) => {
  const f = FOREST.slice(0, n);
  return { trees: n, train: accuracy((x) => forestPredict(f, x), TRAIN), test: accuracy((x) => forestPredict(f, x), TEST), oob: oobAccuracy(f) };
});

export type Rect = { x0: number; x1: number; y0: number; y1: number; pred: number; n: number; buy: number; depth: number };
/** The axis-aligned regions a tree carves the plane into (bounds in data units). */
export function regions(node: Node, b = { x0: 0, x1: 12.5, y0: -0.5, y1: 8.5 }): Rect[] {
  if (node.leaf) return [{ ...b, pred: node.pred, n: node.n, buy: node.buy, depth: node.depth }];
  const t = node.threshold;
  if (node.feature === 0)
    return [...regions(node.left, { ...b, x1: Math.min(b.x1, t) }), ...regions(node.right, { ...b, x0: Math.max(b.x0, t) })];
  return [...regions(node.left, { ...b, y1: Math.min(b.y1, t) }), ...regions(node.right, { ...b, y0: Math.max(b.y0, t) })];
}
/** The questions a point answers on its way to a leaf. */
export function path(node: Node, x: [number, number]) {
  const steps: { feature: 0 | 1; threshold: number; yes: boolean; n: number; buy: number }[] = [];
  while (!node.leaf) {
    const yes = x[node.feature] <= node.threshold;
    steps.push({ feature: node.feature, threshold: node.threshold, yes, n: node.n, buy: node.buy });
    node = yes ? node.left : node.right;
  }
  return { steps, leaf: node };
}
