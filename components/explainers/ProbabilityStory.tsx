import { useMemo, useState } from "react";
import Link from "next/link";

import { DM, M } from "@/components/explainers/Tex";
import { Button, Code, H2, Narrow, P, Scrolly, Slider, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { DAYS, DAY_GRID, DAY_N, P_BUY, binomCDF, binomPMF, histogram, mean, sd } from "lib/explainers/stats";

/**
 * "Probability" — first post of the statistics series: one visitor
 * (Bernoulli), the rules, counting buyers (binomial), mean and spread,
 * rates, conditional probability, code.
 */

const GREEN = "#05CE91";
const GREY = "#CBD5E1";
const BLUE = "#2B8CBE";
const ORANGE = "#E8772E";

// ---------- one day of visitors ----------
const DayGrid: React.FC<{ day: number }> = ({ day }) => {
  const g = DAY_GRID(day);
  const k = DAYS[day];
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 300 300" className="w-[60%] h-auto" role="img" aria-label={`Day ${day + 1}: ${k} of 100 visitors bought`}>
        {g.map((b, i) => (
          <circle key={i} cx={15 + (i % 10) * 30} cy={15 + Math.floor(i / 10) * 30} r={11} fill={b ? GREEN : GREY} />
        ))}
      </svg>
      <div>
        <div className="text-gray-500">Day {day + 1}</div>
        <div className="text-5xl font-semibold tabular-nums" style={{ color: "#047857" }}>
          {k}
        </div>
        <div className="text-gray-500">of 100 bought</div>
      </div>
    </div>
  );
};

// ---------- bar chart of counts ----------
const HW = 560;
const HH = 330;
const HP = { l: 46, r: 12, t: 14, b: 48 };
const Hist: React.FC<{ counts?: number[] | null; pmf?: number[] | null; band?: [number, number] | null; total?: number; xmax?: number; xlabel?: string }> = ({
  counts = null,
  pmf = null,
  band = null,
  total = 1,
  xmax = 24,
  xlabel = "Buyers in a day (out of 100 visitors)",
}) => {
  const n = xmax + 1;
  const sx = (k: number) => HP.l + ((k + 0.5) / n) * (HW - HP.l - HP.r);
  const bw = (HW - HP.l - HP.r) / n;
  const top = Math.max(...(counts ?? [0]).map((c) => c / total), ...(pmf ?? [0]), 1e-9) * 1.1;
  const sy = (v: number) => HH - HP.b - (v / top) * (HH - HP.t - HP.b);
  const step = xmax <= 24 ? 4 : xmax <= 60 ? 10 : Math.ceil(xmax / 6 / 10) * 10;
  return (
    <svg viewBox={`0 0 ${HW} ${HH}`} className="w-full h-auto" role="img" aria-label="Distribution of buyers per day">
      {band && <rect x={sx(band[0]) - bw / 2} width={sx(band[1]) - sx(band[0]) + bw} y={HP.t} height={HH - HP.t - HP.b} fill={GREEN} opacity={0.15} />}
      {counts?.map((c, k) => (
        <rect key={k} x={sx(k) - bw * 0.4} width={bw * 0.8} y={sy(c / total)} height={HH - HP.b - sy(c / total)} fill={BLUE} rx={2} />
      ))}
      {pmf?.map((p, k) => (
        <circle key={k} cx={sx(k)} cy={sy(p)} r={Math.min(5, bw * 0.35)} fill={ORANGE} stroke="white" strokeWidth={1.5} />
      ))}
      <line x1={HP.l} x2={HW - HP.r} y1={HH - HP.b} y2={HH - HP.b} className="stroke-gray-600 dark:stroke-gray-300" />
      {Array.from({ length: Math.floor(xmax / step) + 1 }, (_, i) => i * step).map((k) => (
        <text key={k} x={sx(k)} y={HH - HP.b + 20} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
          {k}
        </text>
      ))}
      <text x={(HP.l + HW - HP.r) / 2} y={HH - 6} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300 text-[14px]">
        {xlabel}
      </text>
    </svg>
  );
};

