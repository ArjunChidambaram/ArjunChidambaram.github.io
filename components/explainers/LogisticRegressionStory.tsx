import { useEffect, useMemo, useState } from "react";

import { COL, DM, M } from "@/components/explainers/Tex";
import { Button, Code, fmt, H2, Narrow, P, Scrolly, Slider, UL, useTween, Videos, Wide, type Step } from "@/components/explainers/kit";
import { BEST, BOUNDARY, L_BEST, N, OLS, XS, YS, confusion, gradient, logLoss, prob, sigmoid, type Coef } from "lib/explainers/logistic";

/**
 * "Logistic Regression" — MLU-Explain style article: videos, a scrolling
 * story, the math with every number computed, gradient descent, choosing a
 * threshold, reading coefficients, caveats, code.
 */

const BUY = "#05CE91";
const NOBUY = "#94A3B8";
const BUYERS = YS.reduce((a, b) => a + b, 0);

// ---------- chart ----------
const CW = 640;
const CH = 440;
const PAD = { l: 58, r: 64, t: 18, b: 50 };
const XR: [number, number] = [0, 12.5];
const YR: [number, number] = [-0.12, 1.16];
const sx = (x: number) => PAD.l + ((x - XR[0]) / (XR[1] - XR[0])) * (CW - PAD.l - PAD.r);
const sy = (y: number) => CH - PAD.b - ((y - YR[0]) / (YR[1] - YR[0])) * (CH - PAD.t - PAD.b);
const logit = (p: number) => Math.log(p / (1 - p));

type ChartProps = {
  curve?: Coef | null;
  ghost?: Coef | null;
  line?: boolean;
  threshold?: number | null;
  probe?: number | null;
  highlight?: number | null;
  tween?: number;
  label?: string;
};

const Chart: React.FC<ChartProps> = ({ curve = null, ghost = null, line = false, threshold = null, probe = null, highlight = null, tween = 650, label }) => {
  const c = useTween(curve ?? { b0: -3, b1: 0.5 }, tween);
  const path = (f: (x: number) => number) => {
    let d = "";
    for (let k = 0; k <= 100; k++) {
      const x = XR[0] + ((XR[1] - XR[0]) * k) / 100;
      d += `${k ? "L" : "M"}${sx(x).toFixed(1)},${sy(Math.max(-0.3, Math.min(1.4, f(x)))).toFixed(1)}`;
    }
    return d;
  };
  const bx = curve && threshold !== null ? (logit(threshold) - c.b0) / c.b1 : null;
  return (
    <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full h-auto" role="img" aria-label={label ?? "Visitors plotted by minutes on page and whether they bought"}>
      <defs>
        <clipPath id="lg-plot">
          <rect x={PAD.l} y={PAD.t - 6} width={CW - PAD.l - PAD.r} height={CH - PAD.t - PAD.b + 6} />
        </clipPath>
      </defs>
      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={CW - PAD.r} y1={sy(v)} y2={sy(v)} className="stroke-gray-200 dark:stroke-gray-700" />
          <text x={PAD.l - 8} y={sy(v) + 5} textAnchor="end" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
            {v * 100}%
          </text>
        </g>
      ))}
      {[0, 2, 4, 6, 8, 10, 12].map((v) => (
        <text key={v} x={sx(v)} y={CH - PAD.b + 22} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
          {v}
        </text>
      ))}
      <text x={(PAD.l + CW - PAD.r) / 2} y={CH - 6} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300 text-[14px]">
        Minutes on the product page
      </text>
      <text x={CW - PAD.r + 8} y={sy(1) + 5} className="text-[13px] font-medium" fill={BUY}>
        bought
      </text>
      <text x={CW - PAD.r + 8} y={sy(0) + 5} className="text-[13px] font-medium" fill={NOBUY}>
        didn't
      </text>

      <g clipPath="url(#lg-plot)">
        {bx !== null && (
          <>
            <rect x={PAD.l} y={PAD.t} width={Math.max(0, sx(bx) - PAD.l)} height={CH - PAD.t - PAD.b} fill={NOBUY} opacity={0.12} />
            <rect x={sx(bx)} y={PAD.t} width={Math.max(0, CW - PAD.r - sx(bx))} height={CH - PAD.t - PAD.b} fill={BUY} opacity={0.12} />
            <line x1={PAD.l} x2={CW - PAD.r} y1={sy(threshold!)} y2={sy(threshold!)} stroke="currentColor" strokeDasharray="6 5" className="text-gray-500" />
            <line x1={sx(bx)} x2={sx(bx)} y1={PAD.t} y2={CH - PAD.b} stroke="currentColor" strokeWidth={2} className="text-gray-700 dark:text-gray-200" />
          </>
        )}
        {line && (
          <>
            <rect x={PAD.l} y={PAD.t} width={CW - PAD.l - PAD.r} height={sy(1) - PAD.t} fill={COL.x} opacity={0.12} />
            <path d={path((x) => OLS.b0 + OLS.b1 * x)} fill="none" stroke={COL.b1} strokeWidth={4} />
          </>
        )}
        {ghost && <path d={path((x) => prob(ghost, x))} fill="none" stroke={COL.z} strokeOpacity={0.35} strokeWidth={3} strokeDasharray="8 6" />}
        {curve && <path d={path((x) => sigmoid(c.b0 + c.b1 * x))} fill="none" stroke={COL.z} strokeWidth={4.5} />}
        {curve && probe !== null && (
          <line x1={sx(probe)} x2={sx(probe)} y1={sy(0)} y2={sy(prob(c, probe))} stroke={COL.yhat} strokeWidth={2.5} strokeDasharray="6 5" />
        )}
      </g>
      {XS.map((x, i) => (
        <circle key={i} cx={sx(x)} cy={sy(YS[i])} r={highlight === i ? 9 : 6.5} fill={YS[i] ? BUY : NOBUY} stroke="white" strokeWidth={1.5} />
      ))}
      {curve && probe !== null && <circle cx={sx(probe)} cy={sy(prob(c, probe))} r={8} fill={COL.yhat} stroke="white" strokeWidth={2} />}
    </svg>
  );
};

