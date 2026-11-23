import { useEffect, useMemo, useRef, useState } from "react";

import { COL, DM, M } from "@/components/explainers/Tex";
import { POINTS, leastSquares, sse, type Line } from "lib/explainers/linearRegression";

/**
 * "Linear Regression" — an MLU-Explain style article: videos first, then a
 * scrolling story with a sticky chart, the math with every number computed
 * from the data, gradient descent, how to judge the fit, and caveats.
 */

// ---------- data ----------
const XS = POINTS.map((p) => p[0]);
const YS = POINTS.map((p) => p[1]);
const N = POINTS.length;
const XBAR = XS.reduce((a, b) => a + b, 0) / N;
const YBAR = YS.reduce((a, b) => a + b, 0) / N;
const BEST = leastSquares(POINTS);
const L_BEST = sse(POINTS, BEST);
const SST = YS.reduce((s, y) => s + (y - YBAR) ** 2, 0);
const R2 = 1 - L_BEST / SST;
const RMSE = Math.sqrt(L_BEST / N);
const SXY = XS.reduce((s, x, i) => s + (x - XBAR) * (YS[i] - YBAR), 0);
const SXX = XS.reduce((s, x) => s + (x - XBAR) ** 2, 0);

const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

// ---------- chart ----------
const CW = 640;
const CH = 480;
const PAD = { l: 64, r: 20, t: 20, b: 52 };
const XR: [number, number] = [750, 2650];
const YR: [number, number] = [170, 480];
const sx = (x: number) => PAD.l + ((x - XR[0]) / (XR[1] - XR[0])) * (CW - PAD.l - PAD.r);
const sy = (y: number) => CH - PAD.b - ((y - YR[0]) / (YR[1] - YR[0])) * (CH - PAD.t - PAD.b);

/** Smoothly animates a line's parameters toward a target. */
function useTweenLine(target: Line | null, ms = 650): Line | null {
  const [cur, setCur] = useState<Line | null>(target);
  const from = useRef<Line | null>(target);
  useEffect(() => {
    if (!target) {
      setCur(null);
      from.current = null;
      return;
    }
    const start = from.current ?? target;
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || ms === 0) {
      setCur(target);
      from.current = target;
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
      const v = { b0: start.b0 + (target.b0 - start.b0) * e, b1: start.b1 + (target.b1 - start.b1) * e };
      setCur(v);
      from.current = v;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target?.b0, target?.b1, ms]); // eslint-disable-line react-hooks/exhaustive-deps
  return cur;
}

type ChartProps = {
  line?: Line | null;
  ghost?: Line | null; // faint reference line (the best fit)
  residuals?: boolean;
  squares?: boolean;
  highlight?: number | null;
  pointsVisible?: boolean;
  tween?: number;
  label?: string;
};

