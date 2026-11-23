import Link from "next/link";

import { H2, Narrow, P, Scrolly, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { SqlBlock, SqlPlayground, type Saved } from "@/components/sql/SqlBlock";
import { C, Dialect, Exercise, Gotcha, MiniTable, SchemaRef, SeriesNav, type MiniRow } from "@/components/sql/SqlKit";
import R from "lib/sql/results/11-analytics.json";

/** SQL series, part 11: analytics patterns (funnels, sessionization, cohorts, A/B tests, RFM). */

const Q = R as Record<string, Saved>;
const FUNNEL: MiniRow[] = [
  ["view_product", 1897, "100%"],
  ["add_to_cart", 825, "43%"],
  ["checkout", 473, "25%"],
  ["purchase", 322, "17%"],
];
const EV: MiniRow[] = [
  ["11-03 18:19", "26 h", 1, 3],
  ["11-03 18:20", "2 min", 0, 3],
  ["11-03 18:24", "4 min", 0, 3],
  ["11-04 17:36", "23 h", 1, 4],
  ["11-04 17:40", "5 min", 0, 4],
  ["11-04 17:47", "6 min", 0, 4],
];
const COH: MiniRow[] = [
  ["2025-09", 6, "0%", "33%", "33%"],
  ["2025-10", 11, "36%", "36%", null],
  ["2025-11", 20, "30%", null, null],
  ["2025-12", 21, null, null, null],
];
const AB: MiniRow[] = [
  ["A", 947, 157, "16.58%"],
  ["B", 950, 165, "17.37%"],
];

const Sql11Story: React.FC = () => {
  const steps: Step[] = [
    {
      key: "funnel",
      body: (
        <>
          <strong>Funnels: count who reaches each step.</strong> Every session views a product; 43% add to cart; 17% purchase. One
          conditional <C>COUNT(DISTINCT ...)</C> per step.
        </>
      ),
    },
    {
      key: "sessions",
      body: (
        <>
          <strong>Sessions: find the gaps.</strong> LAG gives each event&apos;s previous timestamp. A gap over 30 minutes flags a new
          session, and a running SUM of the flags numbers them.
        </>
      ),
    },
    {
      key: "cohorts",
      body: (
        <>
          <strong>Cohorts: group by when people started.</strong> Each customer belongs to the month of their first order. Retention is the
          share of a cohort that orders again 1, 2, 3 months later.
        </>
      ),
    },
    {
      key: "ab",
      body: (
        <>
          <strong>A/B tests: rates, then uncertainty.</strong> Conversion per variant is a GROUP BY. Whether the difference is real takes a
          z-score and a confidence interval, which are a few more lines of arithmetic.
        </>
      ),
    },
  ];
  const chartFor = (s: number) => {
    if (s === 0) return <MiniTable cols={["step", "sessions", "of top"]} rows={FUNNEL} sql={"COUNT(DISTINCT session_id)\n  FILTER (WHERE event_type = 'add_to_cart')"} />;
    if (s === 1)
      return (
        <MiniTable
          cols={["event_time", "gap", "new", "session"]}
          rows={EV}
          state={EV.map((r) => (r[2] === 1 ? "keep" : null))}
          sql={"new = gap > 30 min\nsession = SUM(new) OVER (ORDER BY event_time)"}
        />
      );
    if (s === 2) return <MiniTable cols={["cohort", "customers", "m1", "m2", "m3"]} rows={COH} sql={"-- NULL: that month hasn't happened yet"} />;
    return <MiniTable cols={["variant", "sessions", "converted", "rate"]} rows={AB} sql={"-- lift +0.79 pts, z = 0.46\n-- 95% CI: -2.59 to +4.17 pts"} />;
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:48", src: "/explainers/sql-11/intuition.mp4", poster: "/explainers/sql-11/intuition-poster.jpg", square: true },
            { key: "steps", label: "Step by step", len: "1:40", src: "/explainers/sql-11/steps.mp4", poster: "/explainers/sql-11/steps-poster.jpg" },
          ]}
          note="The intuition video runs through four patterns. The step-by-step video sessionizes one customer's clickstream, then builds cohorts and an A/B readout."
        />
        <P>
          The first ten parts were about the language. This one is about the questions a data analyst actually gets asked: where do users drop
          off, how many come back, did the experiment work. Each answer is a pattern you&apos;ll reuse with small changes for years, built
          entirely from pieces you already know: conditional aggregation (part 3), CTEs (part 5) and window functions (parts 6 and 7). This is
          part 11 of the SQL series.
        </P>
        <H2 id="how-it-works">Four patterns</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="event-data">Event data</H2>
        <P>
          Product analytics starts from an <strong>event log</strong>: one row per thing a user did, with a timestamp. Ours has 4,184 events
          across 1,897 sessions in November 2025:
        </P>
        <SchemaRef only={["sessions", "events", "experiment"]} />
        <SqlBlock q={Q.events_peek} />
        <P>Session 2 went all the way to a purchase; session 3 looked at one product and left. Most sessions look like session 3.</P>

        <H2 id="funnels">Funnels</H2>
        <P>
          A funnel counts how many units (sessions, users) reach each step. With one row per event, <C>COUNT(DISTINCT session_id)</C> with a
          FILTER per step does it in one pass. DISTINCT matters: a session that views five products should count once.
        </P>
        <SqlBlock q={Q.funnel} />
        <P>
          The long format is easier to read as a funnel, and window functions give both conversion views: share of the top, and share of the
          previous step. The biggest drop is from viewing to adding to cart:
        </P>
        <SqlBlock q={Q.funnel_long} />
        <P>Splitting by a dimension is one join and a GROUP BY away. Tablet sessions convert best, though there are few of them:</P>
        <SqlBlock q={Q.funnel_device} />
        <P>
          A <strong>strict</strong> funnel also requires the steps to happen in order: a purchase only counts if it came after a checkout,
          which came after a cart. Take each step&apos;s first timestamp per session and compare them. In this synthetic data every session
          follows the order, so the counts match; in real logs (back buttons, duplicate events, clock skew) they often don&apos;t:
        </P>
        <SqlBlock q={Q.funnel_strict} />

        <H2 id="sessionization">Sessionization</H2>
        <P>
          Our data already has session IDs, but many sources don&apos;t: server logs, payment events, app pings. Defining sessions yourself is
          a gaps-and-islands problem with a time threshold. First, look at the gaps for one customer:
        </P>
        <SqlBlock q={Q.sessionize_flags} />
        <P>
          A <C>new_session</C> flag is 1 on the first event and after any gap longer than 30 minutes. A running SUM of the flags turns them into
          session numbers, and a GROUP BY summarizes each one:
        </P>
        <SqlBlock q={Q.sessionize} />
        <Gotcha>
          30 minutes is a convention (Google Analytics uses it), not a law. Check the distribution of gaps in your data first; a bimodal gap
          histogram tells you where the natural threshold is. And remember that <C>PARTITION BY customer_id</C> only works for logged-in
          events. Anonymous traffic needs a device or cookie ID.
        </Gotcha>

        <H2 id="active-users">Active users</H2>
        <P>
          Daily active customers is a GROUP BY by day. Wrapping the aggregate in a window function smooths it with a 7-day moving average:
        </P>
        <SqlBlock q={Q.active} />
        <P>
          <strong>Weekly</strong> active customers is not the sum or average of daily ones: someone active on three days should count once. You
          need a distinct count over a sliding range, which a self-join onto the last 7 days does:
        </P>
        <SqlBlock q={Q.wau} />
        <Dialect>
          Most databases don&apos;t allow <C>COUNT(DISTINCT ...)</C> as a window function, which is why the self-join is the portable way.
          BigQuery and Snowflake have approximate distinct counts (<C>APPROX_COUNT_DISTINCT</C>, HyperLogLog sketches) that make this fast on
          huge tables.
        </Dialect>

        <H2 id="cohorts">Retention cohorts</H2>
        <P>
          A <strong>cohort</strong> is a group of customers who started at the same time. Following each cohort separately shows whether
          retention is improving, which a single overall number hides. Step one, each customer&apos;s cohort:
        </P>
        <SqlBlock q={Q.cohort_first} />
        <P>
          Step two, the age of every order relative to its customer&apos;s cohort, in months (<C>month_number</C> 0 is the first month), and
          the distinct customers active at each age:
        </P>
        <SqlBlock q={Q.cohorts} />
        <P>
          Step three, divide by the cohort size and pivot into the familiar retention table. Months that haven&apos;t happened yet are NULL,
          not 0: the December cohort can&apos;t have month-1 retention until January.
        </P>
        <SqlBlock q={Q.retention} max={12} />
        <Gotcha>
          These cohorts are small (6 to 21 customers), so a single customer moves a cell by 5 to 17 points. Don&apos;t read trends into noise:
          show cohort sizes next to percentages, and combine cohorts (by quarter, say) when they&apos;re small.
        </Gotcha>
        <P>A simpler retention view: how many customers order again at all, and how long they take:</P>
        <SqlBlock q={Q.repeat_gap} />

        <H2 id="ab-test">An A/B test in SQL</H2>
        <P>
          The <C>experiment</C> table assigns each session to variant A or B. The analysis unit is the session, so first build one row per
          session with a 0/1 outcome. The LEFT JOIN keeps sessions without any events as non-converting, and <C>BOOL_OR</C> asks &quot;did any
          event in this session match?&quot;:
        </P>
        <SqlBlock q={Q.ab_rates} />
        <P>
          B is 0.79 points higher. Is that real or noise? The two-proportion z-test and a 95% confidence interval are a few lines of arithmetic
          on the same numbers (the reasoning behind them is in the{" "}
          <Link className="link" href="/blog/posts/ab-testing-explained/">A/B testing post</Link>):
        </P>
        <SqlBlock q={Q.ab_test} />
        <P>
          z = 0.46 is far below 1.96, and the interval runs from −2.6 to +4.2 points: it includes zero, so this test can&apos;t tell the variants
          apart. With conversion around 17%, detecting a lift this small would take tens of thousands of sessions per variant.
        </P>
        <P>
          Before trusting any result, check the split itself. A <strong>sample ratio mismatch</strong> (say 52/48 when you planned 50/50)
          means assignment or logging is broken, and the comparison can&apos;t be trusted whatever it says:
        </P>
        <SqlBlock q={Q.srm} />
        <Dialect>
          SQL is good at the counts and the arithmetic. Many databases (DuckDB and PostgreSQL among them) have no built-in normal CDF for
          p-values, so compare z to 1.96 or move the counts into Python. The{" "}
          <Link className="link" href="/blog/posts/bootstrap-explained/">bootstrap</Link> is another option when the metric isn&apos;t a
          simple proportion.
        </Dialect>

        <H2 id="rfm">Customer segmentation: RFM</H2>
        <P>
          RFM scores customers on <strong>R</strong>ecency (days since last order), <strong>F</strong>requency (number of orders) and{" "}
          <strong>M</strong>onetary value (total spend). <C>NTILE(3)</C> from part 6 turns each into a 1 to 3 score; a CASE turns score
          combinations into named segments a marketing team can act on:
        </P>
        <SqlBlock q={Q.rfm} />
        <P>
          The 15 &quot;at risk&quot; customers ordered a few times but not for about five months: the obvious target for a win-back campaign.
        </P>

        <H2 id="practice">Practice</H2>
        <Exercise n={1} q="Which traffic source converts best? Show cart and purchase rates per source." answer={Q.ex1} />
        <Exercise
          n={2}
          q="Compare month-1 retention for consumer vs business customers (exclude the December cohort, whose month 1 hasn't happened)."
          hint={<>Reuse the cohort CTEs, then join customers for the segment.</>}
          answer={Q.ex2}
        />
        <Exercise
          n={3}
          q="Break the A/B test down by device. Does B win everywhere?"
          hint={<>Group the per-session table by device; conditional AVG per variant.</>}
          answer={Q.ex3}
        />
        <P>
          Exercise 3 is a lesson in itself: B looks better on mobile and worse on desktop and tablet. With subgroups this small, those
          differences are well within noise. Slicing a test many ways until something looks significant is how false discoveries happen; decide
          the segments before the test.
        </P>
        <SqlPlayground start={"SELECT s.source, s.device,\n  COUNT(DISTINCT e.session_id) AS sessions,\n  COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_type = 'purchase') AS purchases\nFROM events e\nJOIN sessions s USING (session_id)\nGROUP BY ALL\nORDER BY purchases DESC;"} />

        <H2 id="recap">Recap</H2>
        <UL>
          <li>Funnels: one conditional <C>COUNT(DISTINCT unit)</C> per step; compare timestamps for strict ordering.</li>
          <li>Sessionization: LAG for gaps, a 0/1 flag for new sessions, a running SUM to number them.</li>
          <li>Active users: distinct counts per period; rolling distinct counts need a self-join.</li>
          <li>Cohorts: first-activity month, months since, counts divided by cohort size; NULL for the future.</li>
          <li>A/B tests: one row per unit, rates per variant, then z and a confidence interval; check the split first.</li>
        </UL>
        <P>Next: creating tables, keys and constraints, changing data, and transactions.</P>
        <SeriesNav current={11} />
        <p className="mt-6 text-sm italic text-gray-600 dark:text-gray-400">
          The store data is synthetic. Queries run in your browser with DuckDB-WASM; changes are rolled back after each run.
        </p>
      </Narrow>
    </Wide>
  );
};

export default Sql11Story;