const Stat: React.FC<{ label: React.ReactNode; value: string; color?: string }> = ({ label, value, color }) => (
  <div>
    <dt className="text-gray-500 text-sm">{label}</dt>
    <dd className="text-xl font-semibold tabular-nums" style={color ? { color } : undefined}>
      {value}
    </dd>
  </div>
);

// ---------- binomial playground ----------
const Playground: React.FC = () => {
  const [n, setN] = useState(100);
  const [p, setP] = useState(0.1);
  const [sim, setSim] = useState<number[] | null>(null);
  const xmax = Math.min(n, Math.max(10, Math.ceil(n * p + 4.5 * Math.sqrt(n * p * (1 - p)) + 1)));
  const pmf = useMemo(() => Array.from({ length: xmax + 1 }, (_, k) => binomPMF(n, p, k)), [n, p, xmax]);
  const simulate = () => {
    const days = Array.from({ length: 1000 }, () => {
      let k = 0;
      for (let i = 0; i < n; i++) if (Math.random() < p) k++;
      return k;
    });
    setSim(days);
  };
  const m = n * p;
  const s = Math.sqrt(n * p * (1 - p));
  return (
    <div className="my-6 grid md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 items-center">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark p-2">
        <Hist counts={sim ? histogram(sim, 0, xmax) : null} total={1000} pmf={pmf} xmax={xmax} xlabel={`Buyers out of ${n} visitors`} band={[Math.max(0, Math.ceil(m - 2 * s)), Math.min(xmax, Math.floor(m + 2 * s))]} />
      </div>
      <div>
        <Slider label="Visitors, n" value={n} min={10} max={1000} step={10} digits={0} color={BLUE} onChange={(v) => (setN(v), setSim(null))} />
        <Slider label="Probability of buying, p" value={p} min={0.01} max={0.5} step={0.01} digits={2} color={ORANGE} onChange={(v) => (setP(v), setSim(null))} />
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <Stat label={<M>{"E[K] = np"}</M>} value={m.toFixed(1)} />
          <Stat label={<M>{"\\text{SD} = \\sqrt{np(1-p)}"}</M>} value={s.toFixed(2)} />
        </dl>
        <div className="mt-4 flex items-center gap-3">
          <Button primary onClick={simulate}>
            Simulate 1,000 days
          </Button>
          {sim && (
            <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">
              mean {mean(sim).toFixed(2)}, SD {sd(sim).toFixed(2)}
            </span>
          )}
        </div>
        <p className="mt-3 text-[14px] text-gray-600 dark:text-gray-400">
          Orange dots are the formula. Blue bars are simulated days. The shaded band is the mean ± 2 SD.
        </p>
      </div>
    </div>
  );
};

// ---------- at-least-one calculator ----------
const AtLeastOne: React.FC = () => {
  const [m, setM] = useState(20);
  const none = Math.pow(1 - P_BUY, m);
  return (
    <div className="my-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark p-4">
      <Slider label="Visitors" value={m} min={1} max={60} step={1} digits={0} color={BLUE} onChange={setM} />
      <div className="mt-2 overflow-x-auto">
        <M>{`P(\\text{at least one buys}) = 1 - 0.9^{${m}} = 1 - ${none.toFixed(3)} = ${(1 - none).toFixed(3)}`}</M>
      </div>
    </div>
  );
};

