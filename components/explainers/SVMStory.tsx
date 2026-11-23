import { useId, useMemo, useState } from "react";
import Link from "next/link";

import { DM, M } from "@/components/explainers/Tex";
import { Code, H2, Narrow, P, Scrolly, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { MODEL, N, X1, X2, Y, accuracy, decision, fitSVM, hinge, marginWidth, norm, supportVectors, type SVM } from "lib/explainers/svm";

/**
 * "Support Vector Machines" — MLU-Explain style article: videos, a scrolling
 * story, the margin maths with real numbers, a C slider that refits the SVM
 * live, a remove-a-point playground, kernels, caveats, code.
 */

const BUY = "#05CE91";
const NO = "#94A3B8";
const BLUE = "#2563EB";
const GOLD = "#E0A100";
const RED = "#E2483D";
const PURPLE = "#9B59D0";
const NEWV: [number, number] = [6, 7];
const f3 = (x: number) => x.toFixed(3);
const POS = Y.filter((y) => y === 1).length;

// ---------- chart geometry ----------
const CW = 560;
const CH = 470;
const PAD = { l: 52, r: 16, t: 16, b: 52 };
const sx = (v: number) => PAD.l + (v / 12) * (CW - PAD.l - PAD.r);
const sy = (v: number) => CH - PAD.b - (v / 12) * (CH - PAD.t - PAD.b);
type Line = { w: [number, number]; b: number };
const at = (m: Line, level: number, x: number) => (level - m.b - m.w[0] * x) / m.w[1];

const TRIES: Line[] = [
  { w: [0.9, 0.2], b: -6.4 },
  { w: [0.55, 0.6], b: -6.6 },
  { w: [1.0, 0.45], b: -8.3 },
];

type PlotProps = {
  model?: Line | null;
  tries?: boolean;
  rings?: number[];
  dim?: boolean;
  violators?: boolean;
  star?: boolean;
  removed?: Set<number>;
  ghost?: Line | null;
  onPoint?: (i: number) => void;
};

const SvmPlot: React.FC<PlotProps> = ({ model = null, tries = false, rings = [], dim = false, violators = false, star = false, removed, ghost = null, onPoint }) => {
  const clip = useId().replace(/:/g, "");
  const ringSet = new Set(rings);
  const lineAt = (m: Line, level: number) => ({ x1: sx(-1), y1: sy(at(m, level, -1)), x2: sx(13), y2: sy(at(m, level, 13)) });
  return (
    <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full h-auto select-none" role="img" aria-label="Visitors by minutes on page and pages viewed, with the SVM boundary">
      <defs>
        <clipPath id={clip}>
          <rect x={sx(0)} y={sy(12)} width={sx(12) - sx(0)} height={sy(0) - sy(12)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        {model && (
          <>
            <polygon
              points={[lineAt(model, 1), lineAt(model, -1)]
                .flatMap((l, k) => (k ? [`${l.x2},${l.y2}`, `${l.x1},${l.y1}`] : [`${l.x1},${l.y1}`, `${l.x2},${l.y2}`]))
                .join(" ")}
              fill={BLUE}
              opacity={0.12}
            />
            {[1, -1].map((lv) => (
              <line key={lv} {...lineAt(model, lv)} stroke={BLUE} strokeWidth={2} strokeDasharray="8 6" />
            ))}
            <line {...lineAt(model, 0)} stroke={BLUE} strokeWidth={3.5} />
          </>
        )}
        {ghost && <line {...lineAt(ghost, 0)} stroke={BLUE} strokeWidth={2} opacity={0.35} />}
        {tries && TRIES.map((t, i) => <line key={i} {...lineAt(t, 0)} stroke="#64748B" strokeWidth={2.5} />)}
      </g>
      {[0, 2, 4, 6, 8, 10, 12].map((v) => (
        <g key={v}>
          <text x={PAD.l - 10} y={sy(v) + 5} textAnchor="end" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
            {v}
          </text>
          <text x={sx(v)} y={CH - PAD.b + 20} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-[13px]">
            {v}
          </text>
        </g>
      ))}
      <line x1={PAD.l} x2={CW - PAD.r} y1={CH - PAD.b} y2={CH - PAD.b} className="stroke-gray-600 dark:stroke-gray-300" />
      <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={CH - PAD.b} className="stroke-gray-600 dark:stroke-gray-300" />
      <text x={(PAD.l + CW - PAD.r) / 2} y={CH - 8} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300 text-[14px]">
        Minutes on the product page
      </text>
      <text x={14} y={(PAD.t + CH - PAD.b) / 2} transform={`rotate(-90 14 ${(PAD.t + CH - PAD.b) / 2})`} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300 text-[14px]">
        Pages viewed
      </text>
      {Y.map((y, i) => {
        const gone = removed?.has(i);
        const wrong = violators && model && y * decision(model as SVM, X1[i], X2[i]) < 0;
        return (
          <g
            key={i}
            onClick={onPoint ? () => onPoint(i) : undefined}
            className={onPoint ? "cursor-pointer" : undefined}
            role={onPoint ? "button" : undefined}
            aria-label={onPoint ? `${gone ? "Restore" : "Remove"} visitor at ${X1[i]} minutes, ${X2[i]} pages` : undefined}
          >
            {onPoint && <circle cx={sx(X1[i])} cy={sy(X2[i])} r={14} fill="transparent" />}
            {(ringSet.has(i) || wrong) && !gone && <circle cx={sx(X1[i])} cy={sy(X2[i])} r={12} fill="none" stroke={wrong ? RED : GOLD} strokeWidth={2.5} />}
            <circle
              cx={sx(X1[i])}
              cy={sy(X2[i])}
              r={6.5}
              fill={gone ? "none" : y === 1 ? BUY : NO}
              stroke={gone ? (y === 1 ? BUY : NO) : "white"}
              strokeWidth={gone ? 1.5 : 1.5}
              strokeDasharray={gone ? "3 2" : undefined}
              opacity={dim && !ringSet.has(i) ? 0.3 : 1}
            />
          </g>
        );
      })}
      {star && (
        <path
          d={Array.from({ length: 10 }, (_, k) => {
            const a = (Math.PI / 5) * k - Math.PI / 2;
            const r = k % 2 ? 6 : 14;
            return `${k ? "L" : "M"}${(sx(NEWV[0]) + r * Math.cos(a)).toFixed(1)},${(sy(NEWV[1]) + r * Math.sin(a)).toFixed(1)}`;
          }).join("") + "Z"}
          fill={PURPLE}
          stroke="white"
          strokeWidth={2}
        />
      )}
    </svg>
  );
};

const Stat: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div>
    <dt className="text-gray-500 text-sm">{label}</dt>
    <dd className="text-xl font-semibold tabular-nums" style={color ? { color } : undefined}>
      {value}
    </dd>
  </div>
);

// ---------- support-vector table ----------
const SVTable: React.FC = () => {
  const rows = Y.map((y, i) => ({ i, y, m: y * decision(MODEL, X1[i], X2[i]), a: MODEL.alpha[i] })).sort((a, b) => a.m - b.m);
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, 10);
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-[15px]">
        <thead className="bg-gray-50 dark:bg-carddark text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Visitor (minutes, pages)</th>
            <th className="px-3 py-2 font-medium">Bought?</th>
            <th className="px-3 py-2 font-medium text-right">
              <M>{"y_i f(\\mathbf{x}_i)"}</M>
            </th>
            <th className="px-3 py-2 font-medium text-right">Hinge loss</th>
            <th className="px-3 py-2 font-medium text-right">
              <M>{"\\alpha_i"}</M>
            </th>
            <th className="px-3 py-2 font-medium">Where</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => {
            const sv = r.a > 1e-6;
            const where = r.m < 0 ? "wrong side" : r.m < 0.999 ? "inside the street" : r.m < 1.001 ? "on the edge" : "outside the street";
            return (
              <tr key={r.i} className="border-t border-gray-100 dark:border-gray-700" style={sv ? { background: "rgba(224,161,0,0.09)" } : undefined}>
                <td className="px-3 py-1.5 tabular-nums">
                  ({X1[r.i]}, {X2[r.i]})
                </td>
                <td className="px-3 py-1.5">{r.y === 1 ? "yes" : "no"}</td>
                <td className="px-3 py-1.5 text-right tabular-nums" style={{ color: r.m < 0 ? RED : undefined }}>
                  {r.m.toFixed(2)}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">{Math.max(0, 1 - r.m).toFixed(2)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums font-semibold">{sv ? r.a.toFixed(3) : "0"}</td>
                <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">{where}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-3 py-2 text-sm border-t border-gray-100 dark:border-gray-700">
        <button type="button" className="link" onClick={() => setAll(!all)}>
          {all ? "Show the 10 closest only" : `Show all ${N} visitors`}
        </button>
      </div>
    </div>
  );
};

// ---------- remove-a-point playground ----------
const RemovePlayground: React.FC = () => {
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const model = useMemo(() => {
    const keep = Y.map((_, i) => i).filter((i) => !removed.has(i));
    const m = fitSVM(
      1,
      keep.map((i) => X1[i]),
      keep.map((i) => X2[i]),
      keep.map((i) => Y[i])
    );
    const alpha = new Array(N).fill(0);
    keep.forEach((i, k) => (alpha[i] = m.alpha[k]));
    return { ...m, alpha };
  }, [removed]);
  const toggle = (i: number) => {
    const s = new Set(removed);
    if (s.has(i)) s.delete(i);
    else s.add(i);
    setRemoved(s);
  };
  const moved = Math.abs(model.w[0] - MODEL.w[0]) + Math.abs(model.w[1] - MODEL.w[1]) + Math.abs(model.b - MODEL.b) > 1e-3;
  return (
    <div className="my-6 grid md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 items-center">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark p-2">
        <SvmPlot model={model} rings={supportVectors(model)} removed={removed} ghost={moved ? MODEL : null} onPoint={toggle} />
      </div>
      <div className="text-[16px] leading-relaxed">
        <p>
          <strong>Click any visitor to remove them</strong> and the SVM refits on the rest. Click again to bring them back.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="Visitors removed" value={String(removed.size)} />
          <Stat label="Support vectors" value={String(supportVectors(model).length)} color={GOLD} />
          <Stat label="Street width" value={marginWidth(model).toFixed(2)} color={BLUE} />
          <Stat label="Boundary" value={moved ? "moved" : "unchanged"} color={moved ? RED : undefined} />
        </dl>
        <p className="mt-4 text-[15px] text-gray-600 dark:text-gray-400">
          Remove points far from the street and nothing happens. Remove a circled one and the street shifts (the faint line is the
          original boundary).
        </p>
        {removed.size > 0 && (
          <button type="button" className="link mt-2 text-sm" onClick={() => setRemoved(new Set())}>
            Restore everyone
          </button>
        )}
      </div>
    </div>
  );
};

// ================= the article =================
const SVMStory: React.FC = () => {
  const [logC, setLogC] = useState(0);
  const C = Math.pow(10, logC);
  const live = useMemo(() => fitSVM(C), [C]);
  const SV = supportVectors(MODEL);
  const nw = norm(MODEL);
  const wrong = Y.map((y, i) => i).filter((i) => Y[i] * decision(MODEL, X1[i], X2[i]) < 0);
  const fN = decision(MODEL, NEWV[0], NEWV[1]);
  const small = fitSVM(0.05);

  const steps: Step[] = useMemo(
    () => [
      {
        key: "data",
        body: (
          <>
            <strong>Meet the data.</strong> {N} visitors to an online store: how many minutes they spent on a product page, how many
            pages they viewed, and whether they bought (green, {POS} of them) or not (grey). Buyers sit toward the upper right.
          </>
        ),
      },
      {
        key: "tries",
        body: (
          <>
            <strong>Many lines work.</strong> Each of these lines puts most buyers on one side and most non-buyers on the other. On
            the training data they look about equally good. Which one would you trust with new visitors?
          </>
        ),
      },
      {
        key: "street",
        body: (
          <>
            <strong>Pick the widest street.</strong> An SVM looks for the line with the most room on either side: a street that's
            as wide as possible with buyers on one side and non-buyers on the other. Here the street is{" "}
            <strong style={{ color: BLUE }}>{marginWidth(MODEL).toFixed(2)}</strong> units wide. A wide margin means small
            measurement noise is less likely to push a new visitor to the wrong side.
          </>
        ),
      },
      {
        key: "sv",
        body: (
          <>
            <strong>Only the edge matters.</strong> The street is held in place by the <strong style={{ color: GOLD }}>{SV.length} circled
            visitors</strong> on or inside its edges: the <em>support vectors</em>. Every other visitor could move around (without
            crossing into the street) or disappear, and the line wouldn't change.
          </>
        ),
      },
      {
        key: "soft",
        body: (
          <>
            <strong>Real data overlaps.</strong> No straight street separates these classes perfectly: {wrong.length} visitors (red
            rings) are on the wrong side. So the SVM uses a <em>soft margin</em>: points may sit inside the street or across it, but each
            one adds a penalty. The setting <M>{"C"}</M> decides how much each violation costs.
          </>
        ),
      },
      {
        key: "yours",
        body: (
          <>
            <strong>Your turn.</strong> Slide <M>{"C"}</M> (log scale).
            <label className="block mt-3">
              <span className="flex justify-between text-[15px]">
                Cost of each violation, C
                <span className="tabular-nums" style={{ color: GOLD }}>
                  {C < 0.1 ? C.toFixed(3) : C < 10 ? C.toFixed(2) : C.toFixed(0)}
                </span>
              </span>
              <input type="range" min={-2} max={2} step={0.05} value={logC} onChange={(e) => setLogC(Number(e.target.value))} className="w-full" style={{ accentColor: GOLD }} />
            </label>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Stat label="Street width" value={marginWidth(live).toFixed(2)} color={BLUE} />
              <Stat label="Support vectors" value={String(supportVectors(live).length)} color={GOLD} />
              <Stat label="Training accuracy" value={`${Math.round(accuracy(live) * 100)}%`} />
            </dl>
            <p className="mt-2 text-[14px] text-gray-600 dark:text-gray-400">
              Small C: violations are cheap, so the street gets wide and many points become support vectors. Large C: violations are
              expensive, so the street narrows to fit the training data. Past C ≈ 1 nothing changes here, because no remaining
              violation can be removed by narrowing further.
            </p>
          </>
        ),
      },
    ],
    [C, logC, live, SV.length, wrong.length]
  );

  const chartFor = (s: number) => {
    if (s === 0) return <SvmPlot />;
    if (s === 1) return <SvmPlot tries />;
    if (s === 2) return <SvmPlot model={MODEL} />;
    if (s === 3) return <SvmPlot model={MODEL} rings={SV} dim />;
    if (s === 4) return <SvmPlot model={MODEL} violators />;
    return <SvmPlot model={live} rings={supportVectors(live)} />;
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:47", src: "/explainers/svm/intuition.mp4", poster: "/explainers/svm/intuition-poster.jpg", square: true },
            { key: "math", label: "The math", len: "2:04", src: "/explainers/svm/math.mp4", poster: "/explainers/svm/math-poster.jpg" },
          ]}
          note="The intuition video is the idea in under a minute. The math video works through the margin, the optimization and every number in the fitted model."
        />
        <P>
          <Link className="link" href="/blog/posts/logistic-regression-explained/">
            Logistic regression
          </Link>{" "}
          draws a boundary by making the training data as likely as possible. A support vector machine (SVM) asks a more geometric
          question: of all the lines that separate the two classes, which one leaves the biggest safety gap? The answer turns out to
          depend on only a handful of points, and that idea, together with kernels, made SVMs one of the most important classifiers
          of the 2000s.
        </P>
        <H2 id="how-it-works">How it works</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="math">The math of the street</H2>
        <P>A linear SVM scores each visitor with a weighted sum, just like a linear model:</P>
        <DM>{"f(\\mathbf{x}) = w_1 x_1 + w_2 x_2 + b"}</DM>
        <P>
          The boundary is where <M>{"f(\\mathbf{x}) = 0"}</M>. The two edges of the street are where <M>{"f(\\mathbf{x}) = +1"}</M> and{" "}
          <M>{"f(\\mathbf{x}) = -1"}</M>. Going from one edge to the other changes <M>{"f"}</M> by 2, and <M>{"f"}</M> changes fastest
          along <M>{"\\mathbf{w}"}</M>, at a rate of <M>{"\\|\\mathbf{w}\\|"}</M> per unit of distance. So the street is
        </P>
        <DM>{"\\text{width} = \\frac{2}{\\|\\mathbf{w}\\|}"}</DM>
        <P>
          wide. A wide street means a <em>small</em> <M>{"\\mathbf{w}"}</M>. If the classes could be separated perfectly, we'd ask for
          the smallest <M>{"\\mathbf{w}"}</M> that keeps every visitor on the correct side, at least one unit of <M>{"f"}</M> away from
          the boundary (with <M>{"y_i = \\pm 1"}</M>):
        </P>
        <DM>{"\\min_{\\mathbf{w},\\,b}\\ \\tfrac{1}{2}\\|\\mathbf{w}\\|^2 \\quad \\text{subject to} \\quad y_i\\, f(\\mathbf{x}_i) \\ge 1 \\ \\text{ for every } i"}</DM>
        <P>
          Our data has {wrong.length} visitors on the wrong side, so that problem has no solution. The <em>soft-margin</em> SVM swaps
          the hard rule for a penalty, the <strong>hinge loss</strong>, which is zero for visitors safely outside the street and grows
          linearly the further a visitor intrudes:
        </P>
        <DM>{"\\min_{\\mathbf{w},\\,b}\\ \\tfrac{1}{2}\\|\\mathbf{w}\\|^2 + C\\sum_{i=1}^{n} \\max\\big(0,\\ 1 - y_i\\, f(\\mathbf{x}_i)\\big)"}</DM>
        <P>
          The first term wants a wide street; the second wants few violations; <M>{"C"}</M> sets the exchange rate between them.
          Compare this with logistic regression, which uses the log loss <M>{"\\log(1 + e^{-y f})"}</M>: a smooth version of the
          hinge that never quite reaches zero, so in logistic regression every point keeps a little say.
        </P>

        <H2 id="numbers">Where the numbers come from</H2>
        <P>
          Solving that problem for our {N} visitors with <M>{"C = 1"}</M> gives
        </P>
        <DM>{`w_1 = ${f3(MODEL.w[0])}, \\quad w_2 = ${f3(MODEL.w[1])}, \\quad b = ${f3(MODEL.b)}`}</DM>
        <DM>{`\\|\\mathbf{w}\\| = \\sqrt{${f3(MODEL.w[0])}^2 + ${f3(MODEL.w[1])}^2} = ${f3(nw)}, \\qquad \\text{width} = \\frac{2}{${f3(nw)}} = ${f3(marginWidth(MODEL))}`}</DM>
        <P>
          Minutes on the page get about twice the weight of pages viewed. The total hinge loss is {hinge(MODEL).toFixed(2)}, and{" "}
          {Math.round(accuracy(MODEL) * 100)}% of the training visitors land on the correct side. Here is every visitor's{" "}
          <M>{"y_i f(\\mathbf{x}_i)"}</M>, closest to the boundary first. Anything at or below 1 is a support vector:
        </P>
        <SVTable />
        <P>
          The last column is the key to why only a few points matter. The solver actually works with one weight{" "}
          <M>{"\\alpha_i"}</M> per visitor, and the solution is a weighted sum of the visitors themselves:
        </P>
        <DM>{"\\mathbf{w} = \\sum_{i=1}^{n} \\alpha_i\\, y_i\\, \\mathbf{x}_i, \\qquad 0 \\le \\alpha_i \\le C"}</DM>
        <P>
          Visitors outside the street get <M>{"\\alpha_i = 0"}</M> and drop out of the sum entirely. Visitors exactly on the edge get a
          weight between 0 and <M>{"C"}</M>; visitors inside the street or on the wrong side hit the cap, <M>{"\\alpha_i = C"}</M>.
          Try it:
        </P>
      </Narrow>
      <RemovePlayground />
      <Narrow>
        <H2 id="predict">Predicting a new visitor</H2>
        <P>A new visitor spends 6 minutes on the page and views 7 pages. Their score is</P>
        <DM>{`f = ${f3(MODEL.w[0])}(6) + ${f3(MODEL.w[1])}(7) ${f3(MODEL.b)} = ${fN.toFixed(2)}`}</DM>
        <P>
          Positive, so the SVM predicts <strong>buy</strong>. But it's below 1, so the visitor sits inside the street, about{" "}
          {(fN / nw).toFixed(2)} units from the boundary (<M>{`${fN.toFixed(2)} / ${f3(nw)}`}</M>). Unlike logistic regression, the score
          isn't a probability. It's a signed distance in disguise. If you need probabilities, they have to be fitted on top
          (scikit-learn's <code>probability=True</code> does this with an extra cross-validated step).
        </P>
        <div className="mx-auto max-w-md rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark p-2">
          <SvmPlot model={MODEL} rings={SV} star />
        </div>

        <H2 id="c">Choosing C</H2>
        <P>
          With <M>{"C = 0.05"}</M> the street widens from {marginWidth(MODEL).toFixed(2)} to {marginWidth(small).toFixed(2)} and{" "}
          {supportVectors(small).length} visitors become support vectors (up from {SV.length}). Small <M>{"C"}</M> is like strong
          regularization: a simpler, more stable boundary that tolerates some training errors. Large <M>{"C"}</M> chases every training
          point. There's no formula for the right value; pick it with cross-validation, usually on a log grid such as 0.01, 0.1, 1,
          10, 100.
        </P>

        <H2 id="kernels">Beyond straight lines: the kernel trick</H2>
        <P>
          The weighted-sum form above has a useful consequence. Both training and prediction only ever need dot products between
          visitors, <M>{"\\mathbf{x}_i \\cdot \\mathbf{x}_j"}</M>. Replace that dot product with a <em>kernel</em>, a similarity
          function, and the SVM draws a straight street in a richer space without ever computing that space. The most popular is
          the RBF (Gaussian) kernel:
        </P>
        <DM>{"K(\\mathbf{x}, \\mathbf{z}) = \\exp\\!\\big(-\\gamma\\,\\|\\mathbf{x} - \\mathbf{z}\\|^2\\big)"}</DM>
        <P>
          With it, boundaries can curve around clusters. <M>{"\\gamma"}</M> controls how far each point's influence reaches: large{" "}
          <M>{"\\gamma"}</M> gives wiggly, overfit boundaries, small <M>{"\\gamma"}</M> gives smooth ones. Tune <M>{"C"}</M> and{" "}
          <M>{"\\gamma"}</M> together.
        </P>

        <H2 id="careful">When to be careful</H2>
        <UL>
          <li>
            <strong>Scale your features.</strong> The street's width is measured in the features' units. If one feature is in seconds
            and another in thousands of dollars, the larger one dominates. Standardize first (<code>StandardScaler</code>).
          </li>
          <li>
            <strong>No probabilities out of the box.</strong> The score is a distance, not a probability.
          </li>
          <li>
            <strong>Slow on big data.</strong> Kernel SVMs scale between roughly <M>{"n^2"}</M> and <M>{"n^3"}</M> in the number of
            rows. Beyond about 100,000 rows, use a linear SVM (<code>LinearSVC</code>) or gradient-boosted trees.
          </li>
          <li>
            <strong>Two classes at heart.</strong> Multi-class problems are handled by training one SVM per pair of classes (or one per
            class), which libraries do for you.
          </li>
          <li>
            <strong>Where they shine:</strong> small to medium datasets with many features, such as text classification, where a
            linear SVM is still a strong baseline.
          </li>
        </UL>

        <H2 id="code">In code</H2>
        <Code>{`import numpy as np
from sklearn.svm import SVC

X = np.array([${Y.map((_, i) => `[${X1[i]}, ${X2[i]}]`).join(", ")}])
y = np.array([${Y.join(", ")}])

svm = SVC(kernel="linear", C=1).fit(X, y)
print(svm.coef_, svm.intercept_)        # [[0.810 0.414]] [-6.881]
print(svm.n_support_)                   # [3 3]  -> 6 support vectors
print(svm.decision_function([[6, 7]]))  # [0.877] -> buy, inside the street

# For real data: scale first, and tune C (and gamma for the RBF kernel)
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
model = make_pipeline(StandardScaler(), SVC(kernel="rbf", C=1, gamma="scale"))`}</Code>

        <H2 id="further">Further reading</H2>
        <UL>
          <li>
            <a className="link" href="https://www.statlearning.com/" target="_blank" rel="noopener noreferrer">
              An Introduction to Statistical Learning
            </a>
            , chapter 9: support vector machines.
          </li>
          <li>
            <a className="link" href="https://scikit-learn.org/stable/modules/svm.html" target="_blank" rel="noopener noreferrer">
              scikit-learn: Support Vector Machines
            </a>
            : the practical reference, including scaling and complexity.
          </li>
          <li>
            <a className="link" href="https://www.csie.ntu.edu.tw/~cjlin/papers/guide/guide.pdf" target="_blank" rel="noopener noreferrer">
              A Practical Guide to Support Vector Classification
            </a>
            : the LIBSVM authors' short guide to scaling and tuning.
          </li>
        </UL>
        <p className="mt-10 text-sm italic text-gray-600 dark:text-gray-400">Part of a series explaining one data science concept at a time. The data is synthetic.</p>
      </Narrow>
    </Wide>
  );
};

export default SVMStory;
