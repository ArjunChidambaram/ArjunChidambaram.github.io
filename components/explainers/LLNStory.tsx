import { useId, useState } from "react";
import Link from "next/link";

import { DM, M } from "@/components/explainers/Tex";
import { Button, Code, H2, Narrow, P, Scrolly, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { CHECKS, OUR, PAGES, P_BUY, STREAMS, chebyshev, idxOf, tailProb } from "lib/explainers/stats";

/**
 * "The Law of Large Numbers" — second post of the statistics series:
 * running averages, the statement, Chebyshev, the square-root law,
 * dilution vs the gambler's fallacy, small samples, limits, code.
 */

const BLUE = "#2B8CBE";
const ORANGE = "#E8772E";
const GREEN = "#05CE91";
const PINK = "#C2507A";
const GREY = "#94A3B8";
const EPS = 0.02;

const LW = 560;
const LH = 380;
const LP = { l: 54, r: 14, t: 14, b: 50 };
const XMAX = 4.35;
const lx = (n: number, x0 = 0) => LP.l + ((Math.log10(n) - x0) / (XMAX - x0)) * (LW - LP.l - LP.r);

type Series = { rate: number[] };
type PlotProps = {
  upTo?: number;
  others?: boolean;
  funnel?: boolean;
  band?: boolean;
  extra?: Series[];
  ymax?: number;
};

const RatePlot: React.FC<PlotProps> = ({ upTo = 10000, others = false, funnel = false, band = false, extra = [], ymax = 0.4 }) => {
  const clip = useId().replace(/:/g, "");
  const sy = (v: number) => LH - LP.b - (v / ymax) * (LH - LP.t - LP.b);
  const path = (r: number[], lim = 1e9) =>
    CHECKS.filter((c) => c <= lim)
      .map((c, i) => `${i ? "L" : "M"}${lx(c).toFixed(1)},${sy(r[i]).toFixed(1)}`)
      .join("");
  let fun = "";
  if (funnel) {
    let up = "";
    let dn = "";
    for (let i = 0; i <= 80; i++) {
      const n = Math.pow(10, (XMAX * i) / 80);
      const s = Math.sqrt((P_BUY * (1 - P_BUY)) / n);
      up += `${i ? "L" : "M"}${lx(n).toFixed(1)},${sy(Math.min(ymax, P_BUY + 2 * s)).toFixed(1)}`;
      dn = `L${lx(n).toFixed(1)},${sy(Math.max(0, P_BUY - 2 * s)).toFixed(1)}` + dn;
    }
    fun = up + dn + "Z";
  }
  return (
    <svg viewBox={`0 0 ${LW} ${LH}`} className="w-full h-auto" role="img" aria-label="Running conversion rate as visitors accumulate">
      <defs>
        <clipPath id={clip}>
          <rect x={LP.l} y={LP.t} width={LW - LP.l - LP.r} height={LH - LP.t - LP.b} />
        </clipPath>
      </defs>
      {funnel && <path d={fun} fill={GREEN} opacity={0.16} />}
      {band && <rect x={LP.l} width={LW - LP.l - LP.r} y={sy(P_BUY + EPS)} height={sy(P_BUY - EPS) - sy(P_BUY + EPS)} fill={PINK} opacity={0.14} />}
      <g clipPath={`url(#${clip})`}>
        {others && STREAMS.map((s, j) => (j === OUR ? null : <path key={j} d={path(s.rate)} fill="none" stroke={GREY} strokeWidth={1.2} opacity={0.6} />))}
        <path d={path(STREAMS[OUR].rate, upTo)} fill="none" stroke={BLUE} strokeWidth={2.8} />
        {extra.map((s, j) => (
          <path key={j} d={path(s.rate)} fill="none" stroke={ORANGE} strokeWidth={2.2} opacity={j === extra.length - 1 ? 1 : 0.45} />
        ))}
      </g>
      <line x1={LP.l} x2={LW - LP.r} y1={sy(P_BUY)} y2={sy(P_BUY)} stroke={ORANGE} strokeWidth={1.5} strokeDasharray="6 5" />
      {[0, 0.1, 0.2, 0.3, 0.4].filter((v) => v <= ymax).map((v) => (
        <text key={v} x={LP.l - 8} y={sy(v) + 4} textAnchor="end" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
          {Math.round(v * 100)}%
        </text>
      ))}
      {[1, 10, 100, 1000, 10000].map((n) => (
        <text key={n} x={lx(n)} y={LH - LP.b + 20} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
          {n.toLocaleString("en-US")}
        </text>
      ))}
      <line x1={LP.l} x2={LW - LP.r} y1={LH - LP.b} y2={LH - LP.b} className="stroke-gray-600 dark:stroke-gray-300" />
      <line x1={LP.l} x2={LP.l} y1={LP.t} y2={LH - LP.b} className="stroke-gray-600 dark:stroke-gray-300" />
      <text x={(LP.l + LW - LP.r) / 2} y={LH - 8} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300 text-[14px]">
        Visitors so far (log scale)
      </text>
    </svg>
  );
};

// ---------- extra-buyers plot ----------
const ExcessPlot: React.FC = () => {
  const sy = (v: number) => LH - LP.b - ((v + 100) / 200) * (LH - LP.t - LP.b);
  let up = "";
  let dn = "";
  for (let i = 0; i <= 80; i++) {
    const n = Math.pow(10, (XMAX * i) / 80);
    const s = Math.sqrt(n * P_BUY * (1 - P_BUY));
    up += `${i ? "L" : "M"}${lx(n).toFixed(1)},${sy(2 * s).toFixed(1)}`;
    dn = `L${lx(n).toFixed(1)},${sy(-2 * s).toFixed(1)}` + dn;
  }
  const path = (b: number[]) => CHECKS.map((c, i) => `${i ? "L" : "M"}${lx(c).toFixed(1)},${sy(b[i] - c * P_BUY).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${LW} ${LH}`} className="w-full h-auto" role="img" aria-label="Extra buyers above expectation as visitors accumulate">
      <path d={up + dn + "Z"} fill={ORANGE} opacity={0.12} />
      {STREAMS.map((s, j) => (j === OUR ? null : <path key={j} d={path(s.buyers)} fill="none" stroke={GREY} strokeWidth={1.2} opacity={0.6} />))}
      <path d={path(STREAMS[OUR].buyers)} fill="none" stroke={BLUE} strokeWidth={2.8} />
      {[-100, -50, 0, 50, 100].map((v) => (
        <text key={v} x={LP.l - 8} y={sy(v) + 4} textAnchor="end" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
          {v > 0 ? `+${v}` : v}
        </text>
      ))}
      {[1, 10, 100, 1000, 10000].map((n) => (
        <text key={n} x={lx(n)} y={LH - LP.b + 20} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
          {n.toLocaleString("en-US")}
        </text>
      ))}
      <line x1={LP.l} x2={LW - LP.r} y1={sy(0)} y2={sy(0)} className="stroke-gray-400" strokeDasharray="4 4" />
      <line x1={LP.l} x2={LW - LP.r} y1={LH - LP.b} y2={LH - LP.b} className="stroke-gray-600 dark:stroke-gray-300" />
      <line x1={LP.l} x2={LP.l} y1={LP.t} y2={LH - LP.b} className="stroke-gray-600 dark:stroke-gray-300" />
      <text x={(LP.l + LW - LP.r) / 2} y={LH - 8} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300 text-[14px]">
        Visitors so far (log scale)
      </text>
    </svg>
  );
};

