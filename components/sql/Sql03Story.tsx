import Link from "next/link";

import { H2, Narrow, P, Scrolly, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { SqlBlock, SqlPlayground, type Saved } from "@/components/sql/SqlBlock";
import { C, Dialect, Exercise, Gotcha, MiniTable, SeriesNav, type MiniRow } from "@/components/sql/SqlKit";
import R from "lib/sql/results/03-group-by.json";

/** SQL series, part 3: aggregate functions, GROUP BY and HAVING. */

const Q = R as Record<string, Saved>;
const D: MiniRow[] = [
  [1001, "web", "completed", "3.49"],
  [1002, "app", "cancelled", "16.99"],
  [1003, "web", "completed", "62.48"],
  [1004, "web", "completed", "28.47"],
  [1005, "app", "returned", "99.39"],
  [1006, "app", "completed", "9.99"],
  [1007, "web", "cancelled", "138.99"],
  [1021, "store", "returned", "59.99"],
  [1027, "store", "completed", "59.96"],
];
const COLS = ["order_id", "channel", "status", "value"];
const ORDER = ["web", "app", "store"];
const GROUPED = [...D].sort((a, b) => ORDER.indexOf(a[1] as string) - ORDER.indexOf(b[1] as string));
const summary = (rows: MiniRow[]) =>
  ORDER.map((c) => {
    const g = rows.filter((r) => r[1] === c);
    return [c, g.length, g.reduce((a, r) => a + Number(r[3]), 0).toFixed(2)] as MiniRow;
  });

const Sql03Story: React.FC = () => {
  const noCancel = D.filter((r) => r[2] !== "cancelled");
  const sumAll = summary(D);
  const sumKept = summary(noCancel);
  const steps: Step[] = [
    {
      key: "rows",
      body: (
        <>
          <strong>Start with rows.</strong> Nine orders, each with a sales channel and a value. Questions like &quot;how much did each
          channel sell?&quot; are about groups of rows, not single rows.
        </>
      ),
    },
    {
      key: "group",
      body: (
        <>
          <strong>GROUP BY makes groups.</strong> <C>GROUP BY channel</C> gathers rows that share a channel. Each group will become exactly one
          row of output.
        </>
      ),
    },
    {
      key: "aggregate",
      body: (
        <>
          <strong>Aggregates summarize each group.</strong> <C>COUNT(*)</C> counts the group&apos;s rows and <C>SUM(value)</C> adds up its
          values. Nine rows in, three rows out.
        </>
      ),
    },
    {
      key: "where",
      body: (
        <>
          <strong>WHERE filters rows first.</strong> <C>WHERE status &lt;&gt; &apos;cancelled&apos;</C> removes two orders <em>before</em>{" "}
          grouping, so they never reach a group. Web drops from 4 orders to 3.
        </>
      ),
    },
    {
      key: "having",
      body: (
        <>
          <strong>HAVING filters groups after.</strong> <C>HAVING SUM(value) &gt;= 100</C> tests each finished group. Web&apos;s
          remaining revenue is only ${sumKept[0][2]}, so the whole group is dropped.
        </>
      ),
    },
  ];
  const chartFor = (s: number) => {
    if (s === 0) return <MiniTable cols={COLS} rows={D} sql={"SELECT *\nFROM order_totals;"} />;
    if (s === 1)
      return <MiniTable cols={COLS} rows={GROUPED} state={GROUPED.map((r) => (r[1] === "app" ? "keep" : r[1] === "store" ? "unknown" : null))} sql={"SELECT ...\nFROM order_totals\nGROUP BY channel;"} />;
    if (s === 2) return <MiniTable cols={["channel", "COUNT(*)", "SUM(value)"]} rows={sumAll} sql={"SELECT channel, COUNT(*), SUM(value)\nFROM order_totals\nGROUP BY channel;"} />;
    if (s === 3)
      return (
        <div className="space-y-3">
          <MiniTable cols={COLS} rows={D} state={D.map((r) => (r[2] === "cancelled" ? "drop" : null))} sql={"SELECT channel, COUNT(*), SUM(value)\nFROM order_totals\nWHERE status <> 'cancelled'\nGROUP BY channel;"} />
          <MiniTable cols={["channel", "COUNT(*)", "SUM(value)"]} rows={sumKept} />
        </div>
      );
    return (
      <MiniTable
        cols={["channel", "COUNT(*)", "SUM(value)"]}
        rows={sumKept}
        state={sumKept.map((r) => (Number(r[2]) >= 100 ? "keep" : "drop"))}
        sql={"SELECT channel, COUNT(*), SUM(value)\nFROM order_totals\nWHERE status <> 'cancelled'\nGROUP BY channel\nHAVING SUM(value) >= 100;"}
      />
    );
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:48", src: "/explainers/sql-03/intuition.mp4", poster: "/explainers/sql-03/intuition-poster.jpg", square: true },
            { key: "steps", label: "Step by step", len: "1:44", src: "/explainers/sql-03/steps.mp4", poster: "/explainers/sql-03/steps-poster.jpg" },
          ]}
          note="The intuition video shows grouping and summarizing in under a minute. The step-by-step video runs a query with WHERE, GROUP BY, HAVING and ORDER BY in the order the database does."
        />
        <P>
          So far every query returned rows from the table, one for one. Most business questions are about totals instead: revenue per month,
          orders per channel, customers per state. <strong>Aggregation</strong> collapses many rows into a summary, and <C>GROUP BY</C> does it
          separately for each group. This is part 3 of the SQL series; see{" "}
          <Link className="link" href="/blog/posts/sql-select-where-explained/">part 1</Link> for the basics.
        </P>
        <H2 id="how-it-works">Groups in, summaries out</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="aggregates">Aggregate functions</H2>
        <P>
          An aggregate function takes a whole column of values and returns one value. Without GROUP BY, the whole table is one group. Every
          line item ever sold:
        </P>
        <SqlBlock q={Q.agg_all} />
        <P>
          The core five are <C>COUNT</C>, <C>SUM</C>, <C>AVG</C>, <C>MIN</C> and <C>MAX</C>. Aggregates can wrap expressions too, like{" "}
          <C>SUM(quantity * unit_price)</C> for revenue.
        </P>

        <H2 id="count">COUNT and NULLs</H2>
        <P>
          <C>COUNT(*)</C> counts rows. <C>COUNT(column)</C> counts rows where that column <em>isn&apos;t NULL</em>. <C>COUNT(DISTINCT
          column)</C> counts different non-NULL values:
        </P>
        <SqlBlock q={Q.count_variants} />
        <P>
          All aggregates except <C>COUNT(*)</C> skip NULLs. For <C>AVG</C> that changes the answer: the average of 10, 20, NULL and 30 is 20
          (three values), not 15 (four rows). Decide which one you mean:
        </P>
        <SqlBlock q={Q.avg_nulls} />
        <P>
          (<C>VALUES</C> builds a small table inline, handy for experiments.) And <C>SUM</C> of zero rows is NULL, not 0; wrap it in{" "}
          <C>COALESCE(SUM(x), 0)</C> when you need a number.
        </P>

        <H2 id="group-by">GROUP BY</H2>
        <P>
          <C>GROUP BY</C> splits the rows into groups that share the same value(s), and aggregates run once per group. Orders per channel:
        </P>
        <SqlBlock q={Q.group_channel} />
        <P>Group by several columns and you get one row per combination that actually occurs:</P>
        <SqlBlock q={Q.group_two} />
        <P>Top products by revenue, from the line items:</P>
        <SqlBlock q={Q.group_product} />
        <P>
          You can group by an expression. <C>date_trunc(&apos;month&apos;, d)</C> rounds a date down to the first of its month, giving one group
          per month (part 8 covers date functions in depth):
        </P>
        <SqlBlock q={Q.group_month} max={12} />
        <P>NULL forms its own group in GROUP BY, just as it does in DISTINCT:</P>
        <SqlBlock q={Q.group_null} />

        <H2 id="golden-rule">The golden rule</H2>
        <P>
          After grouping, each group becomes one row. So every column in SELECT must either be in GROUP BY (one value per group by definition)
          or inside an aggregate (which reduces the group to one value). This breaks the rule, because a customer has many order dates:
        </P>
        <SqlBlock q={Q.bad_group} />
        <P>Say which date you mean, for example the latest:</P>
        <SqlBlock q={Q.any_value} />
        <Dialect>
          Older MySQL (or MySQL with <C>ONLY_FULL_GROUP_BY</C> turned off) and SQLite accept the broken query and return an arbitrary value from
          each group, a silent source of wrong answers. If you truly don&apos;t care which value, say so with <C>ANY_VALUE(order_date)</C>{" "}
          (DuckDB, MySQL 8, BigQuery, Snowflake).
        </Dialect>

        <H2 id="having">HAVING vs WHERE</H2>
        <P>
          <C>HAVING</C> filters groups after aggregation, so it can use aggregates. Customers with at least 8 orders:
        </P>
        <SqlBlock q={Q.having} max={6} />
        <P>
          WHERE runs <em>before</em> grouping and can&apos;t see aggregates at all:
        </P>
        <SqlBlock q={Q.where_agg} />
        <P>
          Both in one query: WHERE keeps only completed orders, GROUP BY counts them per customer, HAVING keeps the frequent buyers. Notice
          the counts drop compared with the query above:
        </P>
        <SqlBlock q={Q.where_and_having} max={6} />
        <Gotcha>
          Conditions on plain columns belong in WHERE, even though HAVING would also accept <C>HAVING channel = &apos;web&apos;</C>. WHERE removes
          rows before the expensive grouping step, and it makes the intent clear.
        </Gotcha>

        <H2 id="conditional">Conditional aggregation</H2>
        <P>
          Combining aggregates with CASE (from <Link className="link" href="/blog/posts/sql-sorting-case-explained/">part 2</Link>) counts
          several things in one pass. <C>FILTER (WHERE ...)</C> is the standard, more readable shorthand where it&apos;s supported, and averaging
          a 1/0 flag gives a rate:
        </P>
        <SqlBlock q={Q.conditional} />
        <Dialect>
          <C>FILTER (WHERE ...)</C> works in PostgreSQL, DuckDB and SQLite; elsewhere use <C>SUM(CASE WHEN ... THEN 1 ELSE 0 END)</C>, which
          works everywhere. BigQuery also has <C>COUNTIF(condition)</C>.
        </Dialect>

        <H2 id="more">More aggregates and grouping tools</H2>
        <P>
          Group at the right grain. To get order values, group line items by order first (part 5 shows how to then average those values):
        </P>
        <SqlBlock q={Q.avg_order_value} />
        <P>
          <C>STRING_AGG</C> concatenates a group&apos;s values into one string (<C>GROUP_CONCAT</C> in MySQL, <C>LISTAGG</C> in Snowflake and
          Oracle):
        </P>
        <SqlBlock q={Q.string_agg} />
        <P>
          <C>GROUP BY ALL</C> (DuckDB, Snowflake, Databricks) groups by every non-aggregated SELECT column, so you don&apos;t repeat
          them:
        </P>
        <SqlBlock q={Q.group_by_all} />
        <P>
          <C>ROLLUP</C> adds subtotal rows: per channel and status, per channel (status NULL), and a grand total (both NULL). <C>CUBE</C> and{" "}
          <C>GROUPING SETS</C> generalize it:
        </P>
        <SqlBlock q={Q.rollup} max={13} />

        <H2 id="missing-groups">Groups that don&apos;t exist</H2>
        <P>
          GROUP BY only produces groups for values that appear in the data. Days without orders don&apos;t show up as zero; they don&apos;t show up
          at all. Averaging the daily counts then overstates the daily rate:
        </P>
        <SqlBlock q={Q.missing_days} />
        <P>
          Only 212 of 365 days had orders, so &quot;average orders per day&quot; is 1.98 on order days but 1.15 per calendar day. To report
          zeros, you join to a complete list of dates, a pattern covered in parts 4 and 8.
        </P>

        <H2 id="order-of-execution">The full run order</H2>
        <P>
          With grouping, the logical order of a query becomes <strong>FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY →
          LIMIT</strong>. That single sequence explains most SQL errors you&apos;ll meet: WHERE can&apos;t use aggregates (they don&apos;t
          exist yet), HAVING can, and ORDER BY can use SELECT aliases.
        </P>

        <H2 id="practice">Practice</H2>
        <Exercise n={1} q="How many orders are there in each status?" answer={Q.ex1} />
        <Exercise n={2} q="Which states have at least 10 customers?" hint={<>Count per state, then filter the groups with HAVING.</>} answer={Q.ex2} />
        <Exercise
          n={3}
          q="For each month, show the number of orders, how many came through the app, and the app's share."
          hint={
            <>
              <C>date_trunc(&apos;month&apos;, order_date)</C>, plus <C>COUNT(*) FILTER (WHERE ...)</C>. Multiply by 1.0 before dividing.
            </>
          }
          answer={Q.ex3}
        />
        <SqlPlayground start={"SELECT state, COUNT(*) AS customers\nFROM customers\nGROUP BY state\nORDER BY customers DESC;"} />

        <H2 id="recap">Recap</H2>
        <UL>
          <li>Aggregates (COUNT, SUM, AVG, MIN, MAX) reduce many rows to one value and skip NULLs; COUNT(*) counts rows.</li>
          <li>GROUP BY produces one output row per group; every SELECT column must be grouped or aggregated.</li>
          <li>WHERE filters rows before grouping; HAVING filters groups after.</li>
          <li>Conditional aggregation (CASE or FILTER) counts several things in one pass.</li>
          <li>Groups with no rows simply don&apos;t appear.</li>
        </UL>
        <P>Next: combining tables with JOINs.</P>
        <SeriesNav current={3} />
        <p className="mt-6 text-sm italic text-gray-600 dark:text-gray-400">
          The store data is synthetic. Queries run in your browser with DuckDB-WASM; changes are rolled back after each run. The animation uses
          a simplified order_totals table (one row per order with its value); the live queries use the real tables.
        </p>
      </Narrow>
    </Wide>
  );
};

export default Sql03Story;