const Chart: React.FC<ChartProps> = ({
  line = null,
  ghost = null,
  residuals = false,
  squares = false,
  highlight = null,
  pointsVisible = true,
  tween = 650,
  label = "Scatter plot of house size against price",
}) => {
  const l = useTweenLine(line, tween);
  const lineY = (x: number) => (l ? l.b0 + l.b1 * x : 0);
  return (
    <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full h-auto" role="img" aria-label={label}>
      <defs>
        <clipPath id="lr-plot">
          <rect x={PAD.l} y={PAD.t - 10} width={CW - PAD.l - PAD.r + 10} height={CH - PAD.t - PAD.b + 10} />
        </clipPath>
      </defs>
      {/* grid + axes */}
      {[200, 300, 400].map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={CW - PAD.r} y1={sy(v)} y2={sy(v)} className="stroke-gray-200 dark:stroke-gray-700" />
          <text x={PAD.l - 10} y={sy(v) + 5} textAnchor="end" className="fill-gray-500 dark:fill-gray-400 text-[14px]">
            ${v}k
          </text>
        </g>
      ))}
      {[1000, 1500, 2000, 2500].map((v) => (
        <text key={v} x={sx(v)} y={CH - PAD.b + 24} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-[14px]">
          {fmt(v)}
        </text>
      ))}
      <line x1={PAD.l} x2={CW - PAD.r} y1={CH - PAD.b} y2={CH - PAD.b} className="stroke-gray-700 dark:stroke-gray-300" strokeWidth={1.5} />
      <text x={(PAD.l + CW - PAD.r) / 2} y={CH - 8} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300 text-[15px]">
        House size (sq ft)
      </text>

      <g clipPath="url(#lr-plot)">
        {ghost && (
          <line
            x1={sx(XR[0])}
            x2={sx(XR[1])}
            y1={sy(ghost.b0 + ghost.b1 * XR[0])}
            y2={sy(ghost.b0 + ghost.b1 * XR[1])}
            stroke={COL.yhat}
            strokeOpacity={0.35}
            strokeWidth={3}
            strokeDasharray="8 6"
          />
        )}
        {l &&
          POINTS.map(([x, y], i) => {
            const yl = lineY(x);
            const top = sy(Math.max(y, yl));
            const side = Math.abs(sy(y) - sy(yl));
            return (
              <g key={i}>
                <rect
                  x={sx(x)}
                  y={top}
                  width={side}
                  height={side}
                  fill={COL.e}
                  fillOpacity={squares ? 0.16 : 0}
                  stroke={COL.e}
                  strokeOpacity={squares ? 0.6 : 0}
                  style={{ transition: "fill-opacity 400ms, stroke-opacity 400ms" }}
                />
                <line
                  x1={sx(x)}
                  x2={sx(x)}
                  y1={sy(y)}
                  y2={sy(yl)}
                  stroke={COL.e}
                  strokeWidth={2.5}
                  strokeOpacity={residuals || highlight === i ? 1 : 0}
                  style={{ transition: "stroke-opacity 400ms" }}
                />
              </g>
            );
          })}
        {l && (
          <line
            x1={sx(XR[0])}
            x2={sx(XR[1])}
            y1={sy(lineY(XR[0]))}
            y2={sy(lineY(XR[1]))}
            stroke={COL.yhat}
            strokeWidth={4}
            strokeLinecap="round"
          />
        )}
      </g>
      {POINTS.map(([x, y], i) => (
        <circle
          key={i}
          cx={sx(x)}
          cy={sy(y)}
          r={highlight === i ? 9 : 6.5}
          fill={COL.y}
          stroke="white"
          strokeWidth={1.5}
          style={{
            opacity: pointsVisible ? 1 : 0,
            transition: `opacity 300ms ${i * 25}ms, r 150ms`,
          }}
        />
      ))}
    </svg>
  );
};

// ---------- scrolly ----------
type Step = { key: string; body: React.ReactNode };

