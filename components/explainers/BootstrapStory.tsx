import { useMemo, useState } from "react";
import Link from "next/link";

import { DM, M } from "@/components/explainers/Tex";
import { Button, Code, H2, Narrow, P, Scrolly, Slider, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { AB_RESULT, BOOT_DRAWS, BOOT_MEANS, BOOT_MEDIANS, BOOT_N, BOOT_P90, BOOT_SAMPLE, POP_MEDIAN, TRUE_MEDIANS, binned, bootstrap, mean, median, quantile, rng, sd } from "lib/explainers/stats";

/**
 * "The Bootstrap" — last post of the statistics series: one sample, no
 * formula, resampling with replacement, percentile intervals, checks
 * against known answers, an A/B example, limits, code.
 */

const BLUE = "#2B8CBE";
const PURPLE = "#9B59D0";
const ORANGE = "#E8772E";
const GREEN = "#05CE91";

const W = 560;
const H = 300;
const PD = { l: 16, r: 16, t: 14, b: 48 };
const money = (x: number) => `$${x.toFixed(2)}`;
const med0 = median(BOOT_SAMPLE);
const s0 = sd(BOOT_SAMPLE, 1);
const jr = rng(5);
const JIT = BOOT_SAMPLE.map(() => 0.12 + 0.76 * jr());

const Strip: React.FC<{ draw?: number[] | null }> = ({ draw = null }) => {
  const sx = (x: number) => PD.l + (x / 240) * (W - PD.l - PD.r);
  const sy = (v: number) => H - PD.b - v * (H - PD.t - PD.b);
  const counts = new Array(BOOT_N).fill(0);
  if (draw) for (const i of draw) counts[i]++;
  const m = draw ? median(draw.map((i) => BOOT_SAMPLE[i])) : null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="The 50 order values in the sample">
      <line x1={sx(med0)} x2={sx(med0)} y1={PD.t} y2={H - PD.b} stroke={ORANGE} strokeWidth={1.5} strokeDasharray="5 4" />
      {m !== null && <line x1={sx(m)} x2={sx(m)} y1={PD.t} y2={H - PD.b} stroke={PURPLE} strokeWidth={2.5} />}
      {BOOT_SAMPLE.map((x, i) => (
        <circle
          key={i}
          cx={sx(x)}
          cy={sy(JIT[i])}
          r={draw ? (counts[i] ? 4 + counts[i] * 3 : 3.5) : 6}
          fill={draw && counts[i] ? PURPLE : BLUE}
          opacity={draw && !counts[i] ? 0.25 : 0.9}
          stroke="white"
          strokeWidth={1}
        />
      ))}
      <line x1={PD.l} x2={W - PD.r} y1={H - PD.b} y2={H - PD.b} className="stroke-gray-600 dark:stroke-gray-300" />
      {[0, 50, 100, 150, 200].map((x) => (
        <text key={x} x={sx(x)} y={H - PD.b + 20} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
          ${x}
        </text>
      ))}
      <text x={W / 2} y={H - 6} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300 text-[14px]">
        {draw ? `Resample: ${new Set(draw).size} distinct orders, median ${money(m!)}` : `The 50 orders we have (median ${money(med0)})`}
      </text>
    </svg>
  );
};

