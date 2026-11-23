import { useMemo, useState } from "react";

import { DM, M } from "@/components/explainers/Tex";
import { Code, H2, Narrow, P, Scrolly, Slider, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import {
  DEPTH_CURVE,
  TEST,
  TRAIN,
  TREE2,
  accuracy,
  candidates,
  countBuy,
  gini,
  grow,
  leaves,
  path,
  predict,
  regions,
  type Node,
  type Rect,
} from "lib/explainers/tree";

/**
 * "Decision Trees" — MLU-Explain style article: videos, a scrolling story,
 * Gini impurity with every candidate split scored, a depth explorer showing
 * overfitting, feature importance, caveats, code.
 */

const BUY = "#05CE91";
const NO = "#94A3B8";
const SPLIT = "#D4A017";
const N = TRAIN.length;
const B = countBuy(TRAIN);
const ROOT = TREE2 as Extract<Node, { leaf: false }>;
const F = ["minutes", "past purchases"];

// ---------- scatter with regions ----------
const CW = 640;
const CH = 470;
const PAD = { l: 50, r: 16, t: 16, b: 50 };
const XR: [number, number] = [0, 12.5];
const YR: [number, number] = [-0.5, 8.5];
const sx = (x: number) => PAD.l + ((x - XR[0]) / (XR[1] - XR[0])) * (CW - PAD.l - PAD.r);
const sy = (y: number) => CH - PAD.b - ((y - YR[0]) / (YR[1] - YR[0])) * (CH - PAD.t - PAD.b);

type Line = { x1: number; x2: number; y1: number; y2: number };
export const HEAT_GX = 50;
export const HEAT_GY = 36;
/** grid cell centres in data units, row-major from the bottom-left */
export const HEAT_CELLS: [number, number][] = Array.from({ length: HEAT_GX * HEAT_GY }, (_, k) => [
  ((k % HEAT_GX) + 0.5) * (12.5 / HEAT_GX),
  -0.5 + (Math.floor(k / HEAT_GX) + 0.5) * (9 / HEAT_GY),
]);
export function splitLines(node: Node, b = { x0: 0, x1: 12.5, y0: -0.5, y1: 8.5 }, out: Line[] = []): Line[] {
  if (node.leaf) return out;
  if (node.feature === 0) {
    out.push({ x1: node.threshold, x2: node.threshold, y1: b.y0, y2: b.y1 });
    splitLines(node.left, { ...b, x1: node.threshold }, out);
    splitLines(node.right, { ...b, x0: node.threshold }, out);
  } else {
    out.push({ x1: b.x0, x2: b.x1, y1: node.threshold, y2: node.threshold });
    splitLines(node.left, { ...b, y1: node.threshold }, out);
    splitLines(node.right, { ...b, y0: node.threshold }, out);
  }
  return out;
}

export const Scatter: React.FC<{
  rects?: Rect[];
  lines?: Line[];
  highlight?: [number, number] | null;
  label?: string;
  points?: typeof TRAIN;
  /** vote share per heat-map cell (row-major, HEAT_GX x HEAT_GY), for the random forest */
  heat?: number[] | null;
  /** per-point radius multiplier and fade, for bootstrap samples */
  counts?: number[] | null;
}> = ({ rects = [], lines = [], highlight = null, label, points = TRAIN, heat = null, counts = null }) => (
  <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full h-auto" role="img" aria-label={label ?? "Visitors by minutes on page and past purchases"}>
    {heat &&
      heat.map((v, k) => {
        const i = k % HEAT_GX;
        const j = Math.floor(k / HEAT_GX);
        const w = (sx(12.5) - sx(0)) / HEAT_GX;
        const h = (sy(-0.5) - sy(8.5)) / HEAT_GY;
        return <rect key={k} x={sx(0) + i * w} y={sy(-0.5) - (j + 1) * h} width={w + 0.5} height={h + 0.5} fill={v >= 0.5 ? BUY : NO} opacity={0.06 + 0.36 * Math.abs(v - 0.5) * 2} />;
      })}
    {rects.map((r, i) => (
      <rect
        key={i}
        x={sx(Math.max(r.x0, XR[0]))}
        y={sy(Math.min(r.y1, YR[1]))}
        width={sx(Math.min(r.x1, XR[1])) - sx(Math.max(r.x0, XR[0]))}
        height={sy(Math.max(r.y0, YR[0])) - sy(Math.min(r.y1, YR[1]))}
        fill={r.pred ? BUY : NO}
        opacity={0.18}
      />
    ))}
    {[0, 2, 4, 6, 8].map((v) => (
      <text key={v} x={PAD.l - 10} y={sy(v) + 5} textAnchor="end" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
        {v}
      </text>
    ))}
    {[0, 2, 4, 6, 8, 10, 12].map((v) => (
      <text key={v} x={sx(v)} y={CH - PAD.b + 20} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
        {v}
      </text>
    ))}
    <line x1={PAD.l} x2={CW - PAD.r} y1={CH - PAD.b} y2={CH - PAD.b} className="stroke-gray-600 dark:stroke-gray-300" />
    <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={CH - PAD.b} className="stroke-gray-600 dark:stroke-gray-300" />
    <text x={(PAD.l + CW - PAD.r) / 2} y={CH - 8} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300 text-[14px]">
      Minutes on the product page
    </text>
    <text x={14} y={(PAD.t + CH - PAD.b) / 2} transform={`rotate(-90 14 ${(PAD.t + CH - PAD.b) / 2})`} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300 text-[14px]">
      Past purchases
    </text>
    {lines.map((l, i) => (
      <line key={i} x1={sx(l.x1)} x2={sx(l.x2)} y1={sy(l.y1)} y2={sy(l.y2)} stroke={SPLIT} strokeWidth={3} />
    ))}
    {points.map((p, i) => (
      <circle
        key={i}
        cx={sx(p.x[0])}
        cy={sy(p.x[1])}
        r={counts ? (counts[i] ? 5 + counts[i] * 3 : 4) : 6.5}
        opacity={counts && !counts[i] ? 0.3 : 1}
        fill={p.y ? BUY : NO}
        stroke="white"
        strokeWidth={1.5}
      />
    ))}
    {highlight && <circle cx={sx(highlight[0])} cy={sy(highlight[1])} r={11} fill="#9B59D0" stroke="white" strokeWidth={3} />}
  </svg>
);

// ---------- tree diagram ----------
const TreeDiagram: React.FC<{ node: Node; active?: boolean[] }> = ({ node }) => {
  const Box: React.FC<{ n: Node }> = ({ n }) =>
    n.leaf ? (
      <div className="rounded-md border px-2 py-1.5 text-center text-[13px] leading-tight" style={{ borderColor: n.pred ? BUY : NO }}>
        <div>
          {n.buy} of {n.n} bought
        </div>
        <div className="font-semibold" style={{ color: n.pred ? "#047857" : "#64748B" }}>
          → {n.pred ? "buy" : "no"}
        </div>
      </div>
    ) : (
      <div className="rounded-md border-2 px-2 py-1.5 text-center text-[14px] font-medium" style={{ borderColor: SPLIT }}>
        {F[n.feature]} ≤ {n.threshold}?
      </div>
    );
  const Sub: React.FC<{ n: Node }> = ({ n }) => (
    <div className="flex flex-col items-center gap-2">
      <Box n={n} />
      {!n.leaf && (
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="flex flex-col items-center">
            <span className="text-[12px] text-gray-500">yes</span>
            <Sub n={n.left} />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[12px] text-gray-500">no</span>
            <Sub n={n.right} />
          </div>
        </div>
      )}
    </div>
  );
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark p-4" role="img" aria-label="Tree diagram of the depth-2 decision tree">
      <Sub n={node} />
    </div>
  );
};

