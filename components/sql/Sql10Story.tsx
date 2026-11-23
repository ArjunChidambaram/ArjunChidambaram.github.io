import Link from "next/link";

import { H2, Narrow, P, Scrolly, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { SqlBlock, SqlPlayground, type Saved } from "@/components/sql/SqlBlock";
import { C, Dialect, Exercise, Gotcha, MiniTable, SchemaRef, SeriesNav, type MiniRow } from "@/components/sql/SqlKit";
import R from "lib/sql/results/10-recursive.json";

/** SQL series, part 10: recursive CTEs, hierarchies, generated sequences, gaps and islands. */

const Q = R as Record<string, Saved>;
const TEAM: MiniRow[] = [
  ["Priya Raman", "Dana Whitfield", 0],
  ["Elena Petrova", "Priya Raman", 1],
  ["Sam Okafor", "Priya Raman", 1],
  ["Jin Park", "Elena Petrova", 2],
  ["Olivia Brooks", "Elena Petrova", 2],
  ["Hannah Weiss", "Sam Okafor", 2],
  ["Ravi Shah", "Sam Okafor", 2],
  ["Nina Rossi", "Hannah Weiss", 3],
];
const DAYS: MiniRow[] = [
  ["Nov 1", 1, "Oct 31"],
  ["Nov 2", 2, "Oct 31"],
  ["Nov 3", 3, "Oct 31"],
  ["Nov 4", 4, "Oct 31"],
  ["Nov 7", 5, "Nov 2"],
  ["Nov 8", 6, "Nov 2"],
  ["Nov 10", 7, "Nov 3"],
  ["Nov 11", 8, "Nov 3"],
];
const TEAM_SQL =
  "WITH RECURSIVE team AS (\n  SELECT employee_id, name, 0 AS depth\n  FROM employees WHERE name = 'Priya Raman'\n  UNION ALL\n  SELECT e.employee_id, e.name, t.depth + 1\n  FROM employees e\n  JOIN team t ON e.manager_id = t.employee_id\n)\nSELECT * FROM team;";

const Sql10Story: React.FC = () => {
  const steps: Step[] = [
    {
      key: "anchor",
      body: (
        <>
          <strong>The anchor runs once.</strong> It finds the starting rows: here, Priya Raman, VP Technology. These rows are round 0.
        </>
      ),
    },
    {
      key: "round1",
      body: (
        <>
          <strong>The step joins to the previous round.</strong> It looks for employees whose <C>manager_id</C> is someone found in round 0.
          That&apos;s Elena and Sam: round 1.
        </>
      ),
    },
    {
      key: "round2",
      body: (
        <>
          <strong>Again, using only round 1&apos;s rows.</strong> Who reports to Elena or Sam? Four people. Rows from round 0 aren&apos;t
          looked at again, so nothing is found twice.
        </>
      ),
    },
    {
      key: "stop",
      body: (
        <>
          <strong>It stops when a round finds nothing.</strong> Round 3 finds Nina. Round 4 looks for Nina&apos;s reports, finds none, and the
          recursion ends. UNION ALL glues all the rounds into one result.
        </>
      ),
    },
    {
      key: "islands",
      body: (
        <>
          <strong>A related trick: gaps and islands.</strong> Number the days that had orders. Inside a run of consecutive days, the day and
          its row number both go up by one, so <C>day − row_number</C> stays constant. That constant labels each streak.
        </>
      ),
    },
  ];
  const chartFor = (s: number) => {
    if (s === 4)
      return (
        <MiniTable
          cols={["day", "row_number", "day − rn"]}
          rows={DAYS}
          state={DAYS.map((_, i) => (i < 4 ? "keep" : i < 6 ? "unknown" : null))}
          sql={"day - ROW_NUMBER() OVER (ORDER BY day)"}
        />
      );
    const maxDepth = [0, 1, 2, 3][s];
    const vis = TEAM.filter((r) => (r[2] as number) <= maxDepth);
    return (
      <MiniTable
        cols={["name", "manager", "depth"]}
        rows={vis}
        state={vis.map((r) => ((r[2] as number) === maxDepth ? "keep" : null))}
        sql={s === 3 ? TEAM_SQL + "\n-- round 4: nobody reports to Nina, 0 rows, stop" : TEAM_SQL}
      />
    );
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:48", src: "/explainers/sql-10/intuition.mp4", poster: "/explainers/sql-10/intuition-poster.jpg", square: true },
            { key: "steps", label: "Step by step", len: "1:40", src: "/explainers/sql-10/steps.mp4", poster: "/explainers/sql-10/steps-poster.jpg" },
          ]}
          note="The intuition video builds a sequence, a team and a set of streaks. The step-by-step video climbs a management chain one round at a time."
        />
        <P>
          Some questions have no fixed number of steps. Who are all the people under this manager? What&apos;s the full chain above this
          analyst? Every date in December, including days with no orders? A normal join goes exactly one level, so these need a query that keeps
          going until it runs out of rows: a <strong>recursive CTE</strong>. This is part 10 of the SQL series; it builds on{" "}
          <Link className="link" href="/blog/posts/sql-subqueries-ctes-explained/">CTEs</Link> from part 5 and{" "}
          <Link className="link" href="/blog/posts/sql-window-functions-ranking-explained/">window functions</Link> from parts 7 and 8.
        </P>
        <H2 id="how-it-works">Anchor, step, repeat</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="anatomy">The anatomy of a recursive CTE</H2>
        <P>The smallest useful example counts from 1 to 10:</P>
        <SqlBlock q={Q.count} max={10} />
        <P>Every recursive CTE has the same three parts:</P>
        <UL>
          <li>
            <strong>The anchor</strong> (<C>SELECT 1</C>): a normal query that runs once and produces the first rows.
          </li>
          <li>
            <strong>The recursive step</strong> (<C>SELECT n + 1 FROM numbers</C>): a query that refers to the CTE itself. Each time it runs,{" "}
            <C>numbers</C> means <em>only the rows produced by the previous round</em>, not everything so far.
          </li>
          <li>
            <strong>The stop</strong>: the process ends when the step returns no rows. Here that happens because of{" "}
            <C>WHERE n &lt; 10</C>: once n is 10, the step&apos;s filter removes it and nothing new comes out.
          </li>
        </UL>
        <P>
          <C>UNION ALL</C> joins the rounds together, and the column list after the CTE name (<C>numbers(n)</C>) names the columns. The anchor
          decides the column types, so if the step produces bigger numbers or longer strings than the anchor, cast the anchor to a wide enough
          type.
        </P>
        <Dialect>
          PostgreSQL, MySQL 8+, SQLite and DuckDB require the word <C>RECURSIVE</C>. SQL Server and Oracle use a plain <C>WITH</C> and detect
          recursion themselves. MySQL before 8.0 has no CTEs at all.
        </Dialect>

        <H2 id="sequences">Generating sequences and calendars</H2>
        <P>
          A classic reporting problem: GROUP BY only returns days that have rows, so days with zero orders silently disappear. Generate every
          date with recursion, then LEFT JOIN the facts onto it:
        </P>
        <SqlBlock q={Q.calendar} />
        <P>
          December 24, 27 and 29 appear with 0. Without the generated calendar they&apos;d be missing, and a chart of daily orders would draw a
          straight line across the gap. Recursion can also compute step-by-step values, like a compounding growth projection from our 133
          customers who have ordered:
        </P>
        <SqlBlock q={Q.compound} />
        <Dialect>
          Many databases have a shortcut for sequences: <C>generate_series</C> in PostgreSQL and DuckDB, <C>GENERATE_DATE_ARRAY</C> with{" "}
          <C>UNNEST</C> in BigQuery, <C>GENERATE_SERIES</C> in SQL Server 2022+. They&apos;re faster and clearer; the recursive version is the
          one that works everywhere.
        </Dialect>

        <H2 id="hierarchies">Walking a hierarchy</H2>
        <P>
          The <C>employees</C> table stores the org chart the usual way: each row points at its manager with <C>manager_id</C>, and the CEO has
          NULL.
        </P>
        <SchemaRef only={["employees"]} />
        <SqlBlock q={Q.employees} max={15} />
        <P>
          <strong>Going up.</strong> Start at one person and repeatedly join to <em>their manager</em>: the step&apos;s join is{" "}
          <C>e.employee_id = c.manager_id</C>. The chain stops at the CEO, whose manager_id is NULL and so matches nobody:
        </P>
        <SqlBlock q={Q.chain_up} />
        <P>
          <strong>Going down.</strong> Start at the top and repeatedly join to <em>their reports</em>: the join flips to{" "}
          <C>e.manager_id = o.employee_id</C>. Carrying a <C>path</C> string along gives a sort key that keeps each team under its manager,
          and the depth drives the indentation:
        </P>
        <SqlBlock q={Q.org_down} max={15} />
        <P>Start the anchor somewhere else and you get a subtree: everyone in Priya&apos;s organization, with their distance from her:</P>
        <SqlBlock q={Q.subtree} />
        <P>
          A more advanced pattern: generate every (manager, person below them) pair at any distance, then count. This answers &quot;how big is
          each manager&apos;s whole organization&quot;, not just their direct reports:
        </P>
        <SqlBlock q={Q.headcount} />
        <P>
          The same shape handles any parent–child data: category trees, bill-of-materials (parts made of parts), threaded comments, folder
          structures, referral chains.
        </P>

        <H2 id="termination">Stopping, and not stopping</H2>
        <P>
          A recursive CTE ends only when a round produces zero rows. If the step can always produce something, the query runs until the
          database gives up or runs out of memory. Always make sure something shrinks: a filter on a counter, or data that eventually runs out
          (a tree has leaves). Doubling from 1 needs 21 rounds to pass a million:
        </P>
        <SqlBlock q={Q.guard} />
        <Gotcha>
          <strong>Cycles.</strong> Real hierarchies get bad data: A reports to B, B reports to A. Walking it with UNION ALL loops forever. Defend
          with a depth limit (<C>WHERE depth &lt; 50</C> in the step), or carry the visited path and stop when you see a repeat (
          <C>WHERE position(e.name IN o.path) = 0</C>). Using <C>UNION</C> instead of UNION ALL discards rows already produced, which stops a
          cycle only when the repeated rows are identical; a depth column makes them different, so don&apos;t rely on it.
        </Gotcha>
        <Dialect>
          SQL Server stops after 100 levels by default and raises an error; change it with <C>OPTION (MAXRECURSION n)</C> (0 means no limit).
          PostgreSQL 14+ has a <C>CYCLE</C> clause that tracks visited rows for you, and <C>SEARCH DEPTH FIRST</C> / <C>BREADTH FIRST</C> for
          ordering. Oracle also has its older <C>CONNECT BY PRIOR</C> syntax, which you&apos;ll still see in legacy code.
        </Dialect>

        <H2 id="gaps-islands">Gaps and islands</H2>
        <P>
          A close cousin of recursive problems: finding <strong>runs</strong> of consecutive values (islands) and the holes between them (gaps).
          Login streaks, consecutive days with sales, uninterrupted subscription periods. You could recurse day by day, but a window function
          does it in one pass.
        </P>
        <P>
          The trick: number the days in order with <C>ROW_NUMBER()</C> and subtract that number from the date. Within a streak, both go up by
          one each row, so the difference is constant. After a gap, the date jumps more than the row number does, and the difference changes:
        </P>
        <SqlBlock q={Q.islands_days} />
        <P>Group by that constant and each group is one streak:</P>
        <SqlBlock q={Q.islands} />
        <P>
          Orders came in every day from November 20 to December 23, a 34-day run. <strong>Gaps</strong> are easier still: <C>LEAD</C> gives the
          next date, and the difference minus one is the number of empty days in between:
        </P>
        <SqlBlock q={Q.gaps} />
        <Dialect>
          Date minus integer works in DuckDB and PostgreSQL. In SQL Server use <C>DATEADD(day, -ROW_NUMBER() OVER (...), day)</C>; in MySQL{" "}
          <C>DATE_SUB(day, INTERVAL rn DAY)</C>; for plain integers (IDs, sequence numbers) subtraction works everywhere. Deduplicate first:
          two rows on the same day would break the count, which is why the queries start with <C>SELECT DISTINCT</C>.
        </Dialect>

        <H2 id="practice">Practice</H2>
        <Exercise n={1} q="List everyone above Mateo Silva, the warehouse associate, up to the CEO." answer={Q.ex1} />
        <Exercise
          n={2}
          q="Count orders per week (weeks starting Monday, Nov 3 to Dec 22), including any weeks with zero orders."
          hint={<>Generate the week starts by adding 7 days, then LEFT JOIN orders that fall in each week.</>}
          answer={Q.ex2}
        />
        <Exercise
          n={3}
          q="Which logged-in customers had the longest streaks of consecutive days with a session?"
          hint={<>Gaps and islands with PARTITION BY customer_id.</>}
          answer={Q.ex3}
        />
        <SqlPlayground start={"WITH RECURSIVE chain AS (\n  SELECT employee_id, name, manager_id, 0 AS level\n  FROM employees WHERE name = 'Jin Park'\n  UNION ALL\n  SELECT e.employee_id, e.name, e.manager_id, c.level + 1\n  FROM employees e JOIN chain c ON e.employee_id = c.manager_id\n)\nSELECT level, name FROM chain;"} />

        <H2 id="recap">Recap</H2>
        <UL>
          <li>A recursive CTE is an anchor plus a step joined with UNION ALL; the step sees only the previous round&apos;s rows.</li>
          <li>It stops when a round returns no rows. Make sure something guarantees that, especially with messy data.</li>
          <li>Use it for sequences and calendars (then LEFT JOIN facts), and for walking parent–child hierarchies up or down.</li>
          <li>Gaps and islands: <C>value − ROW_NUMBER()</C> is constant within a run; LEAD finds the holes.</li>
        </UL>
        <P>Next: putting it all together with analytics patterns: funnels, retention cohorts and sessions.</P>
        <SeriesNav current={10} />
        <p className="mt-6 text-sm italic text-gray-600 dark:text-gray-400">
          The store data is synthetic. Queries run in your browser with DuckDB-WASM; changes are rolled back after each run.
        </p>
      </Narrow>
    </Wide>
  );
};

export default Sql10Story;
