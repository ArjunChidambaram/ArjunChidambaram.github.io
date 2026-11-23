import Link from "next/link";

import { H2, Narrow, P, Scrolly, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { SqlBlock, SqlPlayground, type Saved } from "@/components/sql/SqlBlock";
import { C, Dialect, Exercise, Gotcha, MiniTable, SeriesNav, type MiniRow } from "@/components/sql/SqlKit";
import R from "lib/sql/results/09-sets-pivot.json";

/** SQL series, part 9: set operations, pivoting and conditional aggregation. */

const Q = R as Record<string, Saved>;
const NB = ["Ava", "Liam", "Noah", "Emma"];
const DB = ["Liam", "Noah", "Mia"];
const LONG: MiniRow[] = [
  ["Nov", "web", 46],
  ["Nov", "app", 27],
  ["Nov", "store", 9],
  ["Dec", "web", 42],
  ["Dec", "app", 34],
  ["Dec", "store", 13],
];

const Sql09Story: React.FC = () => {
  const all: MiniRow[] = [...NB.map((n) => [n, "November"]), ...DB.map((n) => [n, "December"])];
  const steps: Step[] = [
    {
      key: "union-all",
      body: (
        <>
          <strong>UNION ALL stacks.</strong> Two queries with the same columns, one on top of the other: November buyers, then December
          buyers. Liam and Noah appear twice because they bought in both months.
        </>
      ),
    },
    {
      key: "union",
      body: (
        <>
          <strong>UNION stacks and dedupes.</strong> Same thing, then duplicate rows are removed: each customer once.
        </>
      ),
    },
    {
      key: "intersect",
      body: (
        <>
          <strong>INTERSECT and EXCEPT compare.</strong> <C>INTERSECT</C> keeps rows that appear in both results (bought in both months);{" "}
          <C>EXCEPT</C> keeps rows of the first that aren&apos;t in the second (bought in November but not December).
        </>
      ),
    },
    {
      key: "pivot",
      body: (
        <>
          <strong>Pivoting turns rows into columns.</strong> A &quot;long&quot; result with one row per month and channel becomes a
          &quot;wide&quot; one with a row per month and a column per channel: easier to read as a report.
        </>
      ),
    },
  ];
  const chartFor = (s: number) => {
    if (s === 0) return <MiniTable cols={["customer", "source"]} rows={all} state={all.map((r, i) => (i >= NB.length && NB.includes(r[0] as string) ? "unknown" : null))} sql={"SELECT customer FROM nov_buyers\nUNION ALL\nSELECT customer FROM dec_buyers;"} />;
    if (s === 1) return <MiniTable cols={["customer"]} rows={[...NB, "Mia"].map((n) => [n])} sql={"SELECT customer FROM nov_buyers\nUNION\nSELECT customer FROM dec_buyers;"} />;
    if (s === 2)
      return (
        <div className="grid grid-cols-2 gap-3">
          <MiniTable cols={["customer"]} rows={NB.filter((n) => DB.includes(n)).map((n) => [n])} sql={"-- INTERSECT\nbought in both"} />
          <MiniTable cols={["customer"]} rows={NB.filter((n) => !DB.includes(n)).map((n) => [n])} sql={"-- EXCEPT\nNovember only"} />
        </div>
      );
    return (
      <div className="grid grid-cols-[2fr_3fr] gap-3">
        <MiniTable cols={["month", "channel", "orders"]} rows={LONG} sql="long" />
        <MiniTable
          cols={["month", "web", "app", "store"]}
          rows={[
            ["Nov", 46, 27, 9],
            ["Dec", 42, 34, 13],
          ]}
          sql="wide"
        />
      </div>
    );
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:48", src: "/explainers/sql-09/intuition.mp4", poster: "/explainers/sql-09/intuition-poster.jpg", square: true },
            { key: "steps", label: "Step by step", len: "1:40", src: "/explainers/sql-09/steps.mp4", poster: "/explainers/sql-09/steps-poster.jpg" },
          ]}
          note="The intuition video shows the four set operations and a pivot. The step-by-step video builds a pivot from CASE expressions, row by row."
        />
        <P>
          JOINs combine tables side by side, matching rows on keys. This post covers combining results <em>vertically</em> with set operations
          (UNION, INTERSECT, EXCEPT), and reshaping results between long and wide formats with pivots, the two moves behind most report-style
          queries. It&apos;s part 9 of the SQL series and leans on <Link className="link" href="/blog/posts/sql-group-by-explained/">conditional
          aggregation</Link> from part 3.
        </P>
        <H2 id="how-it-works">Stacking and reshaping</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="union">UNION ALL and UNION</H2>
        <P>
          <C>UNION ALL</C> appends the rows of one query to another. A single contact list of customers and staff, with a column saying which is
          which:
        </P>
        <SqlBlock q={Q.union_all} />
        <P>
          <C>UNION</C> also removes duplicate rows. States of customers in three Texan cities: plain UNION gives one row, UNION ALL gives one per
          customer:
        </P>
        <SqlBlock q={Q.union_dedupe} />
        <SqlBlock q={Q.union_all_dupes} max={5} />
        <P>
          The two queries must have the same number of columns, with compatible types:
        </P>
        <SqlBlock q={Q.union_mismatch} />
        <P>
          Columns are matched <strong>by position, not by name</strong>, and the result takes its column names from the first query. Nothing
          stops you from stacking a job title under a first name:
        </P>
        <SqlBlock q={Q.union_positional} />
        <P>
          An ORDER BY at the end sorts the whole combined result. UNION ALL is handy for gluing several one-row summaries into a small report:
        </P>
        <SqlBlock q={Q.union_order} />
        <Gotcha>
          Default to <C>UNION ALL</C>. Plain UNION has to sort or hash everything to find duplicates, which is slower, and it can silently drop
          rows you meant to keep (two genuinely different orders with identical values, say).
        </Gotcha>

        <H2 id="intersect-except">INTERSECT and EXCEPT</H2>
        <P>Customers who ordered in both November and December:</P>
        <SqlBlock q={Q.intersect} />
        <P>Customers who ordered in November but not in December, candidates for a win-back email:</P>
        <SqlBlock q={Q.except} max={6} />
        <P>All three slices at once, as counts:</P>
        <SqlBlock q={Q.set_counts} />
        <P>
          Like UNION, INTERSECT and EXCEPT remove duplicates (add <C>ALL</C> to keep them, where supported), and they treat NULLs as equal to
          each other. That makes EXCEPT a NULL-safe alternative to the NOT IN trap from part 5.
        </P>
        <Dialect>
          Oracle calls EXCEPT <C>MINUS</C>. MySQL added INTERSECT and EXCEPT only in 8.0.31. BigQuery requires the explicit forms{" "}
          <C>UNION DISTINCT</C>, <C>INTERSECT DISTINCT</C> and <C>EXCEPT DISTINCT</C>.
        </Dialect>

        <H2 id="long-wide">Long vs wide</H2>
        <P>
          GROUP BY on two columns produces <strong>long</strong> data: one row per combination. It&apos;s the best shape for further SQL and
          for charting tools:
        </P>
        <SqlBlock q={Q.long} />
        <P>
          People reading a report usually prefer <strong>wide</strong> data: one row per month, one column per channel. Turning long into
          wide is a pivot.
        </P>

        <H2 id="pivot">Pivoting with conditional aggregation</H2>
        <P>
          The portable way to pivot is one aggregate per output column, each with a condition. It works in every SQL database:
        </P>
        <SqlBlock q={Q.pivot_case} />
        <P>
          With <C>SUM(CASE ... THEN value ELSE 0 END)</C> you can pivot amounts, not just counts. Revenue per category and channel:
        </P>
        <SqlBlock q={Q.pivot_sum_case} />
        <P>
          Some databases have a <C>PIVOT</C> keyword that discovers the column values for you. DuckDB&apos;s version:
        </P>
        <SqlBlock q={Q.pivot_keyword} />
        <Dialect>
          PIVOT syntax differs between DuckDB, Snowflake, SQL Server, Oracle and BigQuery, and most require you to list the values (
          <C>IN (&apos;web&apos;, &apos;app&apos;, &apos;store&apos;)</C>). PostgreSQL and MySQL have no PIVOT (PostgreSQL&apos;s{" "}
          <C>crosstab</C> extension is the closest). The conditional-aggregation pattern works everywhere, so learn that one first.
        </Dialect>

        <H2 id="unpivot">Unpivoting</H2>
        <P>Going from wide back to long. DuckDB&apos;s UNPIVOT:</P>
        <SqlBlock q={Q.unpivot} />
        <P>The portable version stacks one SELECT per column with UNION ALL:</P>
        <SqlBlock q={Q.unpivot_union} />

        <H2 id="grouping-sets">Several groupings at once: GROUPING SETS</H2>
        <P>
          <C>GROUPING SETS</C> computes several GROUP BYs in one query and stacks them, like a UNION ALL of GROUP BYs: totals by channel, by
          status, and overall. <C>GROUPING()</C> tells you which level a row belongs to, which matters because the NULLs it adds are
          indistinguishable from real NULLs otherwise:
        </P>
        <SqlBlock q={Q.grouping_sets} />

        <H2 id="full-join">Emulating FULL OUTER JOIN</H2>
        <P>
          MySQL has no FULL OUTER JOIN. A LEFT JOIN plus the unmatched rows of the right table, glued with UNION ALL, gives the same result as
          the FULL JOIN in part 4:
        </P>
        <SqlBlock q={Q.full_outer_emulate} />

        <H2 id="practice">Practice</H2>
        <Exercise n={1} q="Make one list containing every fitness product and every category name, with a column saying which is which." answer={Q.ex1} />
        <Exercise n={2} q="Which logged-in customers have visited from a tablet but never from a desktop?" hint={<>EXCEPT, and filter out anonymous (NULL) sessions.</>} answer={Q.ex2} />
        <Exercise n={3} q="Make a table of sessions with one row per device and one column per traffic source." answer={Q.ex3} />
        <SqlPlayground start={"SELECT\n  segment,\n  COUNT(*) FILTER (WHERE state = 'TX') AS tx,\n  COUNT(*) FILTER (WHERE state = 'CA') AS ca,\n  COUNT(*) AS all_states\nFROM customers\nGROUP BY segment;"} />

        <H2 id="recap">Recap</H2>
        <UL>
          <li>UNION ALL stacks results; UNION also removes duplicates; INTERSECT and EXCEPT compare them.</li>
          <li>Set operations match columns by position; names come from the first query.</li>
          <li>Pivot (long → wide) with one conditional aggregate per column, or a PIVOT keyword where available.</li>
          <li>Unpivot (wide → long) with UNPIVOT or UNION ALL.</li>
          <li>GROUPING SETS / ROLLUP compute several levels of totals in one query.</li>
        </UL>
        <P>Next: recursive queries for hierarchies and sequences.</P>
        <SeriesNav current={9} />
        <p className="mt-6 text-sm italic text-gray-600 dark:text-gray-400">
          The store data is synthetic. Queries run in your browser with DuckDB-WASM; changes are rolled back after each run.
        </p>
      </Narrow>
    </Wide>
  );
};

export default Sql09Story;
