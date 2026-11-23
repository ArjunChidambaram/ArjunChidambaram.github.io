import { useMemo, useState } from "react";
import Link from "next/link";

import { DM, M } from "@/components/explainers/Tex";
import { Button, Code, H2, Narrow, P, Scrolly, Slider, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { INTERVALS, MEANS, ORDERS, ORDER_MEAN, ORDER_SD, binned, mean, normPDF, rng, sd, skewness } from "lib/explainers/stats";

/**
 * "The Central Limit Theorem" — third post of the statistics series:
 * lopsided order values, averages becoming normal, the statement, the
 * standard error, the 0/1 case, confidence intervals, caveats, code.
 */

const BLUE = "#2B8CBE";
const ORANGE = "#E8772E";
const GREEN = "#05CE91";
const RED = "#E2483D";
const GREY = "#94A3B8";

const HW = 560;
const HH = 320;
const HP = { l: 16, r: 16, t: 14, b: 48 };

const Hist: React.FC<{ xs: number[]; lo?: number; hi: number; bin: number; curve?: { mu: number; sd: number } | null; color?: string; xlabel: string; fmt?: (x: number) => string; ticks: number[]; marker?: number | null }> = ({
  xs,
  lo = 0,
  hi,
  bin,
  curve = null,
  color = BLUE,
  xlabel,
  fmt = (x) => `$${x}`,
  ticks,
  marker = null,
}) => {
  const h = binned(xs, lo, hi, bin);
  const top = Math.max(...h, 1) * 1.12;
  const sx = (x: number) => HP.l + ((x - lo) / (hi - lo)) * (HW - HP.l - HP.r);
  const sy = (c: number) => HH - HP.b - (c / top) * (HH - HP.t - HP.b);
  let d = "";
  if (curve) {
    const scale = xs.length * bin;
    for (let i = 0; i <= 200; i++) {
      const x = lo + ((hi - lo) * i) / 200;
      d += `${i ? "L" : "M"}${sx(x).toFixed(1)},${Math.max(HP.t - 6, sy(normPDF(x, curve.mu, curve.sd) * scale)).toFixed(1)}`;
    }
  }
  const bw = sx(lo + bin) - sx(lo);
  return (
    <svg viewBox={`0 0 ${HW} ${HH}`} className="w-full h-auto" role="img" aria-label={`Histogram of ${xlabel.toLowerCase()}`}>
      {h.map((c, i) => (
        <rect key={i} x={sx(lo + i * bin) + (bw > 3 ? 0.5 : 0)} width={Math.max(0.6, bw - (bw > 3 ? 1 : 0))} y={sy(c)} height={HH - HP.b - sy(c)} fill={color} />
      ))}
      {curve && <path d={d} fill="none" stroke={ORANGE} strokeWidth={2.5} />}
      {marker !== null && <line x1={sx(marker)} x2={sx(marker)} y1={HP.t} y2={HH - HP.b} stroke={ORANGE} strokeWidth={1.5} strokeDasharray="5 4" />}
      <line x1={HP.l} x2={HW - HP.r} y1={HH - HP.b} y2={HH - HP.b} className="stroke-gray-600 dark:stroke-gray-300" />
      {ticks.map((x) => (
        <text key={x} x={sx(x)} y={HH - HP.b + 20} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
          {fmt(x)}
        </text>
      ))}
      <text x={HW / 2} y={HH - 6} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300 text-[14px]">
        {xlabel}
      </text>
    </svg>
  );
};

// ---------- playground ----------
type Pop = "orders" | "conversions" | "uniform";
const POPS: Record<Pop, { label: string; draw: (r: () => number) => number; mu: number; sd: number; lo: number; hi: number; bin: number; ticks: number[]; fmt: (x: number) => string }> = {
  orders: { label: "Order values (lopsided)", draw: (r) => ORDERS[Math.floor(r() * ORDERS.length)], mu: ORDER_MEAN, sd: ORDER_SD, lo: 0, hi: 200, bin: 2, ticks: [0, 50, 100, 150, 200], fmt: (x) => `$${x}` },
  conversions: { label: "Bought or not (0/1, p = 0.1)", draw: (r) => (r() < 0.1 ? 1 : 0), mu: 0.1, sd: Math.sqrt(0.09), lo: 0, hi: 0.5, bin: 0.005, ticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5], fmt: (x) => `${Math.round(x * 100)}%` },
  uniform: { label: "Spinner (uniform 0 to 100)", draw: (r) => r() * 100, mu: 50, sd: 100 / Math.sqrt(12), lo: 0, hi: 100, bin: 1, ticks: [0, 25, 50, 75, 100], fmt: (x) => String(x) },
};

