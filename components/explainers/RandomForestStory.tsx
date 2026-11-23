import { useMemo, useState } from "react";
import Link from "next/link";

import { DM, M } from "@/components/explainers/Tex";
import { Code, H2, Narrow, P, Scrolly, Slider, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { HEAT_CELLS, Scatter, splitLines } from "@/components/explainers/DecisionTreeStory";
import {
  DEPTH_CURVE,
  FOREST,
  FOREST_CURVE,
  TEST,
  TRAIN,
  accuracy,
  forestPredict,
  grow,
  oobAccuracy,
  predict,
  regions,
  voteShare,
  type Node,
} from "lib/explainers/tree";

/**
 * "Random Forests" — MLU-Explain style article: videos, a scrolling story,
 * bootstrap and voting with real numbers, why averaging works, out-of-bag
 * accuracy, settings, caveats, code.
 */

const BUY = "#05CE91";
const NO = "#94A3B8";
const N = TRAIN.length;
const DEEP = grow(TRAIN, 12);
const NEW: [number, number] = [8, 3];

const heatFor = (n: number) => {
  const f = FOREST.slice(0, n);
  return HEAT_CELLS.map((c) => voteShare(f, c));
};

// ---------- votes table ----------
const VoteTable: React.FC = () => {
  const votes = FOREST.map((f) => predict(f.tree, NEW));
  const yes = votes.reduce((a, b) => a + b, 0);
  const [n, setN] = useState(20);
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark p-4">
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-1.5 text-center text-[13px]">
        {votes.slice(0, n).map((v, i) => (
          <div key={i} className="rounded px-1 py-1" style={{ background: v ? "rgba(5,206,145,0.15)" : "rgba(148,163,184,0.18)", color: v ? "#047857" : "#475569" }}>
            #{i + 1} {v ? "buy" : "no"}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <button type="button" className="link" onClick={() => setN(n >= FOREST.length ? 20 : FOREST.length)}>
          {n >= FOREST.length ? "Show fewer" : `Show all ${FOREST.length} trees`}
        </button>
        <span>
          <M>{`\\text{share voting buy} = \\tfrac{${yes}}{${FOREST.length}} = ${(yes / FOREST.length).toFixed(2)}`}</M>
        </span>
      </div>
    </div>
  );
};

// ---------- comparison ----------
const Comparison: React.FC = () => {
  const rows = [
    { name: "One shallow tree (depth 2)", acc: DEPTH_CURVE[1].test, note: "great here, because the true rule is simple; you had to pick the depth" },
    { name: "One fully grown tree", acc: DEPTH_CURVE[DEPTH_CURVE.length - 1].test, note: "memorizes the noise" },
    { name: "Forest of 200 fully grown trees", acc: FOREST_CURVE[FOREST_CURVE.length - 1].test, note: "no depth to tune, much steadier" },
  ];
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-[15px]">
        <thead className="bg-gray-50 dark:bg-carddark text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Model</th>
            <th className="px-3 py-2 font-medium text-right">Accuracy on 500 new visitors</th>
            <th className="px-3 py-2 font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-gray-100 dark:border-gray-700">
              <td className="px-3 py-2">{r.name}</td>
              <td className="px-3 py-2 text-right tabular-nums font-semibold">{Math.round(r.acc * 100)}%</td>
              <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ================= the article =================
const RandomForestStory: React.FC = () => {
  const [trees, setTrees] = useState(10);
  const heat = useMemo(() => heatFor(trees), [trees]);
  const heat200 = useMemo(() => heatFor(FOREST.length), []);
  const sub = FOREST.slice(0, trees);
  const subTest = accuracy((x) => forestPredict(sub, x), TEST);
  const subOob = oobAccuracy(sub);
  const deepTest = DEPTH_CURVE[DEPTH_CURVE.length - 1].test;
  const outFrac = FOREST.reduce((s, f) => s + f.counts.filter((c) => c === 0).length, 0) / (FOREST.length * N);
  const t1out = FOREST[0].counts.filter((c) => c === 0).length;
  const t1dup = FOREST[0].counts.filter((c) => c > 1).length;
  const share = voteShare(FOREST, NEW);
  const oob = oobAccuracy(FOREST);
  const importance = useMemo(() => {
    const out = [0, 0];
    for (const f of FOREST) {
      const walk = (n: Node) => {
        if (n.leaf) return;
        out[n.feature] += (n.n / N) * n.gain;
        walk(n.left);
        walk(n.right);
      };
      walk(f.tree);
    }
    const tot = out[0] + out[1];
    return out.map((v) => v / tot);
  }, []);

  const steps: Step[] = useMemo(
    () => [
      {
        key: "deep",
        body: (
          <>
            <strong>Start with the problem.</strong> These are the same {N} store visitors from the{" "}
            <Link className="link" href="/blog/posts/decision-trees-explained/">
              decision tree post
            </Link>
            . Let a single tree grow until every group is pure and it carves out little boxes around individual visitors: it's
            memorized the noise, and gets only <strong>{Math.round(deepTest * 100)}%</strong> of new visitors right.
          </>
        ),
      },
      {
        key: "bootstrap",
        body: (
          <>
            <strong>Randomness #1: a resampled training set.</strong> Draw {N} visitors <em>with replacement</em>. Tree 1's draw
            picked {t1dup} visitors more than once (bigger dots) and missed {t1out} completely (faded). Every tree gets its own
            draw.
          </>
        ),
      },
      {
        key: "tree1",
        body: (
          <>
            <strong>Grow a full tree on that sample.</strong> Randomness #2: at every split, the tree may only consider a random
            subset of the features (here, one of the two). The result is a quirky tree that's overfit in its own particular way.
          </>
        ),
      },
      {
        key: "tree2",
        body: (
          <>
            <strong>A second tree, different quirks.</strong> Different sample, different random choices, different boxes. Each
            tree alone is mediocre. But their mistakes land in different places.
          </>
        ),
      },
      {
        key: "vote",
        body: (
          <>
            <strong>Let 200 of them vote.</strong> For any visitor, each tree says buy or no, and the forest goes with the
            majority. The shading shows the share of trees voting buy: the jagged boxes blur into a smooth, sensible boundary.
            New-visitor accuracy: <strong>{Math.round(FOREST_CURVE[FOREST_CURVE.length - 1].test * 100)}%</strong>.
          </>
        ),
      },
      {
        key: "yours",
        body: (
          <>
            <strong>Your turn.</strong> Change the number of trees.
            <Slider label="Trees in the forest" value={trees} min={1} max={200} step={1} digits={0} color="#007A7A" onChange={setTrees} />
            <dl className="mt-3 grid grid-cols-2 gap-2 text-center text-sm">
              <div>
                <dt className="text-gray-500">New visitors</dt>
                <dd className="text-xl font-semibold tabular-nums">{Math.round(subTest * 100)}%</dd>
              </div>
              <div>
                <dt className="text-gray-500">Out-of-bag</dt>
                <dd className="text-xl font-semibold tabular-nums">{Math.round(subOob * 100)}%</dd>
              </div>
            </dl>
            <p className="mt-2 text-[14px] text-gray-600 dark:text-gray-400">
              A handful of trees is noisy; past a few dozen, adding more barely changes anything. More trees never make a forest
              overfit, they just cost time.
            </p>
          </>
        ),
      },
    ],
    [trees, subTest, subOob, deepTest, t1dup, t1out]
  );

  const chartFor = (s: number) => {
    if (s === 0) return <Scatter rects={regions(DEEP)} lines={splitLines(DEEP)} />;
    if (s === 1) return <Scatter counts={FOREST[0].counts} />;
    if (s === 2) return <Scatter rects={regions(FOREST[0].tree)} lines={splitLines(FOREST[0].tree)} counts={FOREST[0].counts} />;
    if (s === 3) return <Scatter rects={regions(FOREST[1].tree)} lines={splitLines(FOREST[1].tree)} counts={FOREST[1].counts} />;
    if (s === 4) return <Scatter heat={heat200} />;
    return <Scatter heat={heat} />;
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:47", src: "/explainers/random-forest/intuition.mp4", poster: "/explainers/random-forest/intuition-poster.jpg", square: true },
            { key: "math", label: "The math", len: "1:52", src: "/explainers/random-forest/math.mp4", poster: "/explainers/random-forest/math-poster.jpg" },
          ]}
          note="The intuition video is the idea in under a minute. The math video shows the bootstrap, the vote and why averaging reduces error."
        />
        <P>
          A single decision tree is easy to read but fragile: it overfits, and a few changed data points can reshape it completely.
          A random forest keeps everything good about trees and fixes that with a surprisingly simple idea: train hundreds of
          slightly different trees and let them vote. It's often the first model worth trying on tabular data, because it works
          well with almost no tuning.
        </P>
        <H2 id="how-it-works">How it works</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="bootstrap">Where the numbers come from: the bootstrap</H2>
        <P>
          Each tree trains on {N} visitors drawn at random <em>with replacement</em> from the {N} we have. Any one draw misses a
          given visitor with probability <M>{"1 - \\tfrac{1}{n}"}</M>, so all {N} draws miss them with probability
        </P>
        <DM>{`\\left(1 - \\tfrac{1}{${N}}\\right)^{${N}} = ${Math.pow(1 - 1 / N, N).toFixed(3)} \\;\\xrightarrow{\\;n \\to \\infty\\;}\\; \\tfrac{1}{e} \\approx 0.368`}</DM>
        <P>
          Across our 200 trees, the share of visitors actually left out was <strong>{(outFrac * 100).toFixed(1)}%</strong>, right on
          cue. Those left-out visitors are the tree's <em>out-of-bag</em> visitors, and they turn out to be very useful.
        </P>

        <H2 id="vote">The vote</H2>
        <P>
          To predict, every tree answers on its own. For a new visitor who spent 8 minutes on the page and has 3 past purchases, here
          is how the trees voted:
        </P>
        <VoteTable />
        <P>
          The forest predicts <strong>buy</strong>, and the {Math.round(share * 100)}% vote share doubles as a rough probability
          (scikit-learn averages the trees' leaf proportions instead of counting votes, which gives a similar number).
        </P>

        <H2 id="why">Why averaging works</H2>
        <P>
          Think of each tree's prediction as a noisy measurement. If <M>{"B"}</M> trees each have variance <M>{"\\sigma^2"}</M> and
          every pair is correlated by <M>{"\\rho"}</M>, the variance of their average is
        </P>
        <DM>{"\\operatorname{Var}\\Big(\\frac{1}{B}\\sum_{b=1}^{B} T_b\\Big) = \\rho\\,\\sigma^2 + \\frac{1 - \\rho}{B}\\,\\sigma^2"}</DM>
        <P>
          Adding trees drives the second term toward zero. The first term doesn't shrink with more trees, which is why the forest
          randomizes features as well as rows: it makes the trees less alike (smaller <M>{"\\rho"}</M>). Bagging alone, with every
          tree free to pick the same strong first question, leaves the trees too similar. The payoff on our data:
        </P>
        <Comparison />

        <H2 id="oob">A free test set: out-of-bag accuracy</H2>
        <P>
          Each visitor was left out of roughly 37% of the trees. Let only those trees vote on that visitor and you get an honest
          prediction from trees that never saw them. Do that for everyone and you have the <em>out-of-bag accuracy</em>, an estimate
          of new-data performance with no data held back. Here it's {Math.round(oob * 100)}%, against{" "}
          {Math.round(FOREST_CURVE[FOREST_CURVE.length - 1].test * 100)}% on 500 truly new visitors: in the right range, though with
          only {N} visitors it's a noisy estimate.
        </P>

        <H2 id="settings">Settings that matter</H2>
        <UL>
          <li>
            <strong>Number of trees</strong> (<code>n_estimators</code>): more is better until it stops mattering; a few hundred is
            typical. It never causes overfitting.
          </li>
          <li>
            <strong>Features per split</strong> (<code>max_features</code>): fewer means more diverse trees. Square root of the
            number of features is the usual default for classification.
          </li>
          <li>
            <strong>Tree size</strong> (<code>max_depth</code>, <code>min_samples_leaf</code>): trees are usually grown deep; limit
            them if the data is very noisy.
          </li>
          <li>
            <strong>Feature importance</strong>: add up each feature's impurity reduction across all trees. Here:{" "}
            {Math.round(importance[0] * 100)}% minutes on page, {Math.round(importance[1] * 100)}% past purchases.
          </li>
        </UL>

        <H2 id="careful">When to be careful</H2>
        <UL>
          <li>
            <strong>Harder to explain.</strong> You can't read 200 trees. Use feature importance, partial dependence plots or SHAP
            values to explain predictions.
          </li>
          <li>
            <strong>Impurity-based importance is biased</strong> toward features with many distinct values. Permutation importance on
            held-out data is more trustworthy.
          </li>
          <li>
            <strong>No extrapolation.</strong> Predictions are flat beyond the range of the training data.
          </li>
          <li>
            <strong>Vote shares aren't calibrated probabilities.</strong> Calibrate them if you need real probabilities.
          </li>
        </UL>

        <H2 id="code">In code</H2>
        <Code>{`import numpy as np
from sklearn.ensemble import RandomForestClassifier

X = np.array([${TRAIN.map((p) => `[${p.x[0]}, ${p.x[1]}]`).join(", ")}])
y = np.array([${TRAIN.map((p) => p.y).join(", ")}])

forest = RandomForestClassifier(
    n_estimators=200, max_features=1, oob_score=True, random_state=0
).fit(X, y)
print(forest.oob_score_)               # 0.75
print(forest.predict_proba([[8, 3]]))  # [[0.095 0.905]]  -> 90% buy
print(forest.feature_importances_)     # [0.611 0.389]
# Exact numbers differ a little from this article's forest,
# because the random draws are different.`}</Code>

        <H2 id="further">Further reading</H2>
        <UL>
          <li>
            <a className="link" href="https://www.statlearning.com/" target="_blank" rel="noopener noreferrer">
              An Introduction to Statistical Learning
            </a>
            , section 8.2: bagging and random forests.
          </li>
          <li>
            <a className="link" href="https://doi.org/10.1023/A:1010933404324" target="_blank" rel="noopener noreferrer">
              Breiman (2001), Random Forests
            </a>
            : the original paper.
          </li>
          <li>
            <a className="link" href="https://mlu-explain.github.io/random-forest/" target="_blank" rel="noopener noreferrer">
              MLU-Explain: Random Forest
            </a>
            : a visual walkthrough.
          </li>
          <li>
            <a className="link" href="https://scikit-learn.org/stable/modules/ensemble.html#random-forests" target="_blank" rel="noopener noreferrer">
              scikit-learn: Random forests
            </a>
            : the practical reference.
          </li>
        </UL>
        <p className="mt-10 text-sm italic text-gray-600 dark:text-gray-400">Part of a series explaining one data science concept at a time. The data is synthetic.</p>
      </Narrow>
    </Wide>
  );
};

export default RandomForestStory;