const Scrolly: React.FC<{ steps: Step[]; chart: (active: number) => React.ReactNode }> = ({ steps, chart }) => {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);
  return (
    <div className="relative grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-x-10">
      {/* chart: sticky on the right on desktop, sticky on top on phones */}
      <div className="md:order-2 sticky top-14 md:top-24 z-10 h-fit self-start bg-bglight dark:bg-bgdark py-2 md:py-0 shadow-[0_8px_12px_-12px_rgba(0,0,0,0.25)] md:shadow-none">
        {chart(active)}
      </div>
      <div className="md:order-1 relative">
        {steps.map((s, i) => (
          <div
            key={s.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-step={i}
            className="min-h-[55vh] md:min-h-[80vh] flex items-center first:pt-4 last:pb-[20vh]"
          >
            <div
              className={`rounded-lg border p-5 text-[17px] leading-relaxed transition-all duration-300 ${
                active === i
                  ? "border-marrsgreen/50 dark:border-carrigreen/50 bg-white dark:bg-carddark shadow-md opacity-100"
                  : "border-transparent opacity-40"
              }`}
            >
              {s.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- pieces ----------
const Readout: React.FC<{ line: Line | null; showL?: boolean; extra?: React.ReactNode }> = ({ line, showL, extra }) => (
  <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[15px] min-h-[28px]">
    {line ? (
      <M>{`\\yh = \\cb{${fmt(line.b0, 1)}} + \\cs{${line.b1.toFixed(4)}}\\,\\X`}</M>
    ) : (
      <span className="text-gray-500 dark:text-gray-400">{N} houses</span>
    )}
    {showL && line && (
      <span>
        <M>{`\\Lo = \\ce{${fmt(sse(POINTS, line))}}`}</M>
      </span>
    )}
    {extra}
  </div>
);

const Slider: React.FC<{
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  color: string;
}> = ({ label, value, min, max, step, onChange, color }) => (
  <label className="block mt-3">
    <span className="flex justify-between text-[15px]">
      {label}
      <span className="tabular-nums" style={{ color }}>
        {step < 0.01 ? value.toFixed(4) : fmt(value, 1)}
      </span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full"
      style={{ accentColor: color }}
    />
  </label>
);

const H2: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <h2 id={id} className="mt-16 mb-4 text-2xl md:text-3xl font-semibold scroll-mt-24">
    {children}
  </h2>
);
const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="my-4 text-[17px] leading-relaxed text-gray-800 dark:text-gray-200">{children}</p>
);

// ---------- videos ----------
const Videos: React.FC = () => {
  const [tab, setTab] = useState<"intuition" | "math">("intuition");
  const tabs = [
    { key: "intuition" as const, label: "The intuition", len: "0:46" },
    { key: "math" as const, label: "The math", len: "1:48" },
  ];
  return (
    <section aria-labelledby="watch" className="mt-6">
      <h2 id="watch" className="sr-only">
        Watch first
      </h2>
      <div role="tablist" aria-label="Videos" className="flex gap-2 mb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
              tab === t.key
                ? "bg-marrsgreen text-white border-marrsgreen dark:bg-carrigreen dark:text-bgdark dark:border-carrigreen"
                : "border-gray-300 dark:border-gray-600 hover:border-marrsgreen"
            }`}
          >
            {t.label} <span className="opacity-70">{t.len}</span>
          </button>
        ))}
      </div>
      <div className="rounded-lg overflow-hidden shadow-md bg-black">
        {tab === "intuition" ? (
          <video
            key="intuition"
            controls
            playsInline
            preload="metadata"
            poster="/explainers/linear-regression/intuition-poster.jpg"
            className="mx-auto block w-full max-w-[560px] aspect-square"
          >
            <source src="/explainers/linear-regression/intuition.mp4" type="video/mp4" />
          </video>
        ) : (
          <video
            key="math"
            controls
            playsInline
            preload="metadata"
            poster="/explainers/linear-regression/math-poster.jpg"
            className="block w-full aspect-video"
          >
            <source src="/explainers/linear-regression/math.mp4" type="video/mp4" />
          </video>
        )}
      </div>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Short on time? The intuition video is the whole idea in under a minute. The math video derives the formulas and computes
        every number from the data below.
      </p>
    </section>
  );
};

// ---------- the math table ----------
const MathTable: React.FC = () => {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 items-start">
      <div className="max-h-[520px] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark">
        <table className="w-full text-right text-[14px] tabular-nums">
          <thead className="sticky top-0 bg-white dark:bg-carddark shadow-sm">
            <tr>
              {["\\X_i", "\\Y_i", "\\X_i - \\xbar", "\\Y_i - \\ybar", "(\\X_i - \\xbar)(\\Y_i - \\ybar)", "(\\X_i - \\xbar)^2"].map((h) => (
                <th key={h} className="px-3 py-2 font-normal whitespace-nowrap">
                  <M>{h}</M>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {POINTS.map(([x, y], i) => (
              <tr
                key={i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                tabIndex={0}
                className={`border-t border-gray-100 dark:border-gray-700 cursor-default ${
                  hover === i ? "bg-amber-50 dark:bg-gray-700" : ""
                }`}
              >
                <td className="px-3 py-1.5" style={{ color: COL.x }}>{fmt(x)}</td>
                <td className="px-3 py-1.5" style={{ color: COL.y }}>{y}</td>
                <td className="px-3 py-1.5">{fmt(x - XBAR)}</td>
                <td className="px-3 py-1.5">{fmt(y - YBAR)}</td>
                <td className="px-3 py-1.5">{fmt((x - XBAR) * (y - YBAR))}</td>
                <td className="px-3 py-1.5">{fmt((x - XBAR) ** 2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 bg-white dark:bg-carddark border-t-2 border-gray-400">
            <tr className="font-semibold">
              <td className="px-3 py-2 text-left" colSpan={4}>
                Sum of all {N} rows
              </td>
              <td className="px-3 py-2" style={{ color: COL.b1 }}>{fmt(SXY)}</td>
              <td className="px-3 py-2" style={{ color: COL.b1 }}>{fmt(SXX)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="lg:sticky lg:top-24">
        <Chart line={BEST} highlight={hover} label="The fitted line, with the hovered house highlighted" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {hover === null
            ? "Hover a row to find that house on the chart."
            : `House ${hover + 1}: ${fmt(XS[hover])} sq ft, $${YS[hover]}k. The line predicts $${fmt(
                BEST.b0 + BEST.b1 * XS[hover],
                0
              )}k, a miss of ${fmt(YS[hover] - (BEST.b0 + BEST.b1 * XS[hover]), 0)}k.`}
        </p>
      </div>
    </div>
  );
};

// ---------- gradient descent playground ----------
const MX = XBAR;
const SDX = Math.sqrt(XS.reduce((s, x) => s + (x - MX) ** 2, 0) / N);
const GD_START = { a: 250, b: -40 }; // intercept at mean x, slope per std-dev
const toLine = (a: number, b: number): Line => ({ b1: b / SDX, b0: a - (b * MX) / SDX });

const GradientDescent: React.FC = () => {
  const [lr, setLr] = useState(0.1);
  const [hist, setHist] = useState([GD_START]);
  const [running, setRunning] = useState(false);
  const cur = hist[hist.length - 1];

  const step = (h: typeof hist) => {
    const { a, b } = h[h.length - 1];
    let ga = 0;
    let gb = 0;
    for (let i = 0; i < N; i++) {
      const z = (XS[i] - MX) / SDX;
      const err = a + b * z - YS[i];
      ga += err;
      gb += err * z;
    }
    return [...h, { a: a - (lr * 2 * ga) / N, b: b - (lr * 2 * gb) / N }];
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setHist((h) => {
        if (h.length > 200) {
          setRunning(false);
          return h;
        }
        return step(h);
      });
    }, 90);
    return () => clearInterval(id);
  }, [running, lr]); // eslint-disable-line react-hooks/exhaustive-deps

  const losses = hist.map((p) => sse(POINTS, toLine(p.a, p.b)));
  const maxL = Math.max(...losses, 1);
  const spark = losses
    .map((v, i) => `${i ? "L" : "M"}${(i / Math.max(40, losses.length - 1)) * 300},${100 - (Math.sqrt(v) / Math.sqrt(maxL)) * 96}`)
    .join(" ");
  const line = toLine(cur.a, cur.b);

  return (
    <div className="grid md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 items-start">
      <div>
        <Chart line={line} ghost={BEST} residuals tween={0} label="Gradient descent moving the line toward the best fit" />
        <Readout line={line} showL />
      </div>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-carddark">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setHist((h) => step(h))}
            className="rounded border border-marrsgreen dark:border-carrigreen px-3 py-1.5 text-sm font-medium text-marrsgreen dark:text-carrigreen"
          >
            Take one step
          </button>
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="rounded bg-marrsgreen dark:bg-carrigreen px-3 py-1.5 text-sm font-medium text-white dark:text-bgdark"
          >
            {running ? "Pause" : "Run"}
          </button>
          <button
            type="button"
            onClick={() => {
              setRunning(false);
              setHist([GD_START]);
            }}
            className="rounded border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm"
          >
            Reset
          </button>
        </div>
        <label className="mt-4 block text-sm">
          Learning rate <M>{"\\alpha"}</M>
          <select
            value={lr}
            onChange={(e) => setLr(Number(e.target.value))}
            className="ml-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent px-2 py-1"
          >
            <option value={0.02}>0.02 (cautious)</option>
            <option value={0.1}>0.1 (good)</option>
            <option value={0.45}>0.45 (bold)</option>
            <option value={1.05}>1.05 (too big)</option>
          </select>
        </label>
        <p className="mt-4 text-sm">
          Step {hist.length - 1}: <M>{`\\Lo = \\ce{${fmt(losses[losses.length - 1])}}`}</M>{" "}
          <span className="text-gray-500 dark:text-gray-400">(best possible {fmt(L_BEST)})</span>
        </p>
        <svg viewBox="0 0 300 104" className="mt-2 w-full h-24" role="img" aria-label="Total squared error after each step">
          <line x1={0} x2={300} y1={100} y2={100} className="stroke-gray-300 dark:stroke-gray-600" />
          <path d={spark} fill="none" stroke={COL.e} strokeWidth={2.5} />
        </svg>
        <p className="text-xs text-gray-500 dark:text-gray-400">Total squared error after each step (square-root scale)</p>
      </div>
    </div>
  );
};

// ---------- residual plot ----------
const ResidualPlot: React.FC = () => {
  const ry = (r: number) => 110 - (r / 70) * 95;
  return (
    <svg viewBox={`0 0 ${CW} 230`} className="w-full h-auto" role="img" aria-label="Residuals plotted against house size, scattered around zero">
      <line x1={PAD.l} x2={CW - PAD.r} y1={ry(0)} y2={ry(0)} stroke={COL.yhat} strokeWidth={2} strokeDasharray="6 5" />
      {[-50, 50].map((v) => (
        <text key={v} x={PAD.l - 10} y={ry(v) + 5} textAnchor="end" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
          {v > 0 ? "+" : ""}
          {v}k
        </text>
      ))}
      <text x={PAD.l - 10} y={ry(0) + 5} textAnchor="end" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
        0
      </text>
      {POINTS.map(([x, y], i) => {
        const r = y - (BEST.b0 + BEST.b1 * x);
        return (
          <g key={i}>
            <line x1={sx(x)} x2={sx(x)} y1={ry(0)} y2={ry(r)} stroke={COL.e} strokeWidth={2} />
            <circle cx={sx(x)} cy={ry(r)} r={5.5} fill={COL.e} />
          </g>
        );
      })}
      {[1000, 1500, 2000, 2500].map((v) => (
        <text key={v} x={sx(v)} y={222} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
          {fmt(v)}
        </text>
      ))}
    </svg>
  );
};

// ================= the article =================
const LinearRegressionStory: React.FC = () => {
  const [mine, setMine] = useState<Line>({ b0: 160, b1: 0.1 });
  const guess: Line = { b0: 150, b1: 0.09 };

  const steps: Step[] = useMemo(
    () => [
      {
        key: "data",
        body: (
          <>
            <strong>Here are {N} houses.</strong> Each dot is one sale: its size in square feet along the bottom, and what it sold
            for up the side. Bigger houses tend to cost more, but not exactly: two houses of the same size can sell for quite
            different prices. That scatter is the <em>noise</em> no model can explain.
          </>
        ),
      },
      {
        key: "guess",
        body: (
          <>
            <strong>A model is a line.</strong> Linear regression describes the trend with a straight line,
            <span className="block my-2 text-center">
              <M>{"\\yh = \\bz + \\bo\\,\\X"}</M>
            </span>
            where <M>{"\\bz"}</M> (the intercept) sets the height and <M>{"\\bo"}</M> (the slope) sets how steeply price rises per
            square foot. Here's a first guess: <M>{"\\bz = 150,\\ \\bo = 0.09"}</M>.
          </>
        ),
      },
      {
        key: "residuals",
        body: (
          <>
            <strong>Measure the misses.</strong> For each house, the gap between the real price <M>{"\\Y_i"}</M> and the line's
            prediction <M>{"\\yh_i"}</M> is called the <em>residual</em>:
            <span className="block my-2 text-center">
              <M>{"\\E_i = \\Y_i - \\yh_i"}</M>
            </span>
            Points above the line have positive residuals, points below have negative ones.
          </>
        ),
      },
      {
        key: "squares",
        body: (
          <>
            <strong>Square them and add them up.</strong> Squaring makes every miss positive and makes big misses count much more
            than small ones (a miss twice as big costs four times as much). The total is the <em>loss</em>:
            <span className="block my-2 text-center">
              <M>{"\\Lo(\\bz,\\bo) = \\sum_{i=1}^{n} \\E_i^{\\,2}"}</M>
            </span>
            For our guess, <M>{`\\Lo = \\ce{${fmt(sse(POINTS, guess))}}`}</M>. The yellow squares on the chart are those squared
            misses, drawn to scale.
          </>
        ),
      },
      {
        key: "best",
        body: (
          <>
            <strong>The best line has the smallest loss.</strong> Out of every possible line, least squares picks the one with the
            least total squared error:
            <span className="block my-2 text-center">
              <M>{`\\yh = \\cb{${fmt(BEST.b0, 1)}} + \\cs{${BEST.b1.toFixed(4)}}\\,\\X`}</M>
            </span>
            Its loss is <M>{`\\Lo = \\ce{${fmt(L_BEST)}}`}</M>, down from <M>{`\\ce{${fmt(sse(POINTS, guess))}}`}</M>. Notice it
            still misses most houses. That's the noise again, and no straight line can do better.
          </>
        ),
      },
      {
        key: "yours",
        body: (
          <>
            <strong>Your turn.</strong> Drag the sliders and try to beat least squares. The dashed line is the best fit.
            <Slider label={<M>{"\\bz"}</M>} value={mine.b0} min={-100} max={350} step={0.5} color={COL.b0} onChange={(v) => setMine((m) => ({ ...m, b0: v }))} />
            <Slider label={<M>{"\\bo"}</M>} value={mine.b1} min={0} max={0.3} step={0.0005} color={COL.b1} onChange={(v) => setMine((m) => ({ ...m, b1: v }))} />
            <p className="mt-3 text-[15px]">
              Your loss: <M>{`\\ce{${fmt(sse(POINTS, mine))}}`}</M>{" "}
              {sse(POINTS, mine) <= L_BEST * 1.005 ? (
                <span className="font-semibold text-marrsgreen dark:text-carrigreen">That's the best possible. Nice!</span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">vs. best {fmt(L_BEST)}</span>
              )}
            </p>
          </>
        ),
      },
    ],
    [mine] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const chartFor = (s: number) => {
    const line = s === 0 ? null : s === 1 || s === 2 || s === 3 ? guess : s === 4 ? BEST : mine;
    return (
      <div>
        <Chart line={line} ghost={s === 5 ? BEST : null} residuals={s >= 2} squares={s >= 3} tween={s === 5 ? 0 : 650} />
        <Readout line={line} showL={s >= 3} />
      </div>
    );
  };

  return (
    <div className="not-prose relative left-1/2 -translate-x-1/2 w-[min(1150px,calc(100vw-2rem))] text-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-3xl">
        <Videos />

        <P>
          Say you're shopping for a house and see one listed at 2,600 square feet. What's a fair price? A natural approach is to
          look at houses that already sold, notice that bigger ones cost more, and turn that pattern into a rule:{" "}
          <em>price goes up by about this much per square foot</em>. That rule is a linear regression. It's one of the oldest
          tools in statistics and still one of the most used, and nearly every machine learning model builds on the same idea.
        </P>
        <P>Below, we'll build one from 25 real-looking house sales, see where its numbers come from, and learn when to trust it.</P>
      </div>

      <div className="mx-auto max-w-3xl">
        <H2 id="how-it-works">How it works</H2>
      </div>
      <Scrolly steps={steps} chart={chartFor} />

      <div className="mx-auto max-w-3xl">
        <H2 id="the-math">Where the numbers come from</H2>
        <P>
          You could find the best line by trial and error, like you just did with the sliders. But there's an exact answer. Picture
          the loss <M>{"\\Lo"}</M> as a bowl, with one value for every pair of <M>{"\\bz"}</M> and <M>{"\\bo"}</M>. At the bottom
          of the bowl, the slope in every direction is zero, so we take each derivative and set it to zero:
        </P>
        <DM>{"\\frac{\\partial \\Lo}{\\partial \\bz} = -2\\sum_{i}\\big(\\Y_i - \\bz - \\bo\\,\\X_i\\big) = 0 \\quad\\Longrightarrow\\quad \\bz = \\ybar - \\bo\\,\\xbar"}</DM>
        <DM>{"\\frac{\\partial \\Lo}{\\partial \\bo} = -2\\sum_{i}\\X_i\\big(\\Y_i - \\bz - \\bo\\,\\X_i\\big) = 0 \\quad\\Longrightarrow\\quad \\bo = \\frac{\\sum_i (\\X_i - \\xbar)(\\Y_i - \\ybar)}{\\sum_i (\\X_i - \\xbar)^2}"}</DM>
        <P>
          The first result says the best line always passes through the average house (<M>{"\\xbar, \\ybar"}</M>). The second
          says the slope is how much size and price move <em>together</em>, divided by how much size moves on its own. Now let's
          compute them. First the averages:
        </P>
        <DM>{`\\xbar = \\frac{${fmt(XS[0])} + ${fmt(XS[1])} + \\cdots + ${fmt(XS[N - 1])}}{${N}} = \\frac{${fmt(XS.reduce((a, b) => a + b, 0))}}{${N}} = \\cx{${fmt(XBAR)}} \\qquad \\ybar = \\frac{${YS[0]} + ${YS[1]} + \\cdots + ${YS[N - 1]}}{${N}} = \\frac{${fmt(YS.reduce((a, b) => a + b, 0))}}{${N}} = \\cy{${fmt(YBAR)}}`}</DM>
        <P>Then, for every house, how far it sits from the average in each direction, and the two products we need to sum:</P>
      </div>
      <MathTable />
      <div className="mx-auto max-w-3xl">
        <P>Two divisions finish the job:</P>
        <DM>{`\\bo = \\frac{\\cs{${fmt(SXY)}}}{\\cs{${fmt(SXX)}}} = \\cs{${BEST.b1.toFixed(4)}} \\qquad \\bz = \\cy{${fmt(YBAR)}} - \\cs{${BEST.b1.toFixed(4)}} \\times \\cx{${fmt(XBAR)}} = \\cb{${fmt(BEST.b0, 1)}}`}</DM>
        <P>
          And the 2,600 sq ft house? <M>{`\\yh = \\cb{${fmt(BEST.b0, 1)}} + \\cs{${BEST.b1.toFixed(4)}} \\times \\cx{2,600} = \\cp{${fmt(BEST.b0 + BEST.b1 * 2600, 1)}}`}</M>,
          so about ${fmt(BEST.b0 + BEST.b1 * 2600, 0)}k.
        </P>

        <H2 id="gradient-descent">Another way down the bowl: gradient descent</H2>
        <P>
          The formulas above only exist because linear regression is simple. Most machine learning models have no closed-form
          answer, so they find the bottom of the bowl by walking downhill instead. Gradient descent starts from any line, measures
          which way the loss slopes, and takes a small step the other way:
        </P>
        <DM>{"\\bz \\leftarrow \\bz - \\alpha\\,\\frac{\\partial \\Lo}{\\partial \\bz} \\qquad \\bo \\leftarrow \\bo - \\alpha\\,\\frac{\\partial \\Lo}{\\partial \\bo}"}</DM>
        <P>
          The learning rate <M>{"\\alpha"}</M> sets the step size. Too small and it crawls; too big and it overshoots the bottom
          and bounces further away each step. Try them all:
        </P>
      </div>
      <GradientDescent />
      <div className="mx-auto max-w-3xl">
        <P>
          (To keep the steps well-behaved, the playground measures house size in standard deviations behind the scenes, a common
          trick called <em>feature scaling</em>. The line it draws is the same.)
        </P>

        <H2 id="how-good">How good is the fit?</H2>
        <P>
          The loss alone is hard to judge: is {fmt(L_BEST)} good? A more readable measure is <M>{"R^2"}</M>, the share of the
          variation in price that the line explains. Compare the loss to what you'd get by ignoring size completely and always
          guessing the average price:
        </P>
        <DM>{`R^2 = 1 - \\frac{\\sum_i \\E_i^{\\,2}}{\\sum_i (\\Y_i - \\ybar)^2} = 1 - \\frac{\\ce{${fmt(L_BEST)}}}{${fmt(SST)}} = ${R2.toFixed(3)}`}</DM>
        <P>
          So size explains about {Math.round(R2 * 100)}% of the variation in price; the other {100 - Math.round(R2 * 100)}% is the
          noise. In dollars, a typical miss (the root mean squared error, <M>{`\\sqrt{\\Lo / n}`}</M>) is about ${fmt(RMSE, 0)}k,
          so a fair way to quote the 2,600 sq ft prediction is "around ${fmt(BEST.b0 + BEST.b1 * 2600, 0)}k, give or take $
          {fmt(RMSE, 0)}k".
        </P>
        <P>
          It's also worth plotting the residuals themselves. If the line fits, they should look like random scatter around zero,
          with no pattern:
        </P>
        <ResidualPlot />
        <P>
          These do. A curve, a funnel shape, or clusters would be a sign that a straight line is the wrong model.
        </P>

        <H2 id="reading">Reading the numbers</H2>
        <ul className="my-4 list-disc pl-6 space-y-2 text-[17px] leading-relaxed">
          <li>
            <M>{`\\bo = \\cs{${BEST.b1.toFixed(4)}}`}</M>: each extra square foot adds about ${fmt(BEST.b1 * 1000, 0)} to the price
            (the prices are in thousands). That's usually the number people care about.
          </li>
          <li>
            <M>{`\\bz = \\cb{${fmt(BEST.b0, 1)}}`}</M>: the line's height at 0 sq ft. On its own it means little, since nobody
            sells a zero-size house; it just positions the line.
          </li>
        </ul>

        <H2 id="careful">When to be careful</H2>
        <ul className="my-4 list-disc pl-6 space-y-2 text-[17px] leading-relaxed">
          <li>
            <strong>Outliers pull hard.</strong> Because misses are squared, one wildly priced house can tilt the whole line.
          </li>
          <li>
            <strong>Only straight lines.</strong> If price rises faster for bigger houses, a line will miss in a systematic way
            (and the residual plot will show it).
          </li>
          <li>
            <strong>Don't predict far outside the data.</strong> Our houses range from 860 to 2,380 sq ft. The line knows nothing
            about a 10,000 sq ft mansion.
          </li>
          <li>
            <strong>Association isn't causation.</strong> Size and price move together, but adding a room won't necessarily add
            the full ${fmt(BEST.b1 * 1000, 0)} per square foot.
          </li>
        </ul>

        <H2 id="code">In code</H2>
        <pre className="my-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-[14px] leading-relaxed text-gray-100">
          <code>{`import numpy as np

size  = np.array([${XS.join(", ")}])
price = np.array([${YS.join(", ")}])

b1 = np.sum((size - size.mean()) * (price - price.mean())) / np.sum((size - size.mean())**2)
b0 = price.mean() - b1 * size.mean()
print(f"price = {b0:.1f} + {b1:.4f} x size")   # price = ${fmt(BEST.b0, 1)} + ${BEST.b1.toFixed(4)} x size
print(b0 + b1 * 2600)                         # ${fmt(BEST.b0 + BEST.b1 * 2600, 1)}

# the same with scikit-learn
from sklearn.linear_model import LinearRegression
model = LinearRegression().fit(size.reshape(-1, 1), price)
print(model.intercept_, model.coef_[0], model.score(size.reshape(-1, 1), price))  # R^2 = ${R2.toFixed(3)}`}</code>
        </pre>

        <H2 id="further">Further reading</H2>
        <ul className="my-4 list-disc pl-6 space-y-2 text-[17px]">
          <li>
            <a className="link" href="https://www.statlearning.com/" target="_blank" rel="noopener noreferrer">
              An Introduction to Statistical Learning
            </a>
            , chapter 3: the classic, free textbook treatment.
          </li>
          <li>
            <a className="link" href="https://mlu-explain.github.io/linear-regression/" target="_blank" rel="noopener noreferrer">
              MLU-Explain: Linear Regression
            </a>
            : another visual walkthrough, and the inspiration for this format.
          </li>
          <li>
            <a
              className="link"
              href="https://scikit-learn.org/stable/modules/linear_model.html#ordinary-least-squares"
              target="_blank"
              rel="noopener noreferrer"
            >
              scikit-learn: Ordinary Least Squares
            </a>
            : the practical reference.
          </li>
        </ul>
        <p className="mt-10 text-sm italic text-gray-600 dark:text-gray-400">
          Part of a series explaining one data science concept at a time. The data is synthetic, built to look like a typical
          housing market.
        </p>
      </div>
    </div>
  );
};

export default LinearRegressionStory;