// ---------- pages funnel ----------
const PagesPlot: React.FC = () => {
  const x0 = 1;
  const px = (n: number) => LP.l + ((Math.log10(n) - x0) / (4.5 - x0)) * (LW - LP.l - LP.r);
  const sy = (v: number) => LH - LP.b - (v / 0.3) * (LH - LP.t - LP.b);
  const sorted = PAGES.map((_, i) => i).sort((a, b) => PAGES[b].k / PAGES[b].n - PAGES[a].k / PAGES[a].n);
  const ext = new Set([...sorted.slice(0, 3), ...sorted.slice(-3)]);
  let up = "";
  let dn = "";
  for (let i = 0; i <= 80; i++) {
    const n = Math.pow(10, x0 + (3.5 * i) / 80);
    const s = Math.sqrt((P_BUY * (1 - P_BUY)) / n);
    up += `${i ? "L" : "M"}${px(n).toFixed(1)},${sy(Math.min(0.3, P_BUY + 2 * s)).toFixed(1)}`;
    dn = `L${px(n).toFixed(1)},${sy(Math.max(0, P_BUY - 2 * s)).toFixed(1)}` + dn;
  }
  return (
    <svg viewBox={`0 0 ${LW} ${LH}`} className="w-full h-auto" role="img" aria-label="Measured conversion rate of 60 pages against their traffic">
      <path d={up + dn + "Z"} fill={GREEN} opacity={0.15} />
      <line x1={LP.l} x2={LW - LP.r} y1={sy(P_BUY)} y2={sy(P_BUY)} stroke={ORANGE} strokeWidth={1.5} strokeDasharray="6 5" />
      {PAGES.map((p, i) => (
        <circle key={i} cx={px(p.n)} cy={sy(p.k / p.n)} r={5.5} fill={ext.has(i) ? ORANGE : BLUE} stroke="white" strokeWidth={1.2}>
          <title>
            {p.k} of {p.n} visitors bought ({((p.k / p.n) * 100).toFixed(1)}%)
          </title>
        </circle>
      ))}
      {[0, 0.1, 0.2, 0.3].map((v) => (
        <text key={v} x={LP.l - 8} y={sy(v) + 4} textAnchor="end" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
          {Math.round(v * 100)}%
        </text>
      ))}
      {[10, 100, 1000, 10000].map((n) => (
        <text key={n} x={px(n)} y={LH - LP.b + 20} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
          {n.toLocaleString("en-US")}
        </text>
      ))}
      <line x1={LP.l} x2={LW - LP.r} y1={LH - LP.b} y2={LH - LP.b} className="stroke-gray-600 dark:stroke-gray-300" />
      <line x1={LP.l} x2={LP.l} y1={LP.t} y2={LH - LP.b} className="stroke-gray-600 dark:stroke-gray-300" />
      <text x={(LP.l + LW - LP.r) / 2} y={LH - 8} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300 text-[14px]">
        Visitors to the page (log scale)
      </text>
    </svg>
  );
};