const Hist: React.FC<{ xs: number[]; lo: number; hi: number; bin: number; ci?: [number, number] | null; color?: string; xlabel: string; outline?: number[] | null; mark?: number | null }> = ({
  xs,
  lo,
  hi,
  bin,
  ci = null,
  color = PURPLE,
  xlabel,
  outline = null,
  mark = null,
}) => {
  const h = binned(xs, lo, hi, bin);
  const oh = outline ? binned(outline, lo, hi, bin).map((c) => (c * xs.length) / outline.length) : null;
  const top = Math.max(...h, ...(oh ?? [0]), 1) * 1.12;
  const sx = (x: number) => PD.l + ((x - lo) / (hi - lo)) * (W - PD.l - PD.r);
  const sy = (c: number) => H - PD.b - (c / top) * (H - PD.t - PD.b);
  const step = (hi - lo) / 6;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={xlabel}>
      {ci && <rect x={sx(ci[0])} width={sx(ci[1]) - sx(ci[0])} y={PD.t} height={H - PD.t - PD.b} fill={GREEN} opacity={0.16} />}
      {h.map((c, i) => (
        <rect key={i} x={sx(lo + i * bin) + 0.5} width={Math.max(0.6, sx(bin) - sx(0) - 1)} y={sy(c)} height={H - PD.b - sy(c)} fill={color} />
      ))}
      {oh && (
        <path
          d={oh.map((c, i) => `${i ? "L" : "M"}${sx(lo + i * bin).toFixed(1)},${sy(c).toFixed(1)}L${sx(lo + (i + 1) * bin).toFixed(1)},${sy(c).toFixed(1)}`).join("")}
          fill="none"
          stroke={ORANGE}
          strokeWidth={2.5}
        />
      )}
      {mark !== null && <line x1={sx(mark)} x2={sx(mark)} y1={PD.t} y2={H - PD.b} stroke={ORANGE} strokeWidth={1.5} strokeDasharray="5 4" />}
      <line x1={PD.l} x2={W - PD.r} y1={H - PD.b} y2={H - PD.b} className="stroke-gray-600 dark:stroke-gray-300" />
      {Array.from({ length: 7 }, (_, i) => lo + i * step).map((x) => (
        <text key={x} x={sx(x)} y={H - PD.b + 20} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
          ${Math.round(x)}
        </text>
      ))}
      <text x={W / 2} y={H - 6} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300 text-[14px]">
        {xlabel}
      </text>
    </svg>
  );
};

// ---------- playground ----------
type StatKey = "median" | "mean" | "p90" | "trimmed";
const STATS: Record<StatKey, { label: string; f: (s: number[]) => number; lo: number; hi: number; bin: number }> = {
  median: { label: "Median", f: median, lo: 20, hi: 80, bin: 1.5 },
  mean: { label: "Mean", f: mean, lo: 30, hi: 90, bin: 1.5 },
  trimmed: {
    label: "10% trimmed mean",
    f: (s) => {
      const t = [...s].sort((a, b) => a - b).slice(Math.floor(s.length * 0.1), s.length - Math.floor(s.length * 0.1));
      return mean(t);
    },
    lo: 20,
    hi: 80,
    bin: 1.5,
  },
  p90: { label: "90th percentile", f: (s) => quantile(s, 0.9), lo: 60, hi: 240, bin: 4 },
};

const Playground: React.FC = () => {
  const [stat, setStat] = useState<StatKey>("median");
  const [B, setB] = useState(2000);
  const [seed, setSeed] = useState(1);
  const S = STATS[stat];
  const reps = useMemo(() => bootstrap(BOOT_SAMPLE, S.f, B, seed * 101 + B), [S, B, seed]);
  const lo = quantile(reps, 0.025);
  const hi = quantile(reps, 0.975);
  return (
    <div className="my-6 grid md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 items-center">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark p-2">
        <Hist xs={reps} lo={S.lo} hi={S.hi} bin={S.bin} ci={[lo, hi]} mark={S.f(BOOT_SAMPLE)} xlabel={`${B.toLocaleString("en-US")} bootstrap values of the ${S.label.toLowerCase()}`} />
      </div>
      <div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Statistic">
          {(Object.keys(STATS) as StatKey[]).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={stat === k}
              onClick={() => setStat(k)}
              className={`rounded-full border px-3 py-1 text-sm ${stat === k ? "bg-marrsgreen text-white border-marrsgreen dark:bg-carrigreen dark:text-bgdark" : "border-gray-300 dark:border-gray-600"}`}
            >
              {STATS[k].label}
            </button>
          ))}
        </div>
        <Slider label="Resamples, B" value={B} min={100} max={5000} step={100} digits={0} color={PURPLE} onChange={setB} />
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">From the sample</dt>
            <dd className="text-lg font-semibold tabular-nums">{money(S.f(BOOT_SAMPLE))}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Bootstrap SE</dt>
            <dd className="text-lg font-semibold tabular-nums">{money(sd(reps, 1))}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-gray-500">95% percentile interval</dt>
            <dd className="text-lg font-semibold tabular-nums" style={{ color: "#047857" }}>
              {money(lo)} to {money(hi)}
            </dd>
          </div>
        </dl>
        <div className="mt-3">
          <Button onClick={() => setSeed(seed + 1)}>Bootstrap again</Button>
        </div>
        <p className="mt-3 text-[14px] text-gray-600 dark:text-gray-400">
          Each click redraws the resamples. With a few hundred the interval jumps around; with thousands it settles. The 90th percentile's
          interval is wide because 50 orders say little about the top 10%.
        </p>
      </div>
    </div>
  );
};