// ================= the article =================
const ProbabilityStory: React.FC = () => {
  const H = histogram(DAYS, 0, 24);
  const pmf = Array.from({ length: 25 }, (_, k) => binomPMF(DAY_N, P_BUY, k));
  const within = DAYS.filter((k) => k >= 4 && k <= 16).length / DAYS.length;
  const [k, setK] = useState(10);

  const steps: Step[] = [
    {
      key: "one",
      body: (
        <>
          <strong>One day, 100 visitors.</strong> Each visitor to a checkout page buys with probability 10%. On day 1, {DAYS[0]} of them
          bought (green). Was that "right"? There's no way to tell from one day.
        </>
      ),
    },
    {
      key: "another",
      body: (
        <>
          <strong>Another day, another count.</strong> Same page, same 10% chance, but day 6 had {DAYS[5]} buyers and day 11 had only{" "}
          {DAYS[10]}. A probability doesn't promise a specific outcome.
        </>
      ),
    },
    {
      key: "ten",
      body: (
        <>
          <strong>Keep a tally.</strong> Stack up each day's count. After 10 days the counts are scattered between {Math.min(...DAYS.slice(0, 10))} and{" "}
          {Math.max(...DAYS.slice(0, 10))}, with no clear shape yet.
        </>
      ),
    },
    {
      key: "thousand",
      body: (
        <>
          <strong>After 1,000 days, a shape appears.</strong> The blue bars are the share of simulated days with each count. The orange dots
          come from a formula (below) using nothing but <M>{"n = 100"}</M> and <M>{"p = 0.1"}</M>. They match.
        </>
      ),
    },
    {
      key: "band",
      body: (
        <>
          <strong>The spread is predictable too.</strong> {Math.round(within * 100)}% of days had between 4 and 16 buyers. Probability
          can't tell you what tomorrow brings, but it tells you exactly how surprised to be.
        </>
      ),
    },
  ];
  const chartFor = (st: number) => {
    if (st === 0) return <DayGrid day={0} />;
    if (st === 1) return <DayGrid day={5} />;
    if (st === 2) return <Hist counts={histogram(DAYS.slice(0, 10), 0, 24)} total={10} />;
    if (st === 3) return <Hist counts={H} total={DAYS.length} pmf={pmf} />;
    return <Hist counts={H} total={DAYS.length} pmf={pmf} band={[4, 16]} />;
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:47", src: "/explainers/probability/intuition.mp4", poster: "/explainers/probability/intuition-poster.jpg", square: true },
            { key: "math", label: "The math", len: "1:56", src: "/explainers/probability/math.mp4", poster: "/explainers/probability/math-poster.jpg" },
          ]}
          note="The intuition video is the idea in under a minute. The math video builds the binomial distribution, its mean and its spread from a single visitor."
        />
        <P>
          This is the first post in a short series on the statistics behind A/B testing. Every A/B test result (a lift, a p-value, a
          confidence interval) is a statement about randomness, so we start at the bottom: what a probability actually predicts. The
          running example is a checkout page where each visitor buys with probability 10%.
        </P>
        <H2 id="how-it-works">What 10% means</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="one-visitor">One visitor</H2>
        <P>
          Write <M>{"X = 1"}</M> if a visitor buys and <M>{"X = 0"}</M> if not, with <M>{"P(X = 1) = p"}</M>. That's a{" "}
          <em>Bernoulli</em> random variable, the atom of every conversion metric. Its <strong>expected value</strong> is the long-run
          average, each outcome weighted by its probability:
        </P>
        <DM>{"E[X] = 1 \\cdot p + 0 \\cdot (1 - p) = p = 0.1"}</DM>
        <P>
          Its <strong>variance</strong> is the expected squared distance from that average. Since <M>{"X^2 = X"}</M> for a 0/1 variable,
        </P>
        <DM>{"\\operatorname{Var}(X) = E[X^2] - E[X]^2 = p - p^2 = p(1 - p) = 0.09"}</DM>
        <P>
          Variance is largest at <M>{"p = 0.5"}</M> (a coin flip is as unpredictable as a 0/1 outcome gets) and shrinks toward 0 as{" "}
          <M>{"p"}</M> approaches 0 or 1.
        </P>

        <H2 id="rules">Three rules you'll use everywhere</H2>
        <UL>
          <li>
            <strong>Complement.</strong> <M>{"P(\\text{not } A) = 1 - P(A)"}</M>. Often the easiest way to get a probability is to find
            the chance it <em>doesn't</em> happen.
          </li>
          <li>
            <strong>Independence.</strong> If one event tells you nothing about another, <M>{"P(A \\text{ and } B) = P(A)\\,P(B)"}</M>.
            Two independent visitors both buy with probability <M>{"0.1 \\times 0.1 = 0.01"}</M>.
          </li>
          <li>
            <strong>Expected values add.</strong> <M>{"E[X_1 + \\cdots + X_n] = E[X_1] + \\cdots + E[X_n]"}</M>, whether or not the
            variables are independent.
          </li>
        </UL>
        <P>Combine the first two to get the chance that at least one of several visitors buys:</P>
        <AtLeastOne />

        <H2 id="binomial">Counting buyers: the binomial distribution</H2>
        <P>
          Let <M>{"K"}</M> be the number of buyers among <M>{"n"}</M> independent visitors. Any one arrangement with exactly{" "}
          <M>{"k"}</M> buyers (say, the first <M>{"k"}</M> buy and the rest don't) has probability <M>{"p^k (1-p)^{n-k}"}</M> by the
          independence rule. There are <M>{"\\binom{n}{k}"}</M> arrangements, so
        </P>
        <DM>{"P(K = k) = \\binom{n}{k}\\, p^{k} (1 - p)^{n - k}"}</DM>
        <P>For exactly 10 buyers out of 100:</P>
        <DM>{"\\binom{100}{10}(0.1)^{10}(0.9)^{90} = (1.73 \\times 10^{13})(10^{-10})(7.62 \\times 10^{-5}) = 0.132"}</DM>
        <P>
          The single most likely count happens on only 13% of days. Try other counts:
        </P>
        <div className="my-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark p-4">
          <Slider label="Buyers, k" value={k} min={0} max={25} step={1} digits={0} color={ORANGE} onChange={setK} />
          <dl className="mt-3 grid grid-cols-2 gap-3">
            <Stat label={<M>{`P(K = ${k})`}</M>} value={binomPMF(DAY_N, P_BUY, k).toFixed(4)} />
            <Stat label={<M>{`P(K \\le ${k})`}</M>} value={binomCDF(DAY_N, P_BUY, k).toFixed(4)} />
          </dl>
        </div>

        <H2 id="center-spread">Center and spread</H2>
        <P>
          Because <M>{"K"}</M> is a sum of <M>{"n"}</M> Bernoulli variables, expected values add up. And because the visitors are
          independent, so do their variances:
        </P>
        <DM>{"E[K] = np = 10 \\qquad \\operatorname{Var}(K) = np(1 - p) = 9 \\qquad \\operatorname{SD}(K) = \\sqrt{9} = 3"}</DM>
        <P>
          Our 1,000 simulated days had mean {mean(DAYS).toFixed(2)} and standard deviation {sd(DAYS).toFixed(2)}. Play with{" "}
          <M>{"n"}</M> and <M>{"p"}</M>, then simulate:
        </P>
      </Narrow>
      <Playground />
      <Narrow>
        <P>
          Notice what happens as you raise <M>{"n"}</M>: the shape gets more symmetric and bell-like, even when <M>{"p"}</M> is small.
          That's the central limit theorem at work, which gets its own post in this series.
        </P>

        <H2 id="rates">From counts to rates</H2>
        <P>
          A/B tests compare <em>rates</em>, not counts. The conversion rate is <M>{"\\hat{p} = K / n"}</M>. Dividing by <M>{"n"}</M> divides
          the mean by <M>{"n"}</M> and the SD by <M>{"n"}</M> too:
        </P>
        <DM>{"E[\\hat{p}] = p \\qquad \\operatorname{SD}(\\hat{p}) = \\frac{\\sqrt{np(1-p)}}{n} = \\sqrt{\\frac{p(1 - p)}{n}}"}</DM>
        <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-[15px]">
            <thead className="bg-gray-50 dark:bg-carddark text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Visitors</th>
                <th className="px-3 py-2 font-medium text-right">SD of the measured rate</th>
                <th className="px-3 py-2 font-medium">Typical day (± 2 SD)</th>
              </tr>
            </thead>
            <tbody>
              {[100, 1000, 10000, 100000].map((n) => {
                const s = Math.sqrt((P_BUY * (1 - P_BUY)) / n);
                return (
                  <tr key={n} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-3 py-2 tabular-nums">{n.toLocaleString("en-US")}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{(s * 100).toFixed(2)} points</td>
                    <td className="px-3 py-2 tabular-nums">
                      {((P_BUY - 2 * s) * 100).toFixed(1)}% to {((P_BUY + 2 * s) * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <P>
          With 100 visitors a day, a measured rate anywhere from 4% to 16% is normal noise. That's why a single day's numbers can't tell
          you whether a new checkout design works. Each 100× increase in traffic shrinks the noise 10×, because of the square root. Why
          the rate homes in on <M>{"p"}</M> at all is the subject of the next post, the{" "}
          <Link className="link" href="/blog/posts/law-of-large-numbers-explained/">
            law of large numbers
          </Link>
          .
        </P>

        <H2 id="conditional">Conditional probability</H2>
        <P>
          Segments matter in A/B tests, and segments are conditional probabilities. Suppose 30% of visitors arrive from an email
          campaign and buy at 20%, while the other 70% buy at about 5.7%. Then
        </P>
        <DM>{"P(\\text{buy}) = P(\\text{buy} \\mid \\text{email})P(\\text{email}) + P(\\text{buy} \\mid \\text{other})P(\\text{other}) = 0.2(0.3) + 0.057(0.7) = 0.10"}</DM>
        <P>
          Flip the question around: among buyers, what share came from email? That's <M>{"P(\\text{email} \\mid \\text{buy})"}</M>, a
          different number. Bayes' rule converts one into the other:
        </P>
        <DM>{"P(\\text{email} \\mid \\text{buy}) = \\frac{P(\\text{buy} \\mid \\text{email})\\,P(\\text{email})}{P(\\text{buy})} = \\frac{0.2 \\times 0.3}{0.1} = 0.6"}</DM>
        <P>
          Email visitors are 30% of traffic but 60% of buyers. Mixing up <M>{"P(A \\mid B)"}</M> and <M>{"P(B \\mid A)"}</M> is one of the
          most common reasoning errors in analytics.
        </P>

        <H2 id="careful">Common mistakes</H2>
        <UL>
          <li>
            <strong>The gambler's fallacy.</strong> After three slow days, a busy day isn't "due". Independent days have no memory.
          </li>
          <li>
            <strong>Assuming independence that isn't there.</strong> The same person visiting five times, a bot, or a viral post sending a
            wave of similar visitors all break the binomial model, and make results noisier than the formulas suggest.
          </li>
          <li>
            <strong>Reading one outcome as the probability.</strong> 9 buyers out of 100 doesn't mean <M>{"p = 0.09"}</M>. It's one draw from
            a distribution centered on the true <M>{"p"}</M>.
          </li>
          <li>
            <strong>Flipping conditionals.</strong> <M>{"P(\\text{buy} \\mid \\text{email}) \\ne P(\\text{email} \\mid \\text{buy})"}</M>.
          </li>
        </UL>

        <H2 id="code">In code</H2>
        <Code>{`import numpy as np
from scipy.stats import binom

rng = np.random.default_rng(0)
days = rng.binomial(n=100, p=0.1, size=1000)  # buyers on 1,000 simulated days
print(days.mean(), days.std())               # close to 10 and 3

print(binom.pmf(10, 100, 0.1))   # 0.1319  P(K = 10)
print(binom.cdf(16, 100, 0.1) - binom.cdf(3, 100, 0.1))  # 0.979  P(4 <= K <= 16)
print(1 - 0.9 ** 20)             # 0.878   at least one buyer among 20`}</Code>

        <H2 id="further">Further reading</H2>
        <UL>
          <li>
            <a className="link" href="https://seeing-theory.brown.edu/" target="_blank" rel="noopener noreferrer">
              Seeing Theory
            </a>
            : Brown University's visual introduction to probability.
          </li>
          <li>
            <a className="link" href="https://projects.iq.harvard.edu/stat110/home" target="_blank" rel="noopener noreferrer">
              Harvard Stat 110
            </a>
            : Joe Blitzstein's probability course, with free lectures and book.
          </li>
          <li>
            <a className="link" href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.binom.html" target="_blank" rel="noopener noreferrer">
              scipy.stats.binom
            </a>
            : the binomial distribution in Python.
          </li>
        </UL>
        <p className="mt-10 text-sm italic text-gray-600 dark:text-gray-400">
          Part of a series explaining one data science concept at a time. Next up: the law of large numbers. The data is simulated.
        </p>
      </Narrow>
    </Wide>
  );
};

export default ProbabilityStory;