/** A fresh random replay (not seeded: different every click). */
const replay = (): Series => {
  const rate: number[] = [];
  let k = 0;
  let c = 0;
  for (let i = 1; i <= 10000; i++) {
    if (Math.random() < P_BUY) k++;
    if (i === CHECKS[c]) {
      rate.push(k / i);
      c++;
    }
  }
  return { rate };
};

const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;

// ================= the article =================
const LLNStory: React.FC = () => {
  const [mine, setMine] = useState<Series[]>([]);
  const o = STREAMS[OUR];
  const r = (n: number) => o.rate[idxOf(n)];
  const b = (n: number) => o.buyers[idxOf(n)];
  const outside = (n: number) => STREAMS.filter((s) => Math.abs(s.rate[idxOf(n)] - P_BUY) > EPS).length;
  const last = mine[mine.length - 1];
  const sorted = [...PAGES].sort((a, c) => c.k / c.n - a.k / a.n);
  const big = PAGES.filter((p) => p.n >= 1000);

  const steps: Step[] = [
    {
      key: "early",
      body: (
        <>
          <strong>Start counting.</strong> Visitors arrive one at a time, each buying with probability 10%. After 10 visitors our running
          conversion rate is {pct(r(10), 0)}; after 100 it's {pct(r(100), 0)}. Early numbers swing wildly.
        </>
      ),
    },
    {
      key: "settle",
      body: (
        <>
          <strong>Keep going.</strong> By 1,000 visitors the rate is {pct(r(1000))}, and by 10,000 it's {pct(r(10000))}. The line has
          flattened onto the true 10% (dashed).
        </>
      ),
    },
    {
      key: "replays",
      body: (
        <>
          <strong>It wasn't luck.</strong> Replay the same page 29 more times (grey). Every run starts somewhere different and every run
          ends near 10%. The green funnel is ±2 standard deviations, <M>{"0.1 \\pm 2\\sqrt{0.09/n}"}</M>: it narrows like one over the
          square root of the number of visitors.
        </>
      ),
    },
    {
      key: "band",
      body: (
        <>
          <strong>Pick a margin.</strong> The pink band is 8% to 12%. After 100 visitors, {outside(100)} of 30 runs are outside it. After
          1,000, {outside(1000)}. After 10,000, {outside(10000)}. That shrinking chance of being off is what the law of large numbers
          guarantees.
        </>
      ),
    },
    {
      key: "yours",
      body: (
        <>
          <strong>Your turn.</strong> Run your own replay of 10,000 visitors (orange). Each one is fresh randomness.
          <div className="mt-3 flex items-center gap-3">
            <Button primary onClick={() => setMine((m) => [...m.slice(-4), replay()])}>
              Run a replay
            </Button>
            {last && (
              <span className="text-sm tabular-nums">
                after 100: <strong>{pct(last.rate[idxOf(100)], 0)}</strong>, after 10,000: <strong>{pct(last.rate[idxOf(10000)], 2)}</strong>
              </span>
            )}
          </div>
        </>
      ),
    },
  ];
  const chartFor = (s: number) => {
    if (s === 0) return <RatePlot upTo={100} />;
    if (s === 1) return <RatePlot />;
    if (s === 2) return <RatePlot others funnel />;
    if (s === 3) return <RatePlot others band />;
    return <RatePlot funnel extra={mine} />;
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:47", src: "/explainers/law-of-large-numbers/intuition.mp4", poster: "/explainers/law-of-large-numbers/intuition-poster.jpg", square: true },
            { key: "math", label: "The math", len: "1:52", src: "/explainers/law-of-large-numbers/math.mp4", poster: "/explainers/law-of-large-numbers/math-poster.jpg" },
          ]}
          note="The intuition video is the idea in under a minute. The math video states the law, proves it with Chebyshev's inequality and shows what it doesn't promise."
        />
        <P>
          In the{" "}
          <Link className="link" href="/blog/posts/probability-explained/">
            probability post
          </Link>{" "}
          we saw that a single day's conversion rate is noisy. Yet every analytics team trusts conversion rates measured over large
          traffic. The <strong>law of large numbers</strong> is the reason: average enough independent observations and the average
          lands on the true value. It's the foundation every A/B test stands on, and it's also widely misunderstood.
        </P>
        <H2 id="how-it-works">Watch an average settle</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="statement">The statement</H2>
        <P>
          Let <M>{"X_1, X_2, \\ldots"}</M> be independent draws with the same mean <M>{"\\mu"}</M> (here each is 1 if a visitor buys, so{" "}
          <M>{"\\mu = p = 0.1"}</M>) and let <M>{"\\bar{X}_n"}</M> be the average of the first <M>{"n"}</M>. Then for any margin{" "}
          <M>{"\\varepsilon > 0"}</M>, however small,
        </P>
        <DM>{"P\\big(|\\bar{X}_n - \\mu| > \\varepsilon\\big) \\;\\longrightarrow\\; 0 \\quad \\text{as } n \\to \\infty"}</DM>
        <P>
          This is the <em>weak</em> law. (The <em>strong</em> law says something stronger: with probability 1, the running average
          eventually stays within any margin forever.) For conversion rates we can compute the probability exactly from the binomial
          distribution. With <M>{"\\varepsilon = 0.02"}</M>:
        </P>
        <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-[15px]">
            <thead className="bg-gray-50 dark:bg-carddark text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Visitors</th>
                <th className="px-3 py-2 font-medium text-right">Chance the rate is outside 8% to 12%</th>
                <th className="px-3 py-2 font-medium text-right">Chebyshev bound</th>
              </tr>
            </thead>
            <tbody>
              {[100, 500, 1000, 5000, 10000].map((n) => {
                const t = tailProb(n, P_BUY, EPS);
                const c = chebyshev(n, P_BUY, EPS);
                return (
                  <tr key={n} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-3 py-2 tabular-nums">{n.toLocaleString("en-US")}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{t < 1e-4 ? "< 0.01%" : pct(t, 2)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">{c >= 1 ? `${c.toFixed(2)} (useless)` : pct(c, 1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <H2 id="why">Why it's true</H2>
        <P>
          The proof takes two lines. The running average is right on average, <M>{"E[\\bar{X}_n] = \\mu"}</M>, and its variance shrinks
          because independent variances add while we divide by <M>{"n^2"}</M>:
        </P>
        <DM>{"\\operatorname{Var}(\\bar{X}_n) = \\frac{1}{n^2}\\sum_{i=1}^{n} \\operatorname{Var}(X_i) = \\frac{\\sigma^2}{n}"}</DM>
        <P>
          <strong>Chebyshev's inequality</strong> then says a variable is rarely far from its mean when its variance is small: the chance of
          a deviation of at least <M>{"\\varepsilon"}</M> is at most the variance divided by <M>{"\\varepsilon^2"}</M>.
        </P>
        <DM>{"P\\big(|\\bar{X}_n - \\mu| \\ge \\varepsilon\\big) \\le \\frac{\\operatorname{Var}(\\bar{X}_n)}{\\varepsilon^2} = \\frac{\\sigma^2}{n\\,\\varepsilon^2} \\;\\longrightarrow\\; 0"}</DM>
        <P>
          As the table shows, the bound is loose (at 100 visitors it's 2.25, which says nothing), but it always holds and it goes to
          zero. That's all the law needs.
        </P>

        <H2 id="how-fast">How fast: the square-root law</H2>
        <P>
          The typical error of the average is its standard deviation, <M>{"\\sigma / \\sqrt{n}"}</M>. Quadrupling traffic only halves the
          noise. For a 10% conversion rate:
        </P>
        <DM>{"\\sqrt{\\tfrac{0.09}{100}} = 3\\text{ points} \\qquad \\sqrt{\\tfrac{0.09}{10{,}000}} = 0.3\\text{ points} \\qquad \\sqrt{\\tfrac{0.09}{1{,}000{,}000}} = 0.03\\text{ points}"}</DM>
        <P>
          This is why A/B tests looking for small lifts need so much traffic: to see a 0.5-point difference clearly, the noise has to be
          well under 0.5 points.
        </P>

        <H2 id="dilution">Dilution, not correction</H2>
        <P>
          Our run had {b(100)} buyers in its first 100 visitors, {b(100) - 10} more than expected. A common intuition says the page must
          now "even out" with fewer buyers. It doesn't. Here is the <em>count</em> of extra buyers, <M>{"K_n - np"}</M>, for all 30 runs:
        </P>
      </Narrow>
      <div className="mx-auto max-w-2xl my-4">
        <ExcessPlot />
      </div>
      <Narrow>
        <P>
          The extra count doesn't shrink back to zero; it wanders further and further, with standard deviation{" "}
          <M>{"\\sqrt{np(1-p)}"}</M> that <em>grows</em>. Our run ends with {b(10000) - 1000 > 0 ? "+" : ""}
          {b(10000) - 1000} extra buyers, more than the +{b(100) - 10} it had after 100. But that excess is spread over 10,000 visitors, so the
          rate is off by only {((r(10000) - P_BUY) * 100).toFixed(2)} points. The early streak was never undone, just diluted. Believing
          otherwise is the <strong>gambler's fallacy</strong>.
        </P>

        <H2 id="small-samples">Small samples mislead</H2>
        <P>
          The flip side of the square-root law: small samples produce extreme averages. Here are {PAGES.length} product pages that all
          convert at exactly 10%, but get very different traffic:
        </P>
      </Narrow>
      <div className="mx-auto max-w-2xl my-4">
        <PagesPlot />
      </div>
      <Narrow>
        <P>
          The three "best" pages ({sorted
            .slice(0, 3)
            .map((p) => `${p.k} of ${p.n}`)
            .join(", ")}
          ) and the three "worst" ({sorted
            .slice(-3)
            .map((p) => `${p.k} of ${p.n}`)
            .join(", ")}
          ) are all small. Every page with at least 1,000 visitors ({big.length} of them) measured between{" "}
          {pct(Math.min(...big.map((p) => p.k / p.n)))} and {pct(Math.max(...big.map((p) => p.k / p.n)))}. Ranking by raw rate puts the
          noisiest pages at both ends. Howard Wainer called the formula behind this, <M>{"\\sigma/\\sqrt{n}"}</M>, "the most dangerous
          equation" because ignoring it leads to confident, wrong conclusions about small schools, small hospitals and small towns.
        </P>
        <P>
          For A/B testing the lesson is direct: a dramatic lift after a day of traffic is the least trustworthy result you'll see.
          Decide the sample size before you start, and don't stop early because the numbers look exciting.
        </P>

        <H2 id="limits">What the law doesn't promise</H2>
        <UL>
          <li>
            <strong>It assumes independent draws from one unchanging distribution.</strong> Weekday vs weekend traffic, a marketing push or
            a novelty effect means the "true rate" itself moves, and averaging over it converges to a blend, not to any one truth.
          </li>
          <li>
            <strong>It assumes a finite mean</strong>, and in practice convergence is slow when the variance is huge. Revenue per visitor,
            where one whale order can be worth thousands of ordinary ones, settles far more slowly than a conversion rate.
          </li>
          <li>
            <strong>It doesn't say how the error is distributed.</strong> It says the error shrinks, not what shape it has. For that you
            need the central limit theorem, the next post in this series, and the reason A/B test confidence intervals work.
          </li>
        </UL>

        <H2 id="code">In code</H2>
        <Code>{`import numpy as np

rng = np.random.default_rng(0)
visitors = rng.random(10_000) < 0.10          # True = bought
running_rate = np.cumsum(visitors) / np.arange(1, 10_001)
print(running_rate[[9, 99, 999, 9_999]])       # wild early, near 0.10 later

# Exact chance of being more than 2 points off, from the binomial
from scipy.stats import binom
for n in [100, 1_000, 10_000]:
    inside = binom.cdf(np.floor(0.12 * n), n, 0.1) - binom.cdf(np.ceil(0.08 * n) - 1, n, 0.1)
    print(n, 1 - inside)                       # 0.404, 0.031, ~0`}</Code>

        <H2 id="further">Further reading</H2>
        <UL>
          <li>
            <a className="link" href="https://www.americanscientist.org/article/the-most-dangerous-equation" target="_blank" rel="noopener noreferrer">
              Howard Wainer, The Most Dangerous Equation
            </a>
            : how ignoring <M>{"\\sigma/\\sqrt{n}"}</M> misled school and health policy.
          </li>
          <li>
            <a className="link" href="https://seeing-theory.brown.edu/basic-probability/index.html" target="_blank" rel="noopener noreferrer">
              Seeing Theory: Basic Probability
            </a>
            : interactive coin flips converging to their mean.
          </li>
          <li>
            <a className="link" href="https://projects.iq.harvard.edu/stat110/home" target="_blank" rel="noopener noreferrer">
              Harvard Stat 110
            </a>
            : the law of large numbers and Chebyshev's inequality in chapter 10.
          </li>
        </UL>
        <p className="mt-10 text-sm italic text-gray-600 dark:text-gray-400">
          Part of a series explaining one data science concept at a time. Next up: the central limit theorem. The data is simulated.
        </p>
      </Narrow>
    </Wide>
  );
};

export default LLNStory;