const Playground: React.FC = () => {
  const [pop, setPop] = useState<Pop>("orders");
  const [n, setN] = useState(10);
  const [seed, setSeed] = useState(1);
  const P = POPS[pop];
  const means = useMemo(() => {
    const r = rng(seed * 7919 + n);
    return Array.from({ length: 3000 }, () => {
      let s = 0;
      for (let i = 0; i < n; i++) s += P.draw(r);
      return s / n;
    });
  }, [pop, n, seed, P]);
  return (
    <div className="my-6 grid md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 items-center">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark p-2">
        <Hist xs={means} lo={pop === "conversions" ? -0.5 / n : P.lo} hi={P.hi} bin={pop === "conversions" ? 1 / n : P.bin} ticks={P.ticks} fmt={P.fmt} curve={{ mu: P.mu, sd: P.sd / Math.sqrt(n) }} xlabel={`3,000 averages of ${n}`} />
      </div>
      <div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Data to average">
          {(Object.keys(POPS) as Pop[]).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={pop === k}
              onClick={() => setPop(k)}
              className={`rounded-full border px-3 py-1 text-sm ${pop === k ? "bg-marrsgreen text-white border-marrsgreen dark:bg-carrigreen dark:text-bgdark" : "border-gray-300 dark:border-gray-600"}`}
            >
              {POPS[k].label}
            </button>
          ))}
        </div>
        <Slider label="Sample size, n" value={n} min={1} max={200} step={1} digits={0} color={BLUE} onChange={setN} />
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">SD of the averages</dt>
            <dd className="text-lg font-semibold tabular-nums">{sd(means).toPrecision(3)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">
              CLT says <M>{"\\sigma/\\sqrt{n}"}</M>
            </dt>
            <dd className="text-lg font-semibold tabular-nums" style={{ color: ORANGE }}>
              {(P.sd / Math.sqrt(n)).toPrecision(3)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Skewness</dt>
            <dd className="text-lg font-semibold tabular-nums">{skewness(means).toFixed(2)}</dd>
          </div>
          <div className="flex items-end">
            <Button onClick={() => setSeed(seed + 1)}>Resample</Button>
          </div>
        </dl>
        <p className="mt-3 text-[14px] text-gray-600 dark:text-gray-400">
          The orange curve is the normal distribution the theorem predicts. Try the 0/1 data with small <M>{"n"}</M>: the averages can only
          take a few values, so the bell needs more data to form.
        </p>
      </div>
    </div>
  );
};

// ---------- confidence intervals ----------
const IW = 560;
const IH = 300;
const Intervals: React.FC<{ ivs: { m: number; lo: number; hi: number }[] }> = ({ ivs }) => {
  const sy = (v: number) => IH - 30 - ((v - 25) / 65) * (IH - 44);
  const sx = (i: number) => 44 + (i + 0.5) * ((IW - 54) / ivs.length);
  return (
    <svg viewBox={`0 0 ${IW} ${IH}`} className="w-full h-auto" role="img" aria-label="100 confidence intervals for the average order value">
      {ivs.map((iv, i) => {
        const hit = iv.lo <= ORDER_MEAN && iv.hi >= ORDER_MEAN;
        return <line key={i} x1={sx(i)} x2={sx(i)} y1={sy(iv.lo)} y2={sy(iv.hi)} stroke={hit ? GREEN : RED} strokeWidth={hit ? 2 : 3} />;
      })}
      <line x1={44} x2={IW - 10} y1={sy(ORDER_MEAN)} y2={sy(ORDER_MEAN)} stroke={ORANGE} strokeWidth={1.5} strokeDasharray="6 4" />
      {[30, 40, 50, 60, 70, 80].map((v) => (
        <text key={v} x={38} y={sy(v) + 4} textAnchor="end" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
          ${v}
        </text>
      ))}
      <text x={IW / 2} y={IH - 8} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300 text-[14px]">
        100 samples of 100 orders, each with its 95% interval
      </text>
    </svg>
  );
};

