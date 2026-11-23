import { useMemo, useState } from "react";
import Link from "next/link";

import { DM, M } from "@/components/explainers/Tex";
import { Code, H2, Narrow, P, Scrolly, Slider, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { AA_EXAMPLE, AA_FINAL_FP, AA_PEEK_FP, AA_ZS, AB, AB_DAILY, AB_DAYS, AB_RESULT as R, abTest, binned, normCDF, power, sampleSize } from "lib/explainers/stats";

/**
 * "A/B Testing" — fourth post of the statistics series: the experiment,
 * the A/A world, the z-test and p-value, the confidence interval, a
 * calculator, power and sample size, peeking, other pitfalls, code.
 */

const A_COL = "#94A3B8";
const B_COL = "#05CE91";
const BLUE = "#2B8CBE";
const ORANGE = "#E8772E";
const RED = "#E2483D";

const W = 560;
const H = 340;
const PD = { l: 52, r: 14, t: 14, b: 50 };
const pts = (x: number, d = 2) => (x * 100).toFixed(d);
const AA_GAPS = AA_ZS.map((z) => z[AB_DAYS - 1] * R.se0);

const Axes: React.FC<{ xt: { v: number; s: string }[]; yt: { v: number; s: string }[]; sx: (v: number) => number; sy: (v: number) => number; xlabel: string }> = ({ xt, yt, sx, sy, xlabel }) => (
  <>
    {yt.map((t) => (
      <text key={t.s} x={PD.l - 8} y={sy(t.v) + 4} textAnchor="end" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
        {t.s}
      </text>
    ))}
    {xt.map((t) => (
      <text key={t.s} x={sx(t.v)} y={H - PD.b + 20} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
        {t.s}
      </text>
    ))}
    <line x1={PD.l} x2={W - PD.r} y1={H - PD.b} y2={H - PD.b} className="stroke-gray-600 dark:stroke-gray-300" />
    <line x1={PD.l} x2={PD.l} y1={PD.t} y2={H - PD.b} className="stroke-gray-600 dark:stroke-gray-300" />
    <text x={(PD.l + W - PD.r) / 2} y={H - 8} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300 text-[14px]">
      {xlabel}
    </text>
  </>
);

// ---------- day-by-day rates ----------
const DailyPlot: React.FC<{ upTo?: number }> = ({ upTo = AB_DAYS }) => {
  const sx = (d: number) => PD.l + ((d - 0.5) / AB_DAYS) * (W - PD.l - PD.r);
  const sy = (v: number) => H - PD.b - ((v - 0.09) / 0.03) * (H - PD.t - PD.b);
  const rows = AB_DAILY.slice(0, upTo);
  const line = (f: (d: (typeof AB_DAILY)[number]) => number) => rows.map((d, i) => `${i ? "L" : "M"}${sx(d.day).toFixed(1)},${sy(f(d)).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Running conversion rate of A and B by day">
      <path d={line((d) => d.kA / d.nA)} fill="none" stroke={A_COL} strokeWidth={3} />
      <path d={line((d) => d.kB / d.nB)} fill="none" stroke={B_COL} strokeWidth={3} />
      {rows.map((d) => (
        <g key={d.day}>
          <circle cx={sx(d.day)} cy={sy(d.kA / d.nA)} r={4} fill={A_COL} />
          <circle cx={sx(d.day)} cy={sy(d.kB / d.nB)} r={4} fill={B_COL} />
        </g>
      ))}
      <text x={sx(upTo) + 8} y={sy(rows[rows.length - 1].kB / rows[rows.length - 1].nB) - 8} className="text-[13px]" fill="#047857" textAnchor="end">
        B
      </text>
      <text x={sx(upTo) + 8} y={sy(rows[rows.length - 1].kA / rows[rows.length - 1].nA) + 18} className="text-[13px] fill-gray-500" textAnchor="end">
        A
      </text>
      <Axes
        sx={sx}
        sy={sy}
        xt={[1, 4, 7, 10, 14].map((v) => ({ v, s: String(v) }))}
        yt={[0.09, 0.1, 0.11, 0.12].map((v) => ({ v, s: `${Math.round(v * 100)}%` }))}
        xlabel="Day of the test (running conversion rate)"
      />
    </svg>
  );
};

// ---------- the A/A world ----------
const GapHist: React.FC<{ observed?: boolean; tails?: boolean; ci?: boolean }> = ({ observed = false, tails = false, ci = false }) => {
  const lo = -0.02;
  const hi = 0.02;
  const bw = 0.0005;
  const h = binned(AA_GAPS, lo, hi, bw);
  const top = Math.max(...h) * 1.12;
  const sx = (v: number) => PD.l + ((v - lo) / (hi - lo)) * (W - PD.l - PD.r);
  const sy = (c: number) => H - PD.b - (c / top) * (H - PD.t - PD.b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Gaps between two identical checkouts in 2,000 simulated A/A tests">
      {h.map((c, i) => {
        const mid = lo + (i + 0.5) * bw;
        const red = tails && Math.abs(mid) >= Math.abs(R.diff) - bw / 2;
        return <rect key={i} x={sx(lo + i * bw) + 0.5} width={sx(bw) - sx(0) - 1} y={sy(c)} height={H - PD.b - sy(c)} fill={red ? RED : A_COL} opacity={ci ? 0.35 : 1} />;
      })}
      {observed && (
        <>
          <line x1={sx(R.diff)} x2={sx(R.diff)} y1={PD.t} y2={H - PD.b} stroke={B_COL} strokeWidth={3} />
          <text x={sx(R.diff) + 6} y={PD.t + 14} className="text-[13px] font-semibold" fill="#047857">
            ours: +{pts(R.diff)}
          </text>
        </>
      )}
      {ci && (
        <>
          <line x1={sx(0)} x2={sx(0)} y1={PD.t} y2={H - PD.b} className="stroke-gray-500" strokeDasharray="4 4" />
          <line x1={sx(R.lo)} x2={sx(R.hi)} y1={sy(top * 0.45)} y2={sy(top * 0.45)} stroke={BLUE} strokeWidth={8} strokeLinecap="round" />
          <circle cx={sx(R.diff)} cy={sy(top * 0.45)} r={6} fill="white" stroke={BLUE} strokeWidth={3} />
        </>
      )}
      <Axes
        sx={sx}
        sy={(v) => v}
        xt={[-0.02, -0.01, 0, 0.01, 0.02].map((v) => ({ v, s: `${v > 0 ? "+" : ""}${(v * 100).toFixed(0)}` }))}
        yt={[]}
        xlabel="Gap B − A in percentage points"
      />
    </svg>
  );
};

// ---------- p-value path of an A/A test ----------
const PeekPlot: React.FC = () => {
  const pv = AA_ZS[AA_EXAMPLE].map((z) => 2 * (1 - normCDF(Math.abs(z))));
  const sx = (d: number) => PD.l + ((d - 0.5) / AB_DAYS) * (W - PD.l - PD.r);
  const sy = (v: number) => H - PD.b - v * (H - PD.t - PD.b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Daily p-value of one A/A test">
      <rect x={PD.l} width={W - PD.l - PD.r} y={sy(0.05)} height={sy(0) - sy(0.05)} fill={RED} opacity={0.15} />
      <path d={pv.map((p, d) => `${d ? "L" : "M"}${sx(d + 1).toFixed(1)},${sy(p).toFixed(1)}`).join("")} fill="none" stroke={BLUE} strokeWidth={2.5} />
      {pv.map((p, d) => (
        <circle key={d} cx={sx(d + 1)} cy={sy(p)} r={5} fill={p < 0.05 ? RED : BLUE} stroke="white" strokeWidth={1.5} />
      ))}
      <Axes
        sx={sx}
        sy={sy}
        xt={[1, 4, 7, 10, 14].map((v) => ({ v, s: String(v) }))}
        yt={[0.05, 0.25, 0.5, 0.75, 1].map((v) => ({ v, s: v === 0.05 ? "0.05" : v.toFixed(2) }))}
        xlabel="Day of an A/A test (p-value if you stopped that day)"
      />
    </svg>
  );
};

// ---------- calculator ----------
const NumberField: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <label className="block text-sm">
    <span className="text-gray-600 dark:text-gray-400">{label}</span>
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(Math.max(0, Math.round(Number(e.target.value) || 0)))}
      className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-bgdark px-2 py-1 tabular-nums"
    />
  </label>
);

const Calculator: React.FC = () => {
  const [nA, setNA] = useState(AB.nA);
  const [kA, setKA] = useState(AB.kA);
  const [nB, setNB] = useState(AB.nB);
  const [kB, setKB] = useState(AB.kB);
  const ok = nA > 0 && nB > 0 && kA <= nA && kB <= nB && kA + kB > 0 && kA + kB < nA + nB;
  const r = ok ? abTest(kA, nA, kB, nB) : null;
  return (
    <div className="my-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NumberField label="A visitors" value={nA} onChange={setNA} />
        <NumberField label="A conversions" value={kA} onChange={setKA} />
        <NumberField label="B visitors" value={nB} onChange={setNB} />
        <NumberField label="B conversions" value={kB} onChange={setKB} />
      </div>
      {r ? (
        <dl className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <dt className="text-gray-500 text-sm">Rates</dt>
            <dd className="font-semibold tabular-nums">
              {pts(r.pA)}% vs {pts(r.pB)}%
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 text-sm">z</dt>
            <dd className="font-semibold tabular-nums">{r.z.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-sm">p-value (two-sided)</dt>
            <dd className="font-semibold tabular-nums" style={{ color: r.p < 0.05 ? "#047857" : undefined }}>
              {r.p < 0.0001 ? "< 0.0001" : r.p.toFixed(4)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 text-sm">95% CI for B − A</dt>
            <dd className="font-semibold tabular-nums">
              {pts(r.lo)} to {pts(r.hi)} pts
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 text-sm" style={{ color: RED }}>
          Enter visitors greater than zero and conversions no larger than visitors.
        </p>
      )}
      <p className="mt-3 text-[13px] text-gray-500">Two-proportion z-test with a pooled standard error; the interval uses unpooled standard errors. Best with at least 10 conversions and 10 non-conversions per arm.</p>
    </div>
  );
};

// ---------- power planner ----------
const Planner: React.FC = () => {
  const [base, setBase] = useState(10);
  const [lift, setLift] = useState(10);
  const [n, setN] = useState(15000);
  const pA = base / 100;
  const pB = Math.min(0.99, pA * (1 + lift / 100));
  const pw = power(pA, pB, n);
  const need = sampleSize(pA, pB);
  const curve = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i <= 80; i++) {
      const m = 500 + (i / 80) * 59500;
      out.push(`${i ? "L" : "M"}${(PD.l + (m / 60000) * (W - PD.l - PD.r)).toFixed(1)},${(H - PD.b - power(pA, pB, m) * (H - PD.t - PD.b)).toFixed(1)}`);
    }
    return out.join("");
  }, [pA, pB]);
  const sx = (m: number) => PD.l + (m / 60000) * (W - PD.l - PD.r);
  const sy = (v: number) => H - PD.b - v * (H - PD.t - PD.b);
  return (
    <div className="my-6 grid md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 items-center">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Power against visitors per arm">
          <line x1={PD.l} x2={W - PD.r} y1={sy(0.8)} y2={sy(0.8)} className="stroke-gray-400" strokeDasharray="5 4" />
          <path d={curve} fill="none" stroke={B_COL} strokeWidth={3} />
          <circle cx={sx(Math.min(n, 60000))} cy={sy(pw)} r={7} fill={ORANGE} stroke="white" strokeWidth={2} />
          <Axes
            sx={sx}
            sy={sy}
            xt={[0, 20000, 40000, 60000].map((v) => ({ v, s: `${v / 1000}k` }))}
            yt={[0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => ({ v, s: `${Math.round(v * 100)}%` }))}
            xlabel="Visitors per arm"
          />
        </svg>
      </div>
      <div>
        <Slider label="Baseline conversion rate (%)" value={base} min={1} max={50} step={0.5} digits={1} color={A_COL} onChange={setBase} />
        <Slider label="Relative lift to detect (%)" value={lift} min={1} max={50} step={1} digits={0} color={B_COL} onChange={setLift} />
        <Slider label="Visitors per arm" value={n} min={500} max={60000} step={500} digits={0} color={ORANGE} onChange={setN} />
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <dt className="text-gray-500 text-sm">Power</dt>
            <dd className="text-xl font-semibold tabular-nums" style={{ color: pw >= 0.8 ? "#047857" : RED }}>
              {Math.round(pw * 100)}%
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 text-sm">Needed for 80% power</dt>
            <dd className="text-xl font-semibold tabular-nums">{need.toLocaleString("en-US")}</dd>
          </div>
        </dl>
        <p className="mt-2 text-[13px] text-gray-500">
          Detecting {base}% → {(pB * 100).toFixed(2)}% at α = 0.05, two-sided.
        </p>
      </div>
    </div>
  );
};

// ================= the article =================
const ABTestStory: React.FC = () => {
  const looks = [
    { k: 1, days: [13], label: "Once, at the end" },
    { k: 2, days: [6, 13], label: "Twice (day 7 and 14)" },
    { k: 4, days: [3, 6, 9, 13], label: "Four times" },
    { k: 7, days: [1, 3, 5, 7, 9, 11, 13], label: "Every other day" },
    { k: 14, days: Array.from({ length: 14 }, (_, i) => i), label: "Every day" },
  ].map((l) => ({ ...l, fp: AA_ZS.filter((z) => l.days.some((d) => Math.abs(z[d]) > 1.96)).length / AA_ZS.length }));
  const d3 = AB_DAILY[2];

  const steps: Step[] = [
    {
      key: "daily",
      body: (
        <>
          <strong>Run the experiment.</strong> Every visitor to the checkout is randomly shown the current page (A) or a new design (B),
          15,000 each over 14 days. Early on the gap jumps around: by day 3, B was ahead {pts(d3.kB / d3.nB)}% to {pts(d3.kA / d3.nA)}%.
        </>
      ),
    },
    {
      key: "result",
      body: (
        <>
          <strong>The final numbers.</strong> A converted {AB.kA.toLocaleString("en-US")} of 15,000 ({pts(R.pA)}%), B converted{" "}
          {AB.kB.toLocaleString("en-US")} ({pts(R.pB)}%). B is ahead by {pts(R.diff)} points, a {(R.lift * 100).toFixed(1)}% relative lift.
          But two identical pages would never produce identical numbers either.
        </>
      ),
    },
    {
      key: "aa",
      body: (
        <>
          <strong>Imagine B changed nothing.</strong> Here are 2,000 simulated A/A tests: two identical checkouts, 15,000 visitors each.
          The gaps they produce by pure chance form a bell (the{" "}
          <Link className="link" href="/blog/posts/central-limit-theorem-explained/">
            central limit theorem
          </Link>{" "}
          at work), mostly within ±0.7 points. Our +{pts(R.diff)} (green) sits out in the tail.
        </>
      ),
    },
    {
      key: "p",
      body: (
        <>
          <strong>The p-value.</strong> The share of "no difference" worlds that produce a gap at least as large as ours, in either
          direction (red): <strong>{R.p.toFixed(3)}</strong>. Below the usual 0.05 threshold, so we call the result statistically
          significant.
        </>
      ),
    },
    {
      key: "ci",
      body: (
        <>
          <strong>How big is the gain?</strong> The 95% confidence interval for B − A runs from +{pts(R.lo)} to +{pts(R.hi)} points. It
          excludes zero, matching the p-value. But the real lift could be anywhere from tiny to large.
        </>
      ),
    },
  ];
  const chartFor = (s: number) => {
    if (s === 0) return <DailyPlot upTo={3} />;
    if (s === 1) return <DailyPlot />;
    if (s === 2) return <GapHist observed />;
    if (s === 3) return <GapHist observed tails />;
    return <GapHist ci />;
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:47", src: "/explainers/ab-testing/intuition.mp4", poster: "/explainers/ab-testing/intuition-poster.jpg", square: true },
            { key: "math", label: "The math", len: "2:10", src: "/explainers/ab-testing/math.mp4", poster: "/explainers/ab-testing/math-poster.jpg" },
          ]}
          note="The intuition video is the idea in under a minute. The math video works through the z-test, the p-value, the interval, power, sample size and the peeking trap with this experiment's numbers."
        />
        <P>
          This post puts the series together. <Link className="link" href="/blog/posts/probability-explained/">Probability</Link> told us a
          conversion rate is noisy, the <Link className="link" href="/blog/posts/law-of-large-numbers-explained/">law of large numbers</Link>{" "}
          that the noise shrinks with traffic, and the{" "}
          <Link className="link" href="/blog/posts/central-limit-theorem-explained/">central limit theorem</Link> what shape it takes. An A/B
          test uses all three to answer one question: is the difference between two versions bigger than the noise would make?
        </P>
        <H2 id="how-it-works">Real difference, or noise?</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="z-test">The z-test</H2>
        <P>
          Under the <strong>null hypothesis</strong> <M>{"H_0"}</M>, the checkouts convert at the same rate, so we estimate that rate by pooling
          both arms:
        </P>
        <DM>{`\\hat{p} = \\frac{${AB.kA} + ${AB.kB}}{30{,}000} = ${R.pool.toFixed(4)}`}</DM>
        <P>From the CLT, the gap between two independent rates has standard error</P>
        <DM>{`\\text{SE}_0 = \\sqrt{\\hat{p}(1 - \\hat{p})\\left(\\frac{1}{n_A} + \\frac{1}{n_B}\\right)} = ${R.se0.toFixed(5)}`}</DM>
        <P>and the test statistic counts how many standard errors the observed gap is from zero:</P>
        <DM>{`z = \\frac{\\hat{p}_B - \\hat{p}_A}{\\text{SE}_0} = \\frac{${R.diff.toFixed(5)}}{${R.se0.toFixed(5)}} = ${R.z.toFixed(2)}`}</DM>
        <P>
          If <M>{"H_0"}</M> is true, <M>{"z"}</M> is approximately standard normal, so the two-sided p-value is
        </P>
        <DM>{`p = 2\\big(1 - \\Phi(|z|)\\big) = 2\\big(1 - \\Phi(${R.z.toFixed(2)})\\big) = ${R.p.toFixed(4)}`}</DM>

        <H2 id="p-value">What the p-value means</H2>
        <P>
          <strong>It is:</strong> the probability of seeing a gap at least this large if the checkouts were truly identical. A small value says
          the data would be surprising under "no difference".
        </P>
        <UL>
          <li>
            It is <em>not</em> the probability that <M>{"H_0"}</M> is true, and <M>{"1 - p"}</M> is not the probability that B is better.
          </li>
          <li>It says nothing about how big the effect is. A tiny lift on huge traffic can have a tiny p-value.</li>
          <li>
            The 0.05 threshold, <M>{"\\alpha"}</M>, is a convention. It means accepting a 5% chance of declaring a winner when there's no
            difference (a <em>Type I error</em>).
          </li>
        </UL>

        <H2 id="confidence-interval">The confidence interval</H2>
        <P>
          Report the size of the effect, not just whether it's significant. For the interval we don't assume <M>{"H_0"}</M>, so each arm keeps
          its own rate:
        </P>
        <DM>{`(\\hat{p}_B - \\hat{p}_A) \\pm 1.96\\sqrt{\\frac{\\hat{p}_A(1-\\hat{p}_A)}{n_A} + \\frac{\\hat{p}_B(1-\\hat{p}_B)}{n_B}} = ${pts(R.diff)} \\pm ${pts(1.96 * R.se)} \\text{ points}`}</DM>
        <P>
          That's +{pts(R.lo)} to +{pts(R.hi)} points, or roughly +{((R.lo / R.pA) * 100).toFixed(0)}% to +{((R.hi / R.pA) * 100).toFixed(0)}% in
          relative terms. If the new checkout costs money to maintain, the low end of that range is what the decision should survive. Try your
          own numbers:
        </P>
        <Calculator />

        <H2 id="power">Power and sample size</H2>
        <P>
          The opposite mistake, missing a real improvement, is a <em>Type II error</em>. <strong>Power</strong> is the chance of avoiding it:
          the probability the test comes out significant when the lift is real. If B truly converts at 11% against 10%, a test with 15,000
          visitors per arm has {Math.round(power(0.1, 0.11, 15000) * 100)}% power. Solving for <M>{"n"}</M> gives the standard sample-size
          formula:
        </P>
        <DM>{"n = \\frac{\\left(z_{\\alpha/2}\\sqrt{2\\bar{p}(1-\\bar{p})} + z_{\\beta}\\sqrt{p_A(1-p_A) + p_B(1-p_B)}\\right)^2}{(p_B - p_A)^2}"}</DM>
        <P>
          For 10% → 11% with <M>{"\\alpha = 0.05"}</M> and 80% power, that's {sampleSize(0.1, 0.11).toLocaleString("en-US")} visitors per arm. The
          lift sits squared in the denominator: halve the lift you want to detect and you need four times the traffic (
          {sampleSize(0.1, 0.105).toLocaleString("en-US")} per arm for a 5% lift). Plan it here:
        </P>
      </Narrow>
      <Planner />
      <Narrow>
        <H2 id="peeking">The peeking trap</H2>
        <P>
          It's tempting to watch the p-value every day and stop as soon as it dips below 0.05. Here is one A/A test, two identical checkouts,
          checked daily:
        </P>
        <div className="mx-auto max-w-xl my-4">
          <PeekPlot />
        </div>
        <P>
          It was "significant" on several early days and ended nowhere near it. Each look is another chance for noise to cross the line. Across
          our 2,000 A/A tests:
        </P>
        <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-[15px]">
            <thead className="bg-gray-50 dark:bg-carddark text-left">
              <tr>
                <th className="px-3 py-2 font-medium">How often you check (stop at first p &lt; 0.05)</th>
                <th className="px-3 py-2 font-medium text-right">False winners</th>
              </tr>
            </thead>
            <tbody>
              {looks.map((l) => (
                <tr key={l.k} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-3 py-2">{l.label}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold" style={{ color: l.fp > 0.07 ? RED : undefined }}>
                    {(l.fp * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>
          Checking once gives the promised {(AA_FINAL_FP * 100).toFixed(0)}%. Checking daily quadruples it to {(AA_PEEK_FP * 100).toFixed(0)}%. Our
          real experiment had its own wobble: its p-value was 0.07 on day 3, 0.12 on day 7, and only settled below 0.05 from day 10. The fix is
          to pick the sample size in advance and analyze once, or to use a <strong>sequential test</strong> (such as group-sequential designs or
          always-valid p-values) that is built for repeated looks.
        </P>

        <H2 id="pitfalls">Other ways A/B tests go wrong</H2>
        <UL>
          <li>
            <strong>Many metrics, many variants.</strong> Test 10 independent metrics at <M>{"\\alpha = 0.05"}</M> and the chance at least one
            is "significant" by luck is <M>{"1 - 0.95^{10} = 40\\%"}</M>. Pick one primary metric up front, or correct for multiple
            comparisons.
          </li>
          <li>
            <strong>Sample ratio mismatch.</strong> If you planned a 50/50 split and got 15,000 vs 14,200, something in the assignment or
            logging is broken. Check this before reading any result.
          </li>
          <li>
            <strong>Novelty and day-of-week effects.</strong> Run whole weeks, and be wary of lifts that fade as users get used to the change.
          </li>
          <li>
            <strong>Segment fishing.</strong> Slicing the result by country, device and browser until something is significant is the
            multiple-metrics problem in disguise.
          </li>
          <li>
            <strong>Significant isn't important.</strong> Decide in advance what lift would be worth shipping, and judge the confidence
            interval against it.
          </li>
          <li>
            <strong>Revenue metrics are heavy-tailed.</strong> A few whale orders can swamp a revenue test; the normal approximation needs much
            more data, or a method like the bootstrap (the next post).
          </li>
        </UL>

        <H2 id="code">In code</H2>
        <Code>{`from statsmodels.stats.proportion import proportions_ztest, confint_proportions_2indep
from statsmodels.stats.power import NormalIndPower
from statsmodels.stats.proportion import proportion_effectsize

conversions = [${AB.kB}, ${AB.kA}]   # B, A
visitors    = [15_000, 15_000]

z, p = proportions_ztest(conversions, visitors)
print(z, p)                          # ${R.z.toFixed(3)}  ${R.p.toFixed(4)}

lo, hi = confint_proportions_2indep(${AB.kB}, 15_000, ${AB.kA}, 15_000, method="wald")
print(lo, hi)                        # ${R.lo.toFixed(4)}  ${R.hi.toFixed(4)}

# visitors per arm for 80% power to detect 10% -> 11%
effect = proportion_effectsize(0.11, 0.10)
print(NormalIndPower().solve_power(effect, alpha=0.05, power=0.8))  # ~14,744
# (a slightly different approximation from this article's 14,751)`}</Code>

        <H2 id="further">Further reading</H2>
        <UL>
          <li>
            <a className="link" href="https://experimentguide.com/" target="_blank" rel="noopener noreferrer">
              Kohavi, Tang and Xu, Trustworthy Online Controlled Experiments
            </a>
            : the standard book on running A/B tests at scale.
          </li>
          <li>
            <a className="link" href="https://www.evanmiller.org/how-not-to-run-an-ab-test.html" target="_blank" rel="noopener noreferrer">
              Evan Miller, How Not To Run an A/B Test
            </a>
            : the classic explanation of the peeking problem.
          </li>
          <li>
            <a className="link" href="https://www.statsmodels.org/stable/stats.html#proportion" target="_blank" rel="noopener noreferrer">
              statsmodels: proportion tests
            </a>
            : z-tests, confidence intervals and power in Python.
          </li>
        </UL>
        <p className="mt-10 text-sm italic text-gray-600 dark:text-gray-400">
          Part of a series explaining one data science concept at a time. Next up: the bootstrap. The data is simulated.
        </p>
      </Narrow>
    </Wide>
  );
};

export default ABTestStory;
