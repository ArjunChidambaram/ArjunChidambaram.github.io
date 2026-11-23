import Link from "next/link";

import { H2, Narrow, P, Scrolly, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { SqlBlock, SqlPlayground, type Saved } from "@/components/sql/SqlBlock";
import { C, Dialect, Exercise, Gotcha, MiniTable, SeriesNav, type MiniRow } from "@/components/sql/SqlKit";
import R from "lib/sql/results/07-window-frames.json";

/** SQL series, part 7: LAG/LEAD, running totals, moving averages and frames. */

const Q = R as Record<string, Saved>;
const D: [string, number][] = [
  ["Dec 1", 13.98],
  ["Dec 2", 254.96],
  ["Dec 3", 392.7],
  ["Dec 4", 530.04],
  ["Dec 5", 434.54],
  ["Dec 6", 181.43],
  ["Dec 7", 354.92],
  ["Dec 8", 312.43],
];
const f2 = (x: number) => x.toFixed(2);
const BASE: MiniRow[] = D.map((r) => [r[0], f2(r[1])]);

const Sql07Story: React.FC = () => {
  let run = 0;
  const running = D.map((r) => f2((run += r[1])));
  const avg3 = D.map((_, i) => {
    const s = D.slice(Math.max(0, i - 2), i + 1);
    return f2(s.reduce((a, r) => a + r[1], 0) / s.length);
  });
  const steps: Step[] = [
    {
      key: "lag",
      body: (
        <>
          <strong>LAG looks back.</strong> <C>LAG(revenue) OVER (ORDER BY day)</C> fetches revenue from the previous row in day order. The
          first row has no previous row, so it gets NULL.
        </>
      ),
    },
    {
      key: "change",
      body: (
        <>
          <strong>Compare with the day before.</strong> Now day-over-day change is just <C>revenue - LAG(revenue)</C>. <C>LEAD</C> is the
          mirror image, looking forward.
        </>
      ),
    },
    {
      key: "running",
      body: (
        <>
          <strong>Running totals.</strong> Give SUM an ordered window and it adds up all rows from the start through the current one:
          month-to-date revenue in one line.
        </>
      ),
    },
    {
      key: "moving",
      body: (
        <>
          <strong>Moving averages.</strong> A <em>frame</em> narrows the window: <C>ROWS BETWEEN 2 PRECEDING AND CURRENT ROW</C> averages the
          current day and the two before, sliding down the table.
        </>
      ),
    },
  ];
  const chartFor = (s: number) => {
    if (s === 0)
      return <MiniTable cols={["day", "revenue"]} rows={BASE} extra={{ head: "LAG(revenue)", vals: D.map((_, i) => (i ? f2(D[i - 1][1]) : "NULL")) }} sql={"SELECT day, revenue,\n  LAG(revenue) OVER (ORDER BY day)\nFROM daily;"} />;
    if (s === 1)
      return (
        <MiniTable
          cols={["day", "revenue"]}
          rows={BASE}
          extra={{ head: "change", vals: D.map((r, i) => (i ? (r[1] - D[i - 1][1] >= 0 ? "+" : "") + f2(r[1] - D[i - 1][1]) : "NULL")) }}
          sql={"SELECT day, revenue,\n  revenue - LAG(revenue) OVER (ORDER BY day)\nFROM daily;"}
        />
      );
    if (s === 2) return <MiniTable cols={["day", "revenue"]} rows={BASE} extra={{ head: "running total", vals: running }} sql={"SELECT day, revenue,\n  SUM(revenue) OVER (ORDER BY day)\nFROM daily;"} />;
    return (
      <MiniTable
        cols={["day", "revenue"]}
        rows={BASE}
        state={D.map((_, i) => (i >= 3 && i <= 5 ? (i === 5 ? "keep" : "unknown") : null))}
        extra={{ head: "avg of 3 rows", vals: avg3 }}
        sql={"SELECT day, revenue,\n  AVG(revenue) OVER (ORDER BY day\n    ROWS BETWEEN 2 PRECEDING\n         AND CURRENT ROW)\nFROM daily;"}
      />
    );
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:48", src: "/explainers/sql-07/intuition.mp4", poster: "/explainers/sql-07/intuition-poster.jpg", square: true },
            { key: "steps", label: "Step by step", len: "1:40", src: "/explainers/sql-07/steps.mp4", poster: "/explainers/sql-07/steps-poster.jpg" },
          ]}
          note="The intuition video shows LAG, running totals and moving averages in under a minute. The step-by-step video animates window frames and the default-frame trap."
        />
        <P>
          <Link className="link" href="/blog/posts/sql-window-functions-ranking-explained/">Part 6</Link> introduced window functions with
          ranking. This post is about the other half: looking at neighbouring rows with <C>LAG</C> and <C>LEAD</C>, and controlling exactly
          which rows an aggregate sees with <strong>frames</strong>, which is how you build running totals, moving averages and
          period-over-period comparisons, the bread and butter of analytics dashboards.
        </P>
        <P>
          Most examples use a small CTE called <C>daily</C>: completed-order revenue per day in December 2025.
        </P>
        <SqlBlock q={Q.daily} />
        <H2 id="how-it-works">Looking sideways along ordered rows</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="lag-lead">LAG and LEAD</H2>
        <P>
          <C>LAG(x)</C> returns x from the previous row in the window&apos;s order; <C>LEAD(x)</C> from the next. They need an ORDER BY in OVER
          (&quot;previous&quot; means nothing without one):
        </P>
        <SqlBlock q={Q.lag_lead} />
        <P>Month-over-month growth, the classic use:</P>
        <SqlBlock q={Q.lag_pct} />
        <P>
          Both take an offset and a default: <C>LAG(x, 3)</C> looks three rows back, and <C>LAG(x, 1, 0)</C> returns 0 instead of NULL when there
          is no such row:
        </P>
        <SqlBlock q={Q.lag_default} />
        <P>
          With PARTITION BY, &quot;previous&quot; means previous within the same group. Days between each customer&apos;s consecutive orders
          (subtracting two dates gives days in DuckDB and PostgreSQL):
        </P>
        <SqlBlock q={Q.days_between} />
        <P>Aggregated across everyone, it describes how often customers come back:</P>
        <SqlBlock q={Q.gap_stats} />
        <P>
          The mean (41 days) is more than double the median (19): a few long gaps pull the average up, the same skew we met in the{" "}
          <Link className="link" href="/blog/posts/central-limit-theorem-explained/">central limit theorem</Link> post.
        </P>

        <H2 id="running">Running totals</H2>
        <P>An aggregate with an ORDER BY in its window becomes cumulative:</P>
        <SqlBlock q={Q.running} />
        <P>Add PARTITION BY and the total resets for each group: quarter-to-date next to year-to-date:</P>
        <SqlBlock q={Q.running_reset} />

        <H2 id="frames">Frames</H2>
        <P>
          A frame clause says exactly which rows, relative to the current row, the function sees. The syntax is{" "}
          <C>ROWS BETWEEN start AND end</C>, where each bound is one of <C>UNBOUNDED PRECEDING</C>, <C>n PRECEDING</C>, <C>CURRENT ROW</C>,{" "}
          <C>n FOLLOWING</C> or <C>UNBOUNDED FOLLOWING</C>. A running total is <C>UNBOUNDED PRECEDING AND CURRENT ROW</C>; a trailing 7-row
          average is <C>6 PRECEDING AND CURRENT ROW</C>; a centered 3-month average is <C>1 PRECEDING AND 1 FOLLOWING</C>:
        </P>
        <SqlBlock q={Q.centered} />

        <H2 id="default-frame">The default frame trap</H2>
        <P>
          When you write ORDER BY in OVER but no frame, the default is <C>RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</C>. RANGE treats all
          rows with the same ORDER BY value (<em>peers</em>) as one unit, so tied rows all get the same running value:
        </P>
        <SqlBlock q={Q.range_vs_rows} max={9} />
        <P>
          The default <C>RANGE</C> count is 6 for every Dec 19 order. With <C>ROWS</C>, or a unique ORDER BY, it counts one row at a time.
          For daily totals (one row per day) both agree, but on raw event tables the difference produces wrong running totals.
        </P>
        <P>
          The same default bites <C>LAST_VALUE</C>: the frame ends at the current row, so &quot;last value&quot; is just the current row. Widen the
          frame to the whole partition:
        </P>
        <SqlBlock q={Q.first_last} />
        <Gotcha>
          Any time you use an ordered aggregate window (running SUM, COUNT, LAST_VALUE), write the frame explicitly. It documents intent and
          avoids the RANGE-peers surprise.
        </Gotcha>

        <H2 id="moving">Moving averages and missing days</H2>
        <P>
          A 7-day moving average looks like <C>ROWS BETWEEN 6 PRECEDING AND CURRENT ROW</C>. But ROWS counts <em>rows</em>, and days with no
          completed orders have no row. November 5–7 are missing below, so the &quot;7 rows&quot; before November 8 actually reach back to
          November 1:
        </P>
        <SqlBlock q={Q.moving_avg} />
        <P>
          The robust fix is a complete calendar: generate every date, LEFT JOIN the data, and fill gaps with 0 (the CROSS JOIN idea from part
          4):
        </P>
        <SqlBlock q={Q.moving_avg_days} />
        <P>
          Alternatively, a RANGE frame with an interval measures distance in days rather than rows:
        </P>
        <SqlBlock q={Q.range_interval} />
        <Dialect>
          <C>generate_series</C> exists in PostgreSQL and DuckDB; BigQuery has <C>GENERATE_DATE_ARRAY</C> with <C>UNNEST</C>; Snowflake uses{" "}
          <C>GENERATOR</C>; SQL Server and MySQL use a recursive CTE (part 10) or a calendar table. <C>RANGE</C> with an interval works in
          PostgreSQL 11+, DuckDB and Oracle; SQL Server only supports <C>RANGE UNBOUNDED / CURRENT ROW</C>.
        </Dialect>

        <H2 id="pareto">Cumulative share: the Pareto view</H2>
        <P>
          A running total divided by the grand total gives a cumulative percentage. Five products (of 22) bring in half of all revenue:
        </P>
        <SqlBlock q={Q.pareto} />

        <H2 id="practice">Practice</H2>
        <Exercise n={1} q="Count orders per week since October and show the change from the previous week." hint={<>date_trunc(&apos;week&apos;, ...) then LAG.</>} answer={Q.ex1} />
        <Exercise n={2} q="For customer 9, number each order and keep a running count." answer={Q.ex2} />
        <Exercise
          n={3}
          q="How many customers placed their first order each month, and how many customers have ordered in total by then?"
          hint={<>MIN(order_date) per customer, count per month, then a running SUM.</>}
          answer={Q.ex3}
        />
        <SqlPlayground start={"SELECT\n  order_date,\n  COUNT(*) AS orders,\n  SUM(COUNT(*)) OVER (ORDER BY order_date) AS running_orders\nFROM orders\nGROUP BY order_date\nORDER BY order_date\nLIMIT 10;"} />

        <H2 id="recap">Recap</H2>
        <UL>
          <li>LAG / LEAD read the previous / next row (optionally n rows away, with a default).</li>
          <li>An ordered aggregate window is cumulative; PARTITION BY resets it.</li>
          <li>Frames (ROWS BETWEEN …) define running totals, moving averages and centered averages.</li>
          <li>The default frame is RANGE … CURRENT ROW: tied rows share values, and LAST_VALUE returns the current row.</li>
          <li>ROWS counts rows, not days: fill missing dates with a calendar.</li>
        </UL>
        <P>Next: working with dates, strings and messy data.</P>
        <SeriesNav current={7} />
        <p className="mt-6 text-sm italic text-gray-600 dark:text-gray-400">
          The store data is synthetic. Queries run in your browser with DuckDB-WASM; changes are rolled back after each run.
        </p>
      </Narrow>
    </Wide>
  );
};

export default Sql07Story;