// ---------- candidate split table ----------
const SplitTable: React.FC = () => {
  const all = useMemo(() => candidates(TRAIN).sort((a, b) => a.score - b.score), []);
  const [sel, setSel] = useState(0);
  const c = all[sel];
  const bL = countBuy(c.left);
  const bR = countBuy(c.right);
  return (
    <div className="grid lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] gap-6 items-start">
      <div className="max-h-[480px] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark">
        <table className="w-full text-right text-[14px] tabular-nums">
          <thead className="sticky top-0 bg-white dark:bg-carddark shadow-sm">
            <tr>
              <th className="px-3 py-2 text-left font-normal">Question</th>
              <th className="px-3 py-2 font-normal">yes</th>
              <th className="px-3 py-2 font-normal">no</th>
              <th className="px-3 py-2 font-normal">weighted Gini</th>
            </tr>
          </thead>
          <tbody>
            {all.map((r, i) => (
              <tr
                key={`${r.feature}-${r.threshold}`}
                tabIndex={0}
                onClick={() => setSel(i)}
                onMouseEnter={() => setSel(i)}
                onFocus={() => setSel(i)}
                className={`border-t border-gray-100 dark:border-gray-700 cursor-pointer ${sel === i ? "bg-amber-50 dark:bg-gray-700" : ""}`}
              >
                <td className="px-3 py-1.5 text-left">
                  {F[r.feature]} ≤ {r.threshold}
                  {i === 0 && <span className="ml-2 rounded bg-emerald-100 dark:bg-emerald-900/40 px-1.5 text-[12px] text-emerald-800 dark:text-emerald-200">best</span>}
                </td>
                <td className="px-3 py-1.5">
                  {countBuy(r.left)}/{r.left.length}
                </td>
                <td className="px-3 py-1.5">
                  {countBuy(r.right)}/{r.right.length}
                </td>
                <td className="px-3 py-1.5" style={{ color: SPLIT }}>
                  {r.score.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="lg:sticky lg:top-24">
        <Scatter
          rects={
            c.feature === 0
              ? [
                  { x0: 0, x1: c.threshold, y0: -0.5, y1: 8.5, pred: bL * 2 >= c.left.length ? 1 : 0, n: 0, buy: 0, depth: 1 },
                  { x0: c.threshold, x1: 12.5, y0: -0.5, y1: 8.5, pred: bR * 2 >= c.right.length ? 1 : 0, n: 0, buy: 0, depth: 1 },
                ]
              : [
                  { x0: 0, x1: 12.5, y0: -0.5, y1: c.threshold, pred: bL * 2 >= c.left.length ? 1 : 0, n: 0, buy: 0, depth: 1 },
                  { x0: 0, x1: 12.5, y0: c.threshold, y1: 8.5, pred: bR * 2 >= c.right.length ? 1 : 0, n: 0, buy: 0, depth: 1 },
                ]
          }
          lines={c.feature === 0 ? [{ x1: c.threshold, x2: c.threshold, y1: -0.5, y2: 8.5 }] : [{ x1: 0, x2: 12.5, y1: c.threshold, y2: c.threshold }]}
          label="The selected candidate split"
        />
        <div className="mt-1 text-sm">
          <M>{`\\tfrac{${c.left.length}}{40}(${gini(c.left).toFixed(3)}) + \\tfrac{${c.right.length}}{40}(${gini(c.right).toFixed(3)}) = ${c.score.toFixed(3)}`}</M>
        </div>
      </div>
    </div>
  );
};

// ---------- depth explorer ----------
const DepthExplorer: React.FC = () => {
  const [depth, setDepth] = useState(2);
  const tree = useMemo(() => grow(TRAIN, depth), [depth]);
  const [showTest, setShowTest] = useState(false);
  const d = DEPTH_CURVE[depth - 1];
  const W2 = 300;
  const H2_ = 150;
  const ax = (k: number) => 20 + ((k - 1) / 7) * (W2 - 30);
  const ay = (a: number) => H2_ - 20 - ((a - 0.6) / 0.42) * (H2_ - 30);
  const line = (key: "train" | "test") => DEPTH_CURVE.map((r, i) => `${i ? "L" : "M"}${ax(r.depth)},${ay(r[key])}`).join("");
  return (
    <div className="grid md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 items-start">
      <div>
        <Scatter rects={regions(tree)} lines={splitLines(tree)} points={showTest ? TEST.slice(0, 150) : TRAIN} label={`A depth-${depth} tree's regions`} />
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showTest} onChange={(e) => setShowTest(e.target.checked)} className="accent-[#007A7A]" />
          Show new visitors (150 of the 500 held out) instead of the training data
        </label>
      </div>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-carddark">
        <Slider label="Maximum depth" value={depth} min={1} max={8} step={1} digits={0} color={SPLIT} onChange={setDepth} />
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <dt className="text-gray-500">Leaves</dt>
            <dd className="text-xl font-semibold tabular-nums">{leaves(tree)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Training</dt>
            <dd className="text-xl font-semibold tabular-nums">{Math.round(d.train * 100)}%</dd>
          </div>
          <div>
            <dt className="text-gray-500">New visitors</dt>
            <dd className="text-xl font-semibold tabular-nums" style={{ color: d.test < 0.8 ? "#E2483D" : undefined }}>
              {Math.round(d.test * 100)}%
            </dd>
          </div>
        </dl>
        <svg viewBox={`0 0 ${W2} ${H2_}`} className="mt-3 w-full" role="img" aria-label="Accuracy by depth on training and new visitors">
          <path d={line("train")} fill="none" stroke={BUY} strokeWidth={2.5} />
          <path d={line("test")} fill="none" stroke={SPLIT} strokeWidth={2.5} />
          <line x1={ax(depth)} x2={ax(depth)} y1={10} y2={H2_ - 20} stroke="currentColor" className="text-gray-400" strokeDasharray="4 4" />
          {[1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
            <text key={k} x={ax(k)} y={H2_ - 4} textAnchor="middle" className="fill-gray-500 text-[11px]">
              {k}
            </text>
          ))}
          <text x={W2 - 4} y={ay(1) - 4} textAnchor="end" className="text-[11px]" fill="#047857">
            training
          </text>
          <text x={W2 - 4} y={ay(DEPTH_CURVE[7].test) + 14} textAnchor="end" className="text-[11px]" fill={SPLIT}>
            new visitors
          </text>
        </svg>
      </div>
    </div>
  );
};

// ================= the article =================
const DecisionTreeStory: React.FC = () => {
  const [feat, setFeat] = useState<0 | 1>(0);
  const [th, setTh] = useState(3);
  const mineScore = useMemo(() => {
    const L = TRAIN.filter((p) => p.x[feat] <= th);
    const R = TRAIN.filter((p) => p.x[feat] > th);
    return { L, R, score: (L.length * gini(L) + R.length * gini(R)) / N };
  }, [feat, th]);
  const best = candidates(TRAIN).reduce((a, b) => (b.score < a.score ? b : a));
  const visitor: [number, number] = [8, 3];
  const vp = path(TREE2, visitor);
  const imp = useMemo(() => {
    const out = [0, 0];
    const walk = (n: Node) => {
      if (n.leaf) return;
      out[n.feature] += (n.n / N) * n.gain;
      walk(n.left);
      walk(n.right);
    };
    walk(TREE2);
    const tot = out[0] + out[1];
    return out.map((v) => v / tot);
  }, []);

  const steps: Step[] = useMemo(
    () => [
      {
        key: "data",
        body: (
          <>
            <strong>{N} store visitors.</strong> For each we know how long they spent on a product page, how many times they'd
            bought from the store before, and whether they bought this time (<span style={{ color: "#047857" }}>green</span>) or
            not (<span style={{ color: "#64748B" }}>grey</span>). {B} of {N} bought.
          </>
        ),
      },
      {
        key: "q1",
        body: (
          <>
            <strong>Ask one yes/no question.</strong> A decision tree looks for the single question that best separates buyers
            from non-buyers. Out of every question it could ask, the best is{" "}
            <em>
              "{F[ROOT.feature]} ≤ {ROOT.threshold}?"
            </em>
          </>
        ),
      },
      {
        key: "majority",
        body: (
          <>
            <strong>Each side gets its majority answer.</strong> Visitors who spent {ROOT.threshold} minutes or less mostly didn't
            buy ({countBuy(TRAIN.filter((p) => p.x[0] <= ROOT.threshold))} of {TRAIN.filter((p) => p.x[0] <= ROOT.threshold).length}{" "}
            did). Those who stayed longer mostly did ({countBuy(TRAIN.filter((p) => p.x[0] > ROOT.threshold))} of{" "}
            {TRAIN.filter((p) => p.x[0] > ROOT.threshold).length}). One question already gets {Math.round(DEPTH_CURVE[0].train * 100)}% of
            visitors right.
          </>
        ),
      },
      {
        key: "q2",
        body: (
          <>
            <strong>Then ask again inside each group.</strong> Among quick visitors, the best follow-up is past purchases ≤{" "}
            {(ROOT.left as Extract<Node, { leaf: false }>).threshold}: loyal customers buy even on a short visit. Among long
            visitors, it's past purchases ≤ {(ROOT.right as Extract<Node, { leaf: false }>).threshold}: first-timers often still
            don't. Four groups now, {Math.round(DEPTH_CURVE[1].train * 100)}% right.
          </>
        ),
      },
      {
        key: "tree",
        body: (
          <>
            <strong>That's the whole model.</strong> The questions form a tree. To predict for a new visitor (8 minutes, 3 past
            purchases), start at the top and follow the answers: {vp.steps.map((s) => `${F[s.feature]} ≤ ${s.threshold}? ${s.yes ? "yes" : "no"}`).join(", then ")}.
            They land in a group where {vp.leaf.buy} of {vp.leaf.n} bought, so the tree says <strong>buy</strong> (
            {Math.round((vp.leaf.buy / vp.leaf.n) * 100)}%).
          </>
        ),
      },
      {
        key: "yours",
        body: (
          <>
            <strong>Your turn: find the best first question.</strong> Lower impurity is better (explained next).
            <div className="mt-3 flex gap-4 text-[15px]">
              {[0, 1].map((f) => (
                <label key={f} className="flex items-center gap-1.5">
                  <input type="radio" name="feat" checked={feat === f} onChange={() => setFeat(f as 0 | 1)} className="accent-[#007A7A]" />
                  {F[f]}
                </label>
              ))}
            </div>
            <Slider label="Threshold" value={th} min={feat === 0 ? 0.5 : 0} max={feat === 0 ? 12 : 8} step={feat === 0 ? 0.05 : 0.5} digits={feat === 0 ? 2 : 1} color={SPLIT} onChange={setTh} />
            <p className="mt-3 text-[15px]">
              Weighted Gini: <strong style={{ color: SPLIT }}>{mineScore.score.toFixed(3)}</strong>{" "}
              {mineScore.score <= best.score + 1e-9 ? (
                <span className="font-semibold text-marrsgreen dark:text-carrigreen">That's the best possible split!</span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">vs. best {best.score.toFixed(3)}</span>
              )}
            </p>
          </>
        ),
      },
    ],
    [feat, th, mineScore, best, vp]
  );

  const chartFor = (s: number) => {
    if (s === 4)
      return (
        <div className="space-y-3">
          <TreeDiagram node={TREE2} />
          <div className="hidden md:block mx-auto max-w-[480px]">
            <Scatter rects={regions(TREE2)} lines={splitLines(TREE2)} highlight={visitor} />
          </div>
        </div>
      );
    if (s === 5) {
      const bL = countBuy(mineScore.L);
      const bR = countBuy(mineScore.R);
      const rects: Rect[] =
        feat === 0
          ? [
              { x0: 0, x1: th, y0: -0.5, y1: 8.5, pred: bL * 2 >= mineScore.L.length ? 1 : 0, n: 0, buy: 0, depth: 1 },
              { x0: th, x1: 12.5, y0: -0.5, y1: 8.5, pred: bR * 2 >= mineScore.R.length ? 1 : 0, n: 0, buy: 0, depth: 1 },
            ]
          : [
              { x0: 0, x1: 12.5, y0: -0.5, y1: th, pred: bL * 2 >= mineScore.L.length ? 1 : 0, n: 0, buy: 0, depth: 1 },
              { x0: 0, x1: 12.5, y0: th, y1: 8.5, pred: bR * 2 >= mineScore.R.length ? 1 : 0, n: 0, buy: 0, depth: 1 },
            ];
      return <Scatter rects={rects} lines={feat === 0 ? [{ x1: th, x2: th, y1: -0.5, y2: 8.5 }] : [{ x1: 0, x2: 12.5, y1: th, y2: th }]} />;
    }
    const first = [{ x1: ROOT.threshold, x2: ROOT.threshold, y1: -0.5, y2: 8.5 }];
    const r1: Rect[] = [
      { x0: 0, x1: ROOT.threshold, y0: -0.5, y1: 8.5, pred: ROOT.left.pred, n: 0, buy: 0, depth: 1 },
      { x0: ROOT.threshold, x1: 12.5, y0: -0.5, y1: 8.5, pred: ROOT.right.pred, n: 0, buy: 0, depth: 1 },
    ];
    if (s === 0) return <Scatter />;
    if (s === 1) return <Scatter lines={first} />;
    if (s === 2) return <Scatter rects={r1} lines={first} />;
    return <Scatter rects={regions(TREE2)} lines={splitLines(TREE2)} />;
  };

  const L = TRAIN.filter((p) => p.x[0] <= ROOT.threshold);
  const R = TRAIN.filter((p) => p.x[0] > ROOT.threshold);

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:47", src: "/explainers/decision-tree/intuition.mp4", poster: "/explainers/decision-tree/intuition-poster.jpg", square: true },
            { key: "math", label: "The math", len: "2:10", src: "/explainers/decision-tree/math.mp4", poster: "/explainers/decision-tree/math-poster.jpg" },
          ]}
          note="The intuition video is the idea in under a minute. The math video scores every possible question and builds the tree by hand."
        />
        <P>
          Decision trees work the way people explain decisions: a few yes/no questions in a row. "Did they stay longer than six
          minutes? Have they bought from us before?" That makes them one of the easiest models to read, audit and explain to a
          stakeholder, and they're the building block of random forests and gradient boosting, which win a large share of
          real-world prediction problems.
        </P>
        <P>Here's how a tree chooses its questions, using {N} store visitors, and why the hardest part is knowing when to stop.</P>
        <H2 id="how-it-works">How it works</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="the-math">How a tree picks a question: Gini impurity</H2>
        <P>
          To compare questions, the tree needs a number for how mixed a group is. The most common choice is <em>Gini impurity</em>:
          pick two visitors from the group at random (with replacement), and it's the chance they have different outcomes.
        </P>
        <DM>{"G = 1 - \\sum_k p_k^{\\,2} \\qquad \\text{two classes: } G = 1 - p^2 - (1 - p)^2"}</DM>
        <P>
          A group where everyone agrees has <M>{"G = 0"}</M>; a 50/50 mix has <M>{"G = 0.5"}</M>. All {N} visitors together ({B} bought):
        </P>
        <DM>{`G = 1 - \\left(\\tfrac{${B}}{${N}}\\right)^2 - \\left(\\tfrac{${N - B}}{${N}}\\right)^2 = ${gini(TRAIN).toFixed(3)}`}</DM>
        <P>
          A question splits the group in two, and we score it by the impurity left over, weighting each side by its size. For the
          winning question, "{F[ROOT.feature]} ≤ {ROOT.threshold}?":
        </P>
        <DM>{`G_{\\text{split}} = \\tfrac{${L.length}}{${N}}\\underbrace{\\Big(1 - \\big(\\tfrac{${countBuy(L)}}{${L.length}}\\big)^2 - \\big(\\tfrac{${L.length - countBuy(L)}}{${L.length}}\\big)^2\\Big)}_{${gini(L).toFixed(3)}} + \\tfrac{${R.length}}{${N}}\\underbrace{\\Big(1 - \\big(\\tfrac{${countBuy(R)}}{${R.length}}\\big)^2 - \\big(\\tfrac{${R.length - countBuy(R)}}{${R.length}}\\big)^2\\Big)}_{${gini(R).toFixed(3)}} = ${best.score.toFixed(3)}`}</DM>
        <P>
          The tree simply tries every possible question (every gap between neighbouring values, for every feature) and keeps the
          lowest score. Here are all {candidates(TRAIN).length} of them, best first. Hover one to see it:
        </P>
      </Narrow>
      <SplitTable />
      <Narrow>
        <P>
          Then it repeats the same search inside each group, and again inside those, until a stopping rule kicks in. Some
          libraries use <em>entropy</em>, <M>{"-\\sum_k p_k \\log_2 p_k"}</M>, instead of Gini; it almost always picks the same
          questions.
        </P>

        <H2 id="depth">When to stop: depth and overfitting</H2>
        <P>
          A tree can keep asking questions until every group is pure, and at that point it's right about every visitor it was
          trained on. But some of those visitors are just noise: people who bought for reasons our two features don't capture.
          A tree that carves out a tiny box for each of them has memorized them, and it does worse on new visitors. Drag the
          depth and compare training accuracy with accuracy on 500 visitors the tree never saw:
        </P>
      </Narrow>
      <DepthExplorer />
      <Narrow>
        <P>
          Depth 2 does best on new visitors ({Math.round(DEPTH_CURVE[1].test * 100)}%). By depth 6 the tree is perfect on its
          training data and down to {Math.round(DEPTH_CURVE[5].test * 100)}% on new visitors. In practice you pick depth (or minimum
          leaf size) with cross-validation, or you avoid the choice altogether with a random forest.
        </P>

        <H2 id="reading">Reading a tree</H2>
        <UL>
          <li>
            <strong>Follow any path</strong> to get a plain-English rule, e.g. "stayed over {ROOT.threshold} minutes and has 2 or more
            past purchases → {(ROOT.right as Extract<Node, { leaf: false }>).right.buy} of{" "}
            {(ROOT.right as Extract<Node, { leaf: false }>).right.n} bought".
          </li>
          <li>
            <strong>Feature importance</strong> adds up how much each feature reduced impurity, weighted by how many visitors
            passed through those questions: here {Math.round(imp[0] * 100)}% minutes on page, {Math.round(imp[1] * 100)}% past
            purchases. Past purchases matters more because it's used twice.
          </li>
        </UL>

        <H2 id="careful">When to be careful</H2>
        <UL>
          <li>
            <strong>Overfitting</strong> is the default, not the exception. Always limit depth or leaf size, and check on held-out
            data.
          </li>
          <li>
            <strong>Unstable.</strong> Change a few training points and the first question can change, which reshapes everything
            below it. Averaging many trees (a random forest) fixes this.
          </li>
          <li>
            <strong>Boxy boundaries.</strong> Every question splits on one feature, so boundaries are made of horizontal and vertical
            steps. A diagonal pattern needs many steps to approximate.
          </li>
          <li>
            <strong>Greedy.</strong> Each question is the best one right now; the tree never looks ahead, so it can miss a better
            overall structure.
          </li>
        </UL>

        <H2 id="code">In code</H2>
        <Code>{`import numpy as np
from sklearn.tree import DecisionTreeClassifier, export_text

X = np.array([${TRAIN.map((p) => `[${p.x[0]}, ${p.x[1]}]`).join(", ")}])
y = np.array([${TRAIN.map((p) => p.y).join(", ")}])

tree = DecisionTreeClassifier(max_depth=2, random_state=0).fit(X, y)
print(export_text(tree, feature_names=["minutes", "past_purchases"]))
# |--- minutes <= 5.80
# |   |--- past_purchases <= 5.50  -> class 0
# |   |--- past_purchases >  5.50  -> class 1
# |--- minutes >  5.80
# |   |--- past_purchases <= 1.50  -> class 0
# |   |--- past_purchases >  1.50  -> class 1
print(tree.feature_importances_)       # [0.389 0.611]
print(tree.predict_proba([[8, 3]]))    # [[0.176 0.824]] -> 82% buy`}</Code>

        <H2 id="further">Further reading</H2>
        <UL>
          <li>
            <a className="link" href="https://www.statlearning.com/" target="_blank" rel="noopener noreferrer">
              An Introduction to Statistical Learning
            </a>
            , chapter 8: tree-based methods.
          </li>
          <li>
            <a className="link" href="https://mlu-explain.github.io/decision-tree/" target="_blank" rel="noopener noreferrer">
              MLU-Explain: Decision Trees
            </a>
            : a visual walkthrough.
          </li>
          <li>
            <a className="link" href="https://scikit-learn.org/stable/modules/tree.html" target="_blank" rel="noopener noreferrer">
              scikit-learn: Decision Trees
            </a>
            : the practical reference, including the tips on avoiding overfitting.
          </li>
        </UL>
        <p className="mt-10 text-sm italic text-gray-600 dark:text-gray-400">
          Part of a series explaining one data science concept at a time. Next: random forests, which fix most of a single tree's
          weaknesses. The data is synthetic.
        </p>
      </Narrow>
    </Wide>
  );
};

export default DecisionTreeStory;
void accuracy;
void predict;