// ================= the article =================
const BootstrapStory: React.FC = () => {
  const blo = quantile(BOOT_MEDIANS, 0.025);
  const bhi = quantile(BOOT_MEDIANS, 0.975);
  const meanSE = s0 / Math.sqrt(BOOT_N);
  const xbar = mean(BOOT_SAMPLE);

  const steps: Step[] = [
    {
      key: "sample",
      body: (
        <>
          <strong>One sample.</strong> We have 50 orders from the new checkout. Their median is {money(med0)}. How far from the true median
          could that be? For a mean, the{" "}
          <Link className="link" href="/blog/posts/central-limit-theorem-explained/">
            central limit theorem
          </Link>{" "}
          gives a standard error. For a median, there's no simple formula.
        </>
      ),
    },
    {
      key: "r1",
      body: (
        <>
          <strong>Resample it.</strong> Draw 50 orders from these 50, <em>with replacement</em>. Some orders come up twice or more (bigger
          purple dots), some not at all (faded). This resample's median is {money(median(BOOT_DRAWS[0].map((i) => BOOT_SAMPLE[i])))}.
        </>
      ),
    },
    {
      key: "r2",
      body: (
        <>
          <strong>And again.</strong> A different resample, a different median: {money(median(BOOT_DRAWS[4].map((i) => BOOT_SAMPLE[i])))}.
          Each resample is a plausible alternative version of our data.
        </>
      ),
    },
    {
      key: "many",
      body: (
        <>
          <strong>Do it 2,000 times.</strong> The resampled medians pile up into a distribution. Its spread, {money(sd(BOOT_MEDIANS, 1))},
          is the <em>bootstrap standard error</em> of the median. (It's spiky because a median of 50 values can only land on a few
          possible numbers.)
        </>
      ),
    },
    {
      key: "ci",
      body: (
        <>
          <strong>Read off an interval.</strong> The middle 95% of the bootstrap medians runs from {money(blo)} to {money(bhi)}: a 95%
          confidence interval for the median, with no formula required. Note it isn't symmetric around {money(med0)}, just as the data isn't.
        </>
      ),
    },
  ];
  const chartFor = (s: number) => {
    if (s === 0) return <Strip />;
    if (s === 1) return <Strip draw={BOOT_DRAWS[0]} />;
    if (s === 2) return <Strip draw={BOOT_DRAWS[4]} />;
    if (s === 3) return <Hist xs={BOOT_MEDIANS} lo={20} hi={80} bin={1.5} mark={med0} xlabel="2,000 bootstrap medians" />;
    return <Hist xs={BOOT_MEDIANS} lo={20} hi={80} bin={1.5} mark={med0} ci={[blo, bhi]} xlabel="2,000 bootstrap medians, middle 95% shaded" />;
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:47", src: "/explainers/bootstrap/intuition.mp4", poster: "/explainers/bootstrap/intuition-poster.jpg", square: true },
            { key: "math", label: "The math", len: "1:54", src: "/explainers/bootstrap/math.mp4", poster: "/explainers/bootstrap/math-poster.jpg" },
          ]}
          note="The intuition video is the idea in under a minute. The math video covers the plug-in principle, the algorithm, checks against known answers, and where the bootstrap breaks."
        />
        <P>
          The last three posts built error bars from formulas: the standard error <M>{"\\sigma/\\sqrt{n}"}</M>, the normal approximation, the
          z-test. Those formulas exist for means and proportions. But analysts constantly need error bars for other things: a median order
          value, a 90th-percentile load time, revenue per visitor, a ratio of two metrics. The <strong>bootstrap</strong>, introduced by
          Bradley Efron in 1979, handles all of them with one idea: simulate new samples by resampling the one you have.
        </P>
        <H2 id="how-it-works">Resampling, step by step</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="plug-in">The plug-in idea</H2>
        <P>
          If we could draw fresh samples of 50 orders from the full population of orders <M>{"F"}</M>, we'd compute the median of each and
          look at how much it varies. We can't. But the sample itself is our best estimate of the population: the <em>empirical
          distribution</em> <M>{"\\hat{F}"}</M> puts probability <M>{"1/n"}</M> on each observed order. The bootstrap plugs{" "}
          <M>{"\\hat{F}"}</M> in for <M>{"F"}</M>, and drawing a sample from <M>{"\\hat{F}"}</M> is exactly resampling the data with replacement.
        </P>
        <P>For a statistic <M>{"\\hat{\\theta}"}</M> (a median, a percentile, a ratio):</P>
        <UL>
          <li>
            Repeat <M>{"B"}</M> times (a few thousand): draw <M>{"n"}</M> observations from the sample with replacement, and compute the
            statistic on them, <M>{"\\hat{\\theta}^*_b"}</M>.
          </li>
          <li>
            The <strong>bootstrap standard error</strong> is the standard deviation of <M>{"\\hat{\\theta}^*_1, \\ldots, \\hat{\\theta}^*_B"}</M>.
          </li>
          <li>
            The <strong>percentile interval</strong> is their 2.5th to 97.5th percentiles.
          </li>
        </UL>
        <P>Try it with different statistics:</P>
      </Narrow>
      <Playground />
      <Narrow>
        <H2 id="does-it-work">Does it work?</H2>
        <P>
          Check it where we already know the answer. For the mean, the bootstrap standard error is {money(sd(BOOT_MEANS, 1))}, against the CLT
          formula's <M>{`s/\\sqrt{n} = ${s0.toFixed(2)}/\\sqrt{50} = \\$${meanSE.toFixed(2)}`}</M>. The bootstrap interval,{" "}
          {money(quantile(BOOT_MEANS, 0.025))} to {money(quantile(BOOT_MEANS, 0.975))}, is close to the normal one, {money(xbar - 1.96 * meanSE)}{" "}
          to {money(xbar + 1.96 * meanSE)}, though it leans right like the data does.
        </P>
        <P>
          For the median we can cheat, because this data is simulated: draw 2,000 genuinely new samples of 50 from the full population of 20,000
          orders and look at the real spread of their medians (orange outline below).
        </P>
      </Narrow>
      <div className="mx-auto max-w-2xl my-4">
        <Hist xs={BOOT_MEDIANS} lo={20} hi={80} bin={1.5} outline={TRUE_MEDIANS} xlabel="Bootstrap medians (purple) vs medians of new samples (orange)" />
      </div>
      <Narrow>
        <P>
          The true standard error is {money(sd(TRUE_MEDIANS, 1))}; the bootstrap, working from one sample, estimated {money(sd(BOOT_MEDIANS, 1))}.
          Notice what the bootstrap does <em>not</em> recover: the center. The orange distribution is centered on the true median,{" "}
          {money(POP_MEDIAN)}; the purple one on our sample's {money(med0)}. The bootstrap estimates how much a statistic varies, not where the
          truth is. That's enough for an interval: in a quick check with 60 other samples of 50, all 60 percentile intervals contained the true median (for medians of small samples the percentile interval tends to run slightly wide).
        </P>

        <H2 id="replacement">Why with replacement?</H2>
        <P>
          Resampling 50 from 50 <em>without</em> replacement just reshuffles the same data and always gives the same median. With replacement,
          each order is left out of a given resample with probability
        </P>
        <DM>{"\\left(1 - \\frac{1}{n}\\right)^{n} = \\left(1 - \\frac{1}{50}\\right)^{50} = 0.364 \\;\\longrightarrow\\; \\frac{1}{e} \\approx 0.368"}</DM>
        <P>
          and others count double, which creates exactly the kind of variation real samples have. The same trick, called <em>bagging</em>, is
          what makes{" "}
          <Link className="link" href="/blog/posts/random-forests-explained/">
            random forests
          </Link>{" "}
          work.
        </P>

        <H2 id="ab">Bootstrapping an A/B test</H2>
        <P>
          The bootstrap reproduces the{" "}
          <Link className="link" href="/blog/posts/ab-testing-explained/">
            A/B testing
          </Link>{" "}
          interval when the formula applies. Resample each arm's 15,000 visitors (each a 0 or 1) with replacement, take the difference in
          conversion rates, and repeat 2,000 times: the middle 95% runs from about +0.17 to +1.50 points, against the z-interval's +
          {(AB_RESULT.lo * 100).toFixed(2)} to +{(AB_RESULT.hi * 100).toFixed(2)}. Where it earns its keep is on metrics with no formula:
          median order value, revenue per visitor with a few huge orders, or ratios like revenue per session. Two rules for experiments:
        </P>
        <UL>
          <li>
            <strong>Resample within each arm separately</strong>, keeping the arm sizes fixed.
          </li>
          <li>
            <strong>Resample the unit that was randomized.</strong> If users were randomized but you measure sessions, resample whole users with
            all their sessions. Resampling sessions individually ignores that one user's sessions move together, and gives intervals that are
            too narrow.
          </li>
        </UL>

        <H2 id="limits">When the bootstrap struggles</H2>
        <UL>
          <li>
            <strong>Small samples.</strong> The bootstrap can only reuse what the sample saw. With 50 orders, the tails of the population are
            barely represented, which is why the 90th percentile's interval ({money(quantile(BOOT_P90, 0.025))} to{" "}
            {money(quantile(BOOT_P90, 0.975))}) is so wide.
          </li>
          <li>
            <strong>Extremes.</strong> A resample's maximum can never exceed the sample's maximum, so the bootstrap fails for the maximum and
            struggles with extreme percentiles.
          </li>
          <li>
            <strong>Dependent data.</strong> Time series and clustered data need block or cluster bootstraps that resample whole chunks.
          </li>
          <li>
            <strong>Biased samples.</strong> Resampling a biased sample gives a precise interval around the wrong answer.
          </li>
          <li>
            <strong>Better intervals exist.</strong> The percentile interval is the simplest. The BCa interval (bias-corrected and accelerated,
            scipy's default) adjusts for bias and skew and usually covers more accurately.
          </li>
        </UL>

        <H2 id="code">In code</H2>
        <Code>{`import numpy as np
from scipy import stats

orders = np.array([${BOOT_SAMPLE.map((x) => x.toFixed(2)).join(", ")}])

# By hand: 2,000 resamples, percentile interval
rng = np.random.default_rng(0)
medians = [np.median(rng.choice(orders, len(orders))) for _ in range(2_000)]
print(np.std(medians, ddof=1), np.percentile(medians, [2.5, 97.5]))

# With scipy (BCa interval by default)
res = stats.bootstrap((orders,), np.median, n_resamples=2_000, random_state=0)
print(res.standard_error, res.confidence_interval)
# about 5.5 and (36.7, 54.1): close to this article's numbers;
# medians of small samples are lumpy, so the upper end moves between runs`}</Code>

        <H2 id="further">Further reading</H2>
        <UL>
          <li>
            <a className="link" href="https://doi.org/10.1214/aos/1176344552" target="_blank" rel="noopener noreferrer">
              Efron (1979), Bootstrap Methods: Another Look at the Jackknife
            </a>
            : the original paper.
          </li>
          <li>
            <a className="link" href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.bootstrap.html" target="_blank" rel="noopener noreferrer">
              scipy.stats.bootstrap
            </a>
            : percentile, basic and BCa intervals in Python.
          </li>
          <li>
            <a className="link" href="https://www.openintro.org/book/ims/" target="_blank" rel="noopener noreferrer">
              Introduction to Modern Statistics
            </a>
            : OpenIntro's free textbook, which teaches inference through simulation and the bootstrap.
          </li>
        </UL>
        <p className="mt-10 text-sm italic text-gray-600 dark:text-gray-400">
          The final post of the statistics series: <Link className="link" href="/blog/posts/probability-explained/">probability</Link>,{" "}
          <Link className="link" href="/blog/posts/law-of-large-numbers-explained/">the law of large numbers</Link>,{" "}
          <Link className="link" href="/blog/posts/central-limit-theorem-explained/">the central limit theorem</Link>,{" "}
          <Link className="link" href="/blog/posts/ab-testing-explained/">A/B testing</Link> and the bootstrap. The data is simulated.
        </p>
      </Narrow>
    </Wide>
  );
};

export default BootstrapStory;