const drawIntervals = (seed: number) => {
  const r = rng(seed);
  return Array.from({ length: 100 }, () => {
    const xs = Array.from({ length: 100 }, () => ORDERS[Math.floor(r() * ORDERS.length)]);
    const m = mean(xs);
    const se = sd(xs, 1) / 10;
    return { m, lo: m - 1.96 * se, hi: m + 1.96 * se };
  });
};

// ================= the article =================
const CLTStory: React.FC = () => {
  const [ivs, setIvs] = useState(INTERVALS);
  const [ivSeed, setIvSeed] = useState(100);
  const [total, setTotal] = useState({ hit: INTERVALS.filter((i) => i.lo <= ORDER_MEAN && i.hi >= ORDER_MEAN).length, n: 100 });
  const hits = ivs.filter((i) => i.lo <= ORDER_MEAN && i.hi >= ORDER_MEAN).length;
  const more = () => {
    const next = drawIntervals(ivSeed);
    const h = next.filter((i) => i.lo <= ORDER_MEAN && i.hi >= ORDER_MEAN).length;
    setIvs(next);
    setIvSeed(ivSeed + 1);
    setTotal({ hit: total.hit + h, n: total.n + 100 });
  };
  const I0 = INTERVALS[0];
  const ticks = [0, 50, 100, 150, 200];

  const steps: Step[] = [
    {
      key: "pop",
      body: (
        <>
          <strong>Lopsided data.</strong> Here are 20,000 past orders from the checkout page. The median order is $40, the average is $
          {ORDER_MEAN.toFixed(2)}, and a long tail of big orders stretches past $1,000. Skewness is {skewness(ORDERS).toFixed(1)}; a bell curve
          has 0. Nothing about this looks normal.
        </>
      ),
    },
    {
      key: "two",
      body: (
        <>
          <strong>Average two at a time.</strong> Pick 2 orders at random and average them; repeat 2,000 times. The averages are still
          lopsided, but less so: one huge order gets diluted by its partner.
        </>
      ),
    },
    {
      key: "five",
      body: (
        <>
          <strong>Five at a time.</strong> The tail shrinks further and the peak moves toward the true mean (dashed). Skewness is down to{" "}
          {skewness(MEANS[5]).toFixed(1)}.
        </>
      ),
    },
    {
      key: "thirty",
      body: (
        <>
          <strong>Thirty at a time: a bell.</strong> The averages now follow the orange normal curve, centered on $
          {ORDER_MEAN.toFixed(2)} with standard deviation <M>{"\\sigma/\\sqrt{30}"}</M> = ${(ORDER_SD / Math.sqrt(30)).toFixed(2)}. That
          curve wasn't fitted to the blue bars. The theorem predicted it from the population's mean and SD alone.
        </>
      ),
    },
    {
      key: "hundred",
      body: (
        <>
          <strong>A hundred at a time: a narrower bell.</strong> Same center, but the spread shrinks to ${(ORDER_SD / 10).toFixed(2)}. Four
          times the data, half the spread.
        </>
      ),
    },
  ];
  const chartFor = (s: number) => {
    if (s === 0) return <Hist xs={ORDERS} hi={200} bin={4} color={GREY} xlabel="One order's value" ticks={ticks} marker={ORDER_MEAN} />;
    const n = [0, 2, 5, 30, 100][s];
    return <Hist xs={MEANS[n]} hi={200} bin={2} xlabel={`2,000 averages of ${n} orders`} ticks={ticks} marker={ORDER_MEAN} curve={s >= 3 ? { mu: ORDER_MEAN, sd: ORDER_SD / Math.sqrt(n) } : null} />;
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:47", src: "/explainers/central-limit-theorem/intuition.mp4", poster: "/explainers/central-limit-theorem/intuition-poster.jpg", square: true },
            { key: "math", label: "The math", len: "2:00", src: "/explainers/central-limit-theorem/math.mp4", poster: "/explainers/central-limit-theorem/math-poster.jpg" },
          ]}
          note="The intuition video is the idea in under a minute. The math video states the theorem, checks it against simulation, and builds the standard error and confidence intervals from it."
        />
        <P>
          The{" "}
          <Link className="link" href="/blog/posts/law-of-large-numbers-explained/">
            law of large numbers
          </Link>{" "}
          says an average gets close to the truth. The <strong>central limit theorem</strong> (CLT) says <em>how</em> it misses: the error of
          an average follows a bell curve with a predictable width, almost regardless of what the underlying data looks like. That's what
          lets us put error bars on averages, and it's the engine inside every standard A/B test.
        </P>
        <H2 id="how-it-works">Averages become bell-shaped</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="statement">The statement</H2>
        <P>
          Take <M>{"n"}</M> independent draws from any distribution with mean <M>{"\\mu"}</M> and a finite standard deviation{" "}
          <M>{"\\sigma"}</M>. As <M>{"n"}</M> grows, their average <M>{"\\bar{X}_n"}</M> is approximately normal:
        </P>
        <DM>{"\\bar{X}_n \\;\\approx\\; \\mathcal{N}\\!\\left(\\mu,\\ \\frac{\\sigma^2}{n}\\right) \\qquad\\text{or, standardized,}\\qquad Z = \\frac{\\bar{X}_n - \\mu}{\\sigma/\\sqrt{n}} \\;\\longrightarrow\\; \\mathcal{N}(0, 1)"}</DM>
        <P>
          The mean and the spread aren't the surprise; those follow from adding up expected values and variances. The surprise is the{" "}
          <em>shape</em>. Sums of many small independent pieces lose the shape of the pieces and become normal. Try it with three very
          different kinds of data:
        </P>
      </Narrow>
      <Playground />
      <Narrow>
        <H2 id="standard-error">The standard error</H2>
        <P>
          The standard deviation of an average is called its <strong>standard error</strong>. We rarely know <M>{"\\sigma"}</M>, so we plug in
          the sample's own standard deviation <M>{"s"}</M>:
        </P>
        <DM>{"\\text{SE}(\\bar{X}_n) = \\frac{\\sigma}{\\sqrt{n}} \\approx \\frac{s}{\\sqrt{n}}"}</DM>
        <P>
          For average order value from 100 orders, <M>{`\\text{SE} = ${ORDER_SD.toFixed(2)} / \\sqrt{100} = \\$${(ORDER_SD / 10).toFixed(2)}`}</M>.
          A conversion rate is an average of 0s and 1s with <M>{"\\sigma = \\sqrt{p(1-p)}"}</M>, so from the{" "}
          <Link className="link" href="/blog/posts/probability-explained/">
            probability post
          </Link>{" "}
          we already know its standard error:
        </P>
        <DM>{"\\text{SE}(\\hat{p}) = \\sqrt{\\frac{p(1 - p)}{n}} \\qquad n = 1{,}000,\\ p = 0.1: \\quad \\sqrt{0.09/1000} = 0.0095"}</DM>
        <P>
          The CLT adds the shape: the measured rate is approximately normal around the true rate, which is exactly the assumption behind
          the usual A/B test formulas. For rates, the bell is accurate once you have at least about 10 buyers and 10 non-buyers.
        </P>

        <H2 id="confidence-intervals">Confidence intervals</H2>
        <P>
          A standard normal lands between −1.96 and 1.96 with probability 95%. Substitute the definition of <M>{"Z"}</M> and rearrange,
          and you get an interval that captures the true mean 95% of the time:
        </P>
        <DM>{"P\\!\\left(-1.96 \\le \\frac{\\bar{X}_n - \\mu}{s/\\sqrt{n}} \\le 1.96\\right) \\approx 0.95 \\quad\\Longrightarrow\\quad \\bar{X}_n \\pm 1.96\\,\\frac{s}{\\sqrt{n}}"}</DM>
        <P>
          Our first sample of 100 orders averaged ${I0.m.toFixed(2)}, with a 95% interval of ${I0.lo.toFixed(2)} to ${I0.hi.toFixed(2)}.
          The true mean, ${ORDER_MEAN.toFixed(2)}, is inside. But that won't always happen. Here are 100 samples, each with its own interval:
        </P>
      </Narrow>
      <div className="mx-auto max-w-2xl my-4">
        <Intervals ivs={ivs} />
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
          <Button primary onClick={more}>
            Draw 100 new samples
          </Button>
          <span className="tabular-nums">
            This batch: <strong style={{ color: "#047857" }}>{hits}</strong> of 100 contain the true mean. All batches so far:{" "}
            <strong>{((total.hit / total.n) * 100).toFixed(1)}%</strong> of {total.n.toLocaleString("en-US")}.
          </span>
        </div>
      </div>
      <Narrow>
        <P>
          "95% confidence" is a property of the <em>method</em>: over many samples, 95% of the intervals it produces contain the truth. Any
          single interval either contains it or doesn't. It's tempting, but not quite right, to say "there's a 95% chance the true mean is
          in this interval".
        </P>

        <H2 id="careful">When the bell needs care</H2>
        <UL>
          <li>
            <strong>Independence.</strong> Repeat customers, households or clustered traffic make observations move together, and the real
            standard error is larger than <M>{"s/\\sqrt{n}"}</M>.
          </li>
          <li>
            <strong>Heavy tails.</strong> The theorem needs a finite variance, and very lopsided data needs a much larger <M>{"n"}</M> before
            the bell is accurate. The "n ≥ 30" rule of thumb is folklore; revenue data often needs thousands.
          </li>
          <li>
            <strong>Small counts.</strong> For rates, with fewer than about 10 successes or failures, use an exact or Wilson interval
            instead of <M>{"\\pm 1.96\\,\\text{SE}"}</M>.
          </li>
          <li>
            <strong>It's about averages.</strong> The CLT says nothing about the shape of the data itself. Order values stay lopsided no
            matter how many you collect.
          </li>
        </UL>
        <P>
          When you're unsure the bell applies, you can simulate the sampling distribution from the data itself. That's the bootstrap, the
          last post in this series.
        </P>

        <H2 id="code">In code</H2>
        <Code>{`import numpy as np
from scipy import stats

rng = np.random.default_rng(0)
orders = 40 * np.exp(0.8 * rng.standard_normal(20_000))   # lopsided order values

# 2,000 averages of 30 orders each: skewness falls from ~3 to ~0.6
means = rng.choice(orders, size=(2_000, 30)).mean(axis=1)
print(stats.skew(orders), stats.skew(means))
print(means.std(), orders.std() / np.sqrt(30))           # these match

# a 95% confidence interval from one sample of 100 orders
x = rng.choice(orders, 100)
se = x.std(ddof=1) / np.sqrt(len(x))
print(x.mean() - 1.96 * se, x.mean() + 1.96 * se)`}</Code>

        <H2 id="further">Further reading</H2>
        <UL>
          <li>
            <a className="link" href="https://seeing-theory.brown.edu/probability-distributions/index.html#section3" target="_blank" rel="noopener noreferrer">
              Seeing Theory: Central Limit Theorem
            </a>
            : an interactive version with dice and other distributions.
          </li>
          <li>
            <a className="link" href="https://www.openintro.org/book/os/" target="_blank" rel="noopener noreferrer">
              OpenIntro Statistics
            </a>
            , chapter 5: sampling distributions, standard errors and confidence intervals (free).
          </li>
          <li>
            <a className="link" href="https://projects.iq.harvard.edu/stat110/home" target="_blank" rel="noopener noreferrer">
              Harvard Stat 110
            </a>
            : a proof of the CLT with moment generating functions, chapter 10.
          </li>
        </UL>
        <p className="mt-10 text-sm italic text-gray-600 dark:text-gray-400">
          Part of a series explaining one data science concept at a time. Next up: A/B testing. The data is simulated.
        </p>
      </Narrow>
    </Wide>
  );
};

export default CLTStory;