const Readout: React.FC<{ curve: Coef | null; showL?: boolean }> = ({ curve, showL }) => (
  <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[15px] min-h-[28px]">
    {curve ? (
      <M>{`\\p = \\sig(\\cb{${curve.b0.toFixed(2)}} + \\cs{${curve.b1.toFixed(3)}}\\,\\X)`}</M>
    ) : (
      <span className="text-gray-500 dark:text-gray-400">
        {N} visitors, {BUYERS} bought
      </span>
    )}
    {showL && curve && <M>{`\\Lo = \\ce{${logLoss(curve).toFixed(3)}}`}</M>}
  </div>
);

// ---------- per-visitor cost table ----------
const CostTable: React.FC = () => {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="grid lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] gap-6 items-start">
      <div className="max-h-[470px] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark">
        <table className="w-full text-right text-[14px] tabular-nums">
          <thead className="sticky top-0 bg-white dark:bg-carddark shadow-sm">
            <tr>
              {["\\X_i", "\\Y_i", "\\p_i", "\\text{cost}_i"].map((h) => (
                <th key={h} className="px-3 py-2 font-normal">
                  <M>{h}</M>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {XS.map((x, i) => {
              const p = prob(BEST, x);
              const cost = YS[i] ? -Math.log(p) : -Math.log(1 - p);
              return (
                <tr
                  key={i}
                  tabIndex={0}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  className={`border-t border-gray-100 dark:border-gray-700 ${hover === i ? "bg-amber-50 dark:bg-gray-700" : ""}`}
                >
                  <td className="px-3 py-1.5" style={{ color: COL.x }}>{x}</td>
                  <td className="px-3 py-1.5" style={{ color: YS[i] ? COL.y : COL.dim }}>{YS[i]}</td>
                  <td className="px-3 py-1.5" style={{ color: COL.yhat }}>{p.toFixed(3)}</td>
                  <td className="px-3 py-1.5">
                    <span className="inline-block h-2 rounded align-middle mr-2" style={{ width: `${Math.min(80, cost * 40)}px`, background: COL.e }} />
                    {cost.toFixed(3)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 bg-white dark:bg-carddark border-t-2 border-gray-400">
            <tr className="font-semibold">
              <td className="px-3 py-2 text-left" colSpan={3}>
                Average cost, <M>{"\\Lo"}</M>
              </td>
              <td className="px-3 py-2" style={{ color: COL.e }}>{L_BEST.toFixed(3)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="lg:sticky lg:top-24">
        <Chart curve={BEST} highlight={hover} label="Fitted curve with the hovered visitor highlighted" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {hover === null
            ? "Hover a row to find that visitor. The biggest costs are the surprises."
            : `Visitor ${hover + 1}: ${XS[hover]} min, ${YS[hover] ? "bought" : "didn't buy"}. The model gave them a ${Math.round(
                prob(BEST, XS[hover]) * 100
              )}% chance to buy.`}
        </p>
      </div>
    </div>
  );
};

// ---------- one step by hand ----------
const StepByHand: React.FC = () => {
  const g = gradient({ b0: 0, b1: 0 });
  const sR = YS.reduce((s, y) => s + (0.5 - y), 0);
  const sRX = YS.reduce((s, y, i) => s + (0.5 - y) * XS[i], 0);
  return (
    <div className="max-h-[420px] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark">
      <table className="w-full text-right text-[14px] tabular-nums">
        <thead className="sticky top-0 bg-white dark:bg-carddark shadow-sm">
          <tr>
            {["\\X_i", "\\Y_i", "\\p_i", "\\p_i - \\Y_i", "(\\p_i - \\Y_i)\\,\\X_i"].map((h) => (
              <th key={h} className="px-3 py-2 font-normal">
                <M>{h}</M>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {XS.map((x, i) => (
            <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
              <td className="px-3 py-1" style={{ color: COL.x }}>{x}</td>
              <td className="px-3 py-1" style={{ color: YS[i] ? COL.y : COL.dim }}>{YS[i]}</td>
              <td className="px-3 py-1" style={{ color: COL.yhat }}>0.5</td>
              <td className="px-3 py-1">{(0.5 - YS[i]).toFixed(1)}</td>
              <td className="px-3 py-1">{((0.5 - YS[i]) * x).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 bg-white dark:bg-carddark border-t-2 border-gray-400">
          <tr className="font-semibold">
            <td className="px-3 py-2 text-left" colSpan={3}>
              Sum of all {N}
            </td>
            <td className="px-3 py-2">{sR.toFixed(1)}</td>
            <td className="px-3 py-2">{sRX.toFixed(1)}</td>
          </tr>
          <tr className="text-[13px] text-gray-500 dark:text-gray-400">
            <td className="px-3 pb-2 text-left" colSpan={3}>
              Divide by {N} for the gradient
            </td>
            <td className="px-3 pb-2" style={{ color: COL.b0 }}>{g.g0.toFixed(3)}</td>
            <td className="px-3 pb-2" style={{ color: COL.b1 }}>{g.g1.toFixed(3)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// ---------- gradient descent playground ----------
const GradientDescent: React.FC = () => {
  const [alpha, setAlpha] = useState(0.1);
  const [c, setC] = useState<Coef>({ b0: 0, b1: 0 });
  const [steps, setSteps] = useState(0);
  const [losses, setLosses] = useState<number[]>([logLoss({ b0: 0, b1: 0 })]);
  const [running, setRunning] = useState(false);

  const advance = (k: number) => {
    setC((cur) => {
      let v = cur;
      const ls: number[] = [];
      for (let i = 0; i < k; i++) {
        const g = gradient(v);
        v = { b0: v.b0 - alpha * g.g0, b1: v.b1 - alpha * g.g1 };
        if (!isFinite(v.b0) || Math.abs(v.b1) > 50) break;
        ls.push(logLoss(v));
      }
      setLosses((L) => [...L, ...ls]);
      setSteps((s) => s + k);
      return v;
    });
  };
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => advance(25), 60);
    return () => clearInterval(id);
  }, [running, alpha]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (steps >= 6000) setRunning(false);
  }, [steps]);

  // draw at most ~300 points of the full history, on a log-scaled step axis so the early drop is visible
  const maxL = Math.min(2, Math.max(...losses.slice(0, 50), 0.8));
  const total = Math.max(losses.length - 1, 60);
  const sample: number[] = [];
  for (let k = 0; k < 300; k++) sample.push(Math.round(Math.pow(total + 1, k / 299)) - 1);
  const spark = sample
    .filter((i, j) => j === 0 || i !== sample[j - 1])
    .filter((i) => i < losses.length)
    .map((i, j) => `${j ? "L" : "M"}${(Math.log(i + 1) / Math.log(total + 1)) * 300},${100 - ((Math.min(losses[i], maxL) - 0.45) / (maxL - 0.45)) * 95}`)
    .join(" ");
  const reset = () => {
    setRunning(false);
    setC({ b0: 0, b1: 0 });
    setSteps(0);
    setLosses([logLoss({ b0: 0, b1: 0 })]);
  };
  return (
    <div className="grid md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 items-start">
      <div>
        <Chart curve={c} ghost={BEST} tween={0} label="Gradient descent fitting the S-curve" />
        <Readout curve={c} showL />
      </div>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-carddark">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => advance(1)}>Take one step</Button>
          <Button primary onClick={() => setRunning((r) => !r)}>
            {running ? "Pause" : "Run"}
          </Button>
          <button type="button" onClick={reset} className="rounded border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm">
            Reset
          </button>
        </div>
        <label className="mt-4 block text-sm">
          Learning rate <M>{"\\alpha"}</M>
          <select
            value={alpha}
            onChange={(e) => {
              setAlpha(Number(e.target.value));
              reset();
            }}
            className="ml-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent px-2 py-1"
          >
            <option value={0.02}>0.02 (cautious)</option>
            <option value={0.1}>0.1 (good)</option>
            <option value={0.3}>0.3 (bold)</option>
            <option value={0.6}>0.6 (too big)</option>
          </select>
        </label>
        <p className="mt-4 text-sm">
          Step {fmt(steps)}: <M>{`\\Lo = \\ce{${logLoss(c).toFixed(4)}}`}</M>{" "}
          <span className="text-gray-500 dark:text-gray-400">(best {L_BEST.toFixed(4)})</span>
        </p>
        <svg viewBox="0 0 300 104" className="mt-2 w-full h-24" role="img" aria-label="Log loss over the latest steps">
          <line x1={0} x2={300} y1={100} y2={100} className="stroke-gray-300 dark:stroke-gray-600" />
          <path d={spark} fill="none" stroke={COL.e} strokeWidth={2.5} />
        </svg>
        <p className="text-xs text-gray-500 dark:text-gray-400">Log loss by step (log scale). "Run" takes 25 steps at a time.</p>
      </div>
    </div>
  );
};

// ---------- threshold & confusion matrix ----------
const ThresholdExplorer: React.FC = () => {
  const [th, setTh] = useState(0.5);
  const { tp, fp, tn, fn } = confusion(BEST, th);
  const acc = (tp + tn) / N;
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp / (tp + fn);
  const cell = (n: number, label: string, good: boolean) => (
    <div className={`rounded-md p-3 text-center ${good ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-rose-50 dark:bg-rose-900/30"}`}>
      <div className="text-2xl font-semibold tabular-nums">{n}</div>
      <div className="text-xs text-gray-600 dark:text-gray-300">{label}</div>
    </div>
  );
  return (
    <div className="grid md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 items-start">
      <Chart curve={BEST} threshold={th} label="Fitted curve with a movable threshold and the resulting decision boundary" />
      <div>
        <Slider label="Threshold" value={th} min={0.1} max={0.9} step={0.01} digits={2} color={COL.yhat} onChange={setTh} />
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Predict "buy" when <M>{`\\p \\ge ${th.toFixed(2)}`}</M>, i.e. after <strong>{((logit(th) - BEST.b0) / BEST.b1).toFixed(1)} minutes</strong>.
        </p>
        <div className="mt-4 grid grid-cols-[auto_1fr_1fr] gap-2 items-center text-sm">
          <span />
          <span className="text-center text-gray-500">actually bought</span>
          <span className="text-center text-gray-500">didn't</span>
          <span className="text-gray-500">predict buy</span>
          {cell(tp, "true positive", true)}
          {cell(fp, "false positive", false)}
          <span className="text-gray-500">predict no</span>
          {cell(fn, "false negative", false)}
          {cell(tn, "true negative", true)}
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <dt className="text-gray-500">Accuracy</dt>
            <dd className="text-xl font-semibold tabular-nums">{Math.round(acc * 100)}%</dd>
          </div>
          <div>
            <dt className="text-gray-500">Precision</dt>
            <dd className="text-xl font-semibold tabular-nums">{Math.round(precision * 100)}%</dd>
          </div>
          <div>
            <dt className="text-gray-500">Recall</dt>
            <dd className="text-xl font-semibold tabular-nums">{Math.round(recall * 100)}%</dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

// ================= the article =================
const LogisticRegressionStory: React.FC = () => {
  const [mine, setMine] = useState<Coef>({ b0: -1, b1: 0.2 });
  const [probe, setProbe] = useState(7);

  const steps: Step[] = useMemo(
    () => [
      {
        key: "data",
        body: (
          <>
            <strong>Here are {N} visitors</strong> to an online store. For each, we know how many minutes they spent on a product
            page and whether they went on to buy it (<span style={{ color: BUY }}>top row</span>) or not (
            <span style={{ color: "#64748B" }}>bottom row</span>). People who linger tend to buy, but a few quick visitors bought
            and a few long ones didn't.
          </>
        ),
      },
      {
        key: "line",
        body: (
          <>
            <strong>Why not fit a straight line?</strong> Treat "bought" as 1 and "didn't" as 0 and draw the best line. It
            predicts <M>{`${(OLS.b0 + OLS.b1 * 12).toFixed(2)}`}</M> at 12 minutes and keeps climbing. A {Math.round((OLS.b0 + OLS.b1 * 12) * 100)}% chance of
            buying makes no sense; we need predictions that stay between 0 and 1.
          </>
        ),
      },
      {
        key: "sigmoid",
        body: (
          <>
            <strong>Squash the line into an S.</strong> Logistic regression still computes a straight line,{" "}
            <M>{"\\Z = \\bz + \\bo\\,\\X"}</M>, but passes it through the <em>sigmoid</em>:
            <span className="block my-2 text-center">
              <M>{"\\p = \\sig(\\Z) = \\frac{1}{1 + e^{-\\Z}}"}</M>
            </span>
            Very negative <M>{"\\Z"}</M> gives almost 0, very positive almost 1, and <M>{"\\Z = 0"}</M> gives exactly 0.5. Every
            output is a probability.
          </>
        ),
      },
      {
        key: "probe",
        body: (
          <>
            <strong>Read off a probability.</strong> Slide to any visit length:
            <Slider label="Minutes on page" value={probe} min={0} max={12} step={0.1} digits={1} color={COL.x} onChange={setProbe} />
            <p className="mt-2">
              A {probe.toFixed(1)}-minute visitor has a{" "}
              <strong style={{ color: COL.yhat }}>{Math.round(prob(BEST, probe) * 100)}%</strong> chance of buying.
            </p>
          </>
        ),
      },
      {
        key: "boundary",
        body: (
          <>
            <strong>Turn probabilities into decisions.</strong> To predict yes or no, pick a threshold, usually 50%. The curve
            crosses 50% where <M>{"\\Z = 0"}</M>, at <M>{`\\X = -\\bz/\\bo = ${BOUNDARY.toFixed(2)}`}</M> minutes. That's the{" "}
            <em>decision boundary</em>: visitors to the right are predicted to buy.
          </>
        ),
      },
      {
        key: "yours",
        body: (
          <>
            <strong>Your turn.</strong> Fit the curve yourself. The dashed curve is the best fit; lower log loss (explained
            next) is better.
            <Slider label={<M>{"\\bz"}</M>} value={mine.b0} min={-6} max={2} step={0.01} digits={2} color={COL.b0} onChange={(v) => setMine((m) => ({ ...m, b0: v }))} />
            <Slider label={<M>{"\\bo"}</M>} value={mine.b1} min={-0.2} max={1.2} step={0.001} digits={3} color={COL.b1} onChange={(v) => setMine((m) => ({ ...m, b1: v }))} />
            <p className="mt-3 text-[15px]">
              Your log loss: <M>{`\\ce{${logLoss(mine).toFixed(3)}}`}</M>{" "}
              {logLoss(mine) <= L_BEST + 0.002 ? (
                <span className="font-semibold text-marrsgreen dark:text-carrigreen">That's the best possible!</span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">vs. best {L_BEST.toFixed(3)}</span>
              )}
            </p>
          </>
        ),
      },
    ],
    [mine, probe]
  );

  const chartFor = (s: number) => {
    const curve = s <= 1 ? null : s === 5 ? mine : BEST;
    return (
      <div>
        <Chart curve={curve} line={s === 1} ghost={s === 5 ? BEST : null} threshold={s === 4 ? 0.5 : null} probe={s === 3 ? probe : null} tween={s === 5 || s === 3 ? 0 : 650} />
        <Readout curve={curve} showL={s === 5} />
      </div>
    );
  };

  const z7 = BEST.b0 + BEST.b1 * 7;
  const g0 = gradient({ b0: 0, b1: 0 });
  const odds = Math.exp(BEST.b1);

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:47", src: "/explainers/logistic-regression/intuition.mp4", poster: "/explainers/logistic-regression/intuition-poster.jpg", square: true },
            { key: "math", label: "The math", len: "2:20", src: "/explainers/logistic-regression/math.mp4", poster: "/explainers/logistic-regression/math-poster.jpg" },
          ]}
          note="The intuition video is the whole idea in under a minute. The math video derives the gradient and walks one step of training by hand."
        />
        <P>
          Linear regression predicts a number: a price, a temperature, a time. But many questions have a yes-or-no answer. Will
          this visitor buy? Is this email spam? Will this customer cancel? Logistic regression answers them with a{" "}
          <em>probability</em>, and it's the workhorse of classification: simple, fast, and easy to explain to anyone.
        </P>
        <P>We'll build one from {N} store visitors, see exactly how it learns, and decide how to turn its probabilities into decisions.</P>
        <H2 id="how-it-works">How it works</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="the-loss">Measuring a fit: log loss</H2>
        <P>
          For linear regression we added up squared misses. With probabilities, a better measure asks: how surprised was the model
          by what actually happened? If a visitor bought and the model said 90%, that's little surprise; if it said 10%, that's a
          lot. Each visitor's cost is
        </P>
        <DM>{"\\text{cost}_i = -\\log \\p_i \\ \\text{ if } \\Y_i = 1, \\qquad -\\log(1 - \\p_i) \\ \\text{ if } \\Y_i = 0"}</DM>
        <P>
          and the <em>log loss</em> is the average over everyone, written in one line as
        </P>
        <DM>{"\\Lo(\\bz, \\bo) = -\\frac{1}{n}\\sum_{i=1}^{n}\\Big[\\Y_i \\log \\p_i + (1 - \\Y_i)\\log(1 - \\p_i)\\Big]"}</DM>
        <P>
          Confident and right costs almost nothing (<M>{"-\\log 0.9 = 0.105"}</M>). Confident and wrong is expensive (
          <M>{"-\\log 0.1 = 2.303"}</M>). Here's every visitor's cost under the best model:
        </P>
      </Narrow>
      <CostTable />

      <Narrow>
        <H2 id="the-math">Where the numbers come from</H2>
        <P>
          Unlike linear regression, there's no formula that solves for the best <M>{"\\bz"}</M> and <M>{"\\bo"}</M> directly. Instead
          we find which way is downhill and step that way. The chain rule gives a remarkably clean answer for one visitor:
        </P>
        <DM>{"\\frac{\\partial \\Lo_i}{\\partial \\Z_i} = \\frac{\\partial \\Lo_i}{\\partial \\p_i}\\cdot\\frac{\\partial \\p_i}{\\partial \\Z_i} = \\Big(-\\frac{\\Y_i}{\\p_i} + \\frac{1-\\Y_i}{1-\\p_i}\\Big)\\cdot \\p_i(1-\\p_i) = \\p_i - \\Y_i"}</DM>
        <P>
          Prediction minus truth. Since <M>{"\\Z_i = \\bz + \\bo\\,\\X_i"}</M>, averaging over all visitors gives the gradient:
        </P>
        <DM>{"\\frac{\\partial \\Lo}{\\partial \\bz} = \\frac{1}{n}\\sum_i (\\p_i - \\Y_i) \\qquad \\frac{\\partial \\Lo}{\\partial \\bo} = \\frac{1}{n}\\sum_i (\\p_i - \\Y_i)\\,\\X_i"}</DM>
        <P>
          <strong>One step by hand.</strong> Start at <M>{"\\bz = \\bo = 0"}</M>. Then <M>{"\\Z_i = 0"}</M> and{" "}
          <M>{"\\p_i = \\sig(0) = 0.5"}</M> for every visitor, so each row of the table is easy:
        </P>
      </Narrow>
      <div className="mx-auto max-w-3xl">
        <StepByHand />
      </div>
      <Narrow>
        <P>With a learning rate of <M>{"\\alpha = 0.1"}</M>, the first step moves the coefficients to</P>
        <DM>{`\\bz \\leftarrow 0 - 0.1 \\times ${g0.g0.toFixed(3)} = \\cb{${(-0.1 * g0.g0).toFixed(3)}} \\qquad \\bo \\leftarrow 0 - 0.1 \\times (${g0.g1.toFixed(3)}) = \\cs{${(-0.1 * g0.g1).toFixed(4)}}`}</DM>
        <P>
          The slope turned positive: the data says longer visits mean more buying. Repeat about 5,000 times and the coefficients
          settle at <M>{`\\bz = \\cb{${BEST.b0.toFixed(3)}},\\ \\bo = \\cs{${BEST.b1.toFixed(4)}}`}</M>, with log loss{" "}
          <M>{`\\ce{${L_BEST.toFixed(4)}}`}</M>. Try it:
        </P>
      </Narrow>
      <GradientDescent />

      <Narrow>
        <P>
          So a 7-minute visitor gets <M>{`\\Z = ${BEST.b0.toFixed(3)} + ${BEST.b1.toFixed(4)} \\times 7 = \\cz{${z7.toFixed(2)}}`}</M> and{" "}
          <M>{`\\p = \\sig(${z7.toFixed(2)}) = \\cp{${sigmoid(z7).toFixed(2)}}`}</M>: a {Math.round(sigmoid(z7) * 100)}% chance to
          buy.
        </P>

        <H2 id="threshold">From probabilities to decisions</H2>
        <P>
          A probability isn't a decision. To act (show a coupon, flag a transaction) you pick a threshold, and that choice is a
          business trade-off, not a math fact. Lower it and you catch more buyers but also more non-buyers; raise it and your
          "yes" predictions get more reliable but you miss people. Move it and watch the counts:
        </P>
      </Narrow>
      <ThresholdExplorer />
      <Narrow>
        <UL>
          <li>
            <strong>Accuracy</strong>: share of all predictions that were right.
          </li>
          <li>
            <strong>Precision</strong>: of the visitors we predicted would buy, how many did.
          </li>
          <li>
            <strong>Recall</strong>: of the visitors who bought, how many we caught.
          </li>
        </UL>

        <H2 id="reading">Reading the coefficients</H2>
        <P>
          <M>{"\\Z"}</M> is the <em>log-odds</em> of buying, so coefficients are easiest to read through odds (the chance of
          buying divided by the chance of not buying):
        </P>
        <UL>
          <li>
            <M>{`e^{\\bo} = e^{${BEST.b1.toFixed(4)}} = ${odds.toFixed(2)}`}</M>: each extra minute on the page multiplies the odds
            of buying by {odds.toFixed(2)}, about {Math.round((odds - 1) * 100)}% higher odds per minute.
          </li>
          <li>
            <M>{`\\sig(\\bz) = \\sig(${BEST.b0.toFixed(3)}) = ${sigmoid(BEST.b0).toFixed(2)}`}</M>: the model's chance of buying for
            a visitor who spends no time at all, about {Math.round(sigmoid(BEST.b0) * 100)}%.
          </li>
        </UL>

        <H2 id="careful">When to be careful</H2>
        <UL>
          <li>
            <strong>Perfectly separated data breaks it.</strong> If every buyer stayed longer than every non-buyer, the curve could
            always get steeper, so the coefficients run off to infinity. Regularization fixes this (and is on by default in
            scikit-learn).
          </li>
          <li>
            <strong>The boundary is a straight line.</strong> With more features it's a flat plane. Curved boundaries need extra
            features or a different model (like a decision tree).
          </li>
          <li>
            <strong>Rare outcomes need a rethink of the threshold.</strong> If only 1% of visitors buy, a model that says "no" to
            everyone is 99% accurate and useless. Look at precision and recall.
          </li>
          <li>
            <strong>Association isn't causation.</strong> Keeping people on a page longer won't necessarily make them buy.
          </li>
        </UL>

        <H2 id="code">In code</H2>
        <Code>{`import numpy as np
from sklearn.linear_model import LogisticRegression

minutes = np.array([${XS.join(", ")}])
bought  = np.array([${YS.join(", ")}])

# penalty=None gives the plain fit from this article;
# scikit-learn's default adds L2 regularization, which shrinks the coefficients.
model = LogisticRegression(penalty=None).fit(minutes.reshape(-1, 1), bought)
print(model.intercept_[0], model.coef_[0, 0])   # ${BEST.b0.toFixed(3)}  ${BEST.b1.toFixed(4)}
print(model.predict_proba([[7]])[0, 1])         # ${sigmoid(z7).toFixed(3)}
print(np.exp(model.coef_[0, 0]))                # odds ratio per minute: ${odds.toFixed(2)}`}</Code>

        <H2 id="further">Further reading</H2>
        <UL>
          <li>
            <a className="link" href="https://www.statlearning.com/" target="_blank" rel="noopener noreferrer">
              An Introduction to Statistical Learning
            </a>
            , chapter 4: classification, including logistic regression.
          </li>
          <li>
            <a className="link" href="https://mlu-explain.github.io/logistic-regression/" target="_blank" rel="noopener noreferrer">
              MLU-Explain: Logistic Regression
            </a>
            : a visual walkthrough and the inspiration for this format.
          </li>
          <li>
            <a className="link" href="https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression" target="_blank" rel="noopener noreferrer">
              scikit-learn: Logistic regression
            </a>
            : the practical reference, including regularization options.
          </li>
        </UL>
        <p className="mt-10 text-sm italic text-gray-600 dark:text-gray-400">
          Part of a series explaining one data science concept at a time. The data is synthetic.
        </p>
      </Narrow>
    </Wide>
  );
};

export default LogisticRegressionStory;
