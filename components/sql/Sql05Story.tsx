import Link from "next/link";

import { H2, Narrow, P, Scrolly, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { SqlBlock, SqlPlayground, type Saved } from "@/components/sql/SqlBlock";
import { C, Dialect, Exercise, Gotcha, MiniTable, SeriesNav, type MiniRow } from "@/components/sql/SqlKit";
import R from "lib/sql/results/05-subqueries-ctes.json";

/** SQL series, part 5: subqueries and common table expressions. */

const Q = R as Record<string, Saved>;
const PRODS: MiniRow[] = [
  ["Trail Running Shoes", "Footwear", "89.99"],
  ["Rain Boots", "Footwear", "44.50"],
  ["Wool Socks (3-pack)", "Footwear", "14.99"],
  ["Water Bottle", "Outdoor", "24.99"],
  ["Two-Person Tent", "Outdoor", "179.00"],
  ["Daypack 20L", "Outdoor", "64.00"],
  ["Wireless Earbuds", "Electronics", "79.00"],
  ["Phone Charger", "Electronics", "19.99"],
  ["Smart Watch", "Electronics", "199.00"],
];
const CAT: Record<string, number> = { Footwear: 52.37, Outdoor: 83.39, Electronics: 71.59 };
const OVERALL = 53.77;

const Sql05Story: React.FC = () => {
  const steps: Step[] = [
    {
      key: "inner",
      body: (
        <>
          <strong>Ask the small question first.</strong> &quot;Which products are pricier than average?&quot; needs the average before it can
          compare. The inner query <C>(SELECT AVG(price) FROM products)</C> runs on its own and returns one number: ${OVERALL}.
        </>
      ),
    },
    {
      key: "outer",
      body: (
        <>
          <strong>Use the answer.</strong> The outer query treats that number like a constant: <C>WHERE price &gt; 53.77</C>. Green rows pass.
        </>
      ),
    },
    {
      key: "correlated",
      body: (
        <>
          <strong>Correlated: once per row.</strong> &quot;Pricier than the average <em>of its own category</em>&quot; needs a different
          average for each row. The inner query mentions the outer row (<C>p2.category = p.category</C>), so it&apos;s re-run for every
          product. A $79 pair of earbuds beats the electronics average; a $64 daypack doesn&apos;t beat outdoor&apos;s.
        </>
      ),
    },
    {
      key: "cte",
      body: (
        <>
          <strong>Name your steps with WITH.</strong> A CTE (common table expression) gives a subquery a name and puts it first, so a long
          query reads top to bottom: each step builds on the ones above it.
        </>
      ),
    },
  ];
  const chartFor = (s: number) => {
    if (s === 0)
      return (
        <div className="space-y-3">
          <MiniTable cols={["AVG(price)"]} rows={[[OVERALL.toFixed(2)]]} sql={"SELECT AVG(price) FROM products;"} />
        </div>
      );
    if (s === 1)
      return (
        <MiniTable
          cols={["name", "category", "price"]}
          rows={PRODS}
          show={[true, false, true]}
          state={PRODS.map((r) => (Number(r[2]) > OVERALL ? "keep" : "drop"))}
          sql={"SELECT name, price FROM products\nWHERE price > (SELECT AVG(price) FROM products);"}
        />
      );
    if (s === 2)
      return (
        <MiniTable
          cols={["name", "category", "price"]}
          rows={PRODS}
          state={PRODS.map((r) => (Number(r[2]) > CAT[r[1] as string] ? "keep" : "drop"))}
          extra={{ head: "category avg", vals: PRODS.map((r) => CAT[r[1] as string].toFixed(2)) }}
          sql={"SELECT p.name, p.category, p.price\nFROM products p\nWHERE p.price > (\n  SELECT AVG(p2.price) FROM products p2\n  WHERE p2.category = p.category\n);"}
        />
      );
    return (
      <pre className="m-0 rounded-lg bg-[#0f172a] text-gray-100 text-[14px] leading-relaxed p-4 whitespace-pre-wrap" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }}>
        {`WITH order_values AS (      -- step 1: one row per order
  SELECT order_id, customer_id, SUM(...) AS value
  ...
),
customer_stats AS (          -- step 2: one row per customer
  SELECT customer_id, SUM(value) AS lifetime_value
  FROM order_values ...
),
tiers AS (                   -- step 3: label each customer
  SELECT ..., CASE ... END AS tier
  FROM customer_stats
)
SELECT tier, COUNT(*)        -- final answer
FROM tiers
GROUP BY tier;`}
      </pre>
    );
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:48", src: "/explainers/sql-05/intuition.mp4", poster: "/explainers/sql-05/intuition-poster.jpg", square: true },
            { key: "steps", label: "Step by step", len: "1:40", src: "/explainers/sql-05/steps.mp4", poster: "/explainers/sql-05/steps-poster.jpg" },
          ]}
          note="The intuition video shows nesting, the NOT IN trap and CTEs in under a minute. The step-by-step video runs a correlated subquery row by row."
        />
        <P>
          Some questions need an answer to a smaller question first: &quot;above average&quot; needs the average, &quot;customers who never
          ordered&quot; needs the list of those who did. SQL lets you put a whole query inside another, as a value, a list or a table. And when
          those nest deeply, <strong>CTEs</strong> (<C>WITH</C>) turn them into a readable sequence of named steps. This is part 5 of the SQL
          series, after <Link className="link" href="/blog/posts/sql-joins-explained/">JOINs</Link>.
        </P>
        <H2 id="how-it-works">Queries inside queries</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="scalar">Scalar subqueries: one value</H2>
        <P>A subquery in parentheses that returns a single value can go anywhere a value can. First, the average on its own:</P>
        <SqlBlock q={Q.avg_price} />
        <P>Then as part of a comparison:</P>
        <SqlBlock q={Q.above_avg} />
        <P>…or as a computed column:</P>
        <SqlBlock q={Q.scalar_select} />
        <P>
          A scalar subquery must return <strong>exactly one row and one column</strong>. If it returns several rows, the query fails (no rows
          gives NULL):
        </P>
        <SqlBlock q={Q.scalar_many} />

        <H2 id="in">IN, NOT IN and the NULL trap</H2>
        <P>A subquery that returns one column of many rows can feed <C>IN</C>. Customers who ordered during the last week of the year:</P>
        <SqlBlock q={Q.in_sub} />
        <P>
          <C>NOT IN</C> looks like its mirror image, but it hides one of SQL&apos;s nastiest traps. Which customers have never arrived through an
          email link?
        </P>
        <SqlBlock q={Q.not_in_trap} />
        <P>Zero. That&apos;s not true; the reason is in the subquery&apos;s data:</P>
        <SqlBlock q={Q.not_in_why} />
        <P>
          104 email sessions are anonymous, so the list contains NULL. <C>x NOT IN (a, b, NULL)</C> means <C>x &lt;&gt; a AND x &lt;&gt; b AND
          x &lt;&gt; NULL</C>. The last part is always NULL (unknown), so the whole condition can be FALSE or NULL but never TRUE, and every row
          is filtered out. Filtering the NULLs out of the subquery fixes it:
        </P>
        <SqlBlock q={Q.not_in_fixed} />
        <Gotcha title="Rule of thumb">
          Never use <C>NOT IN (subquery)</C> unless the subquery&apos;s column is guaranteed not NULL. Use <C>NOT EXISTS</C> instead: it&apos;s
          immune to NULLs and usually just as fast.
        </Gotcha>

        <H2 id="exists">EXISTS and NOT EXISTS</H2>
        <P>
          <C>EXISTS (subquery)</C> is TRUE if the subquery returns at least one row; what it selects doesn&apos;t matter, so <C>SELECT 1</C> is
          conventional. The correct version of the question above:
        </P>
        <SqlBlock q={Q.not_exists} />
        <P>Customers who returned at least one order:</P>
        <SqlBlock q={Q.exists} />
        <P>
          Notice both subqueries refer to <C>c</C> from the outer query. That makes them <strong>correlated</strong>.
        </P>

        <H2 id="correlated">Correlated subqueries</H2>
        <P>
          A correlated subquery refers to the current row of the outer query, so logically it runs once per outer row. Each customer&apos;s
          latest order date:
        </P>
        <SqlBlock q={Q.correlated} />
        <P>Products pricier than their own category&apos;s average, as in the video:</P>
        <SqlBlock q={Q.correlated_category} />
        <P>
          Correlated subqueries are clear for small lookups, and modern optimizers often rewrite them as joins. But on big tables a
          once-per-row subquery can be slow; a join to a grouped CTE, or a window function (part 6), usually does the same job in one pass.
        </P>

        <H2 id="derived">Subqueries in FROM: derived tables</H2>
        <P>
          A subquery in FROM is a temporary table (a <em>derived table</em>) that must be given a name. This is how you aggregate twice: first
          sum line items into order values, then average the orders:
        </P>
        <SqlBlock q={Q.derived} />

        <H2 id="cte">CTEs: WITH</H2>
        <P>
          The same query with a CTE. The subquery moves to the top under a name, and the main query reads like plain English:
        </P>
        <SqlBlock q={Q.cte} />
        <P>
          CTEs shine when you chain several steps. Each can use the ones before it. Here: order values → per-customer stats → a tier per
          customer → a summary per tier:
        </P>
        <SqlBlock q={Q.cte_chain} />
        <P>
          They&apos;re also the clean fix for the fan-out bug from part 4: aggregate each table to the same grain (one row per customer) in its
          own CTE, then join. Orders now count correctly (315 + 105 = 420) alongside revenue:
        </P>
        <SqlBlock q={Q.fanout_fixed} />
        <P>A CTE can be referenced more than once. The busiest day of the year:</P>
        <SqlBlock q={Q.cte_reuse} />
        <Dialect>
          CTEs work in every major database (MySQL from 8.0). Whether a CTE is computed once and reused or inlined into each reference depends on
          the engine: PostgreSQL 12+ inlines by default (use <C>AS MATERIALIZED</C> to force once), while others decide on their own. Results are
          the same either way; only speed differs.
        </Dialect>

        <H2 id="lateral">LATERAL: a subquery per row in FROM</H2>
        <P>
          <C>LATERAL</C> lets a subquery in FROM refer to tables listed before it, running it once per row. It&apos;s the cleanest way to get
          &quot;top N per group&quot;: each customer&apos;s two most recent orders:
        </P>
        <SqlBlock q={Q.lateral} />
        <Dialect>
          LATERAL works in PostgreSQL, DuckDB, MySQL 8.0.14+ and Snowflake; SQL Server calls it <C>CROSS APPLY</C> / <C>OUTER APPLY</C>.
          BigQuery has no LATERAL; use window functions instead.
        </Dialect>

        <H2 id="choosing">Which to use?</H2>
        <UL>
          <li>
            <strong>A single number</strong> (an average, a max): scalar subquery.
          </li>
          <li>
            <strong>&quot;Has any…&quot; / &quot;has no…&quot;</strong>: EXISTS / NOT EXISTS.
          </li>
          <li>
            <strong>Several steps or aggregating twice</strong>: CTEs, one step each.
          </li>
          <li>
            <strong>Per-row lookups on big tables</strong>: a join to an aggregated CTE, or window functions (next post).
          </li>
        </UL>

        <H2 id="practice">Practice</H2>
        <Exercise n={1} q="Which electronics cost less than the average electronics price?" answer={Q.ex1} />
        <Exercise
          n={2}
          q="Which products had no orders from December 20 onward?"
          hint={
            <>
              NOT EXISTS, with a subquery joining order_items to orders.
            </>
          }
          answer={Q.ex2}
        />
        <Exercise
          n={3}
          q="Which months had more orders than the average month?"
          hint={<>A CTE with one row per month, used twice: once to list months, once inside a scalar subquery for the average.</>}
          answer={Q.ex3}
        />
        <SqlPlayground start={"WITH order_values AS (\n  SELECT order_id, SUM(quantity * unit_price) AS value\n  FROM order_items\n  GROUP BY order_id\n)\nSELECT *\nFROM order_values\nORDER BY value DESC\nLIMIT 5;"} />

        <H2 id="recap">Recap</H2>
        <UL>
          <li>A subquery can be a value (scalar), a list (IN), an existence test (EXISTS) or a table (in FROM).</li>
          <li>Correlated subqueries refer to the outer row and run once per row.</li>
          <li>NOT IN with a NULL in the list returns nothing; use NOT EXISTS.</li>
          <li>CTEs name each step, read top to bottom, and fix fan-out by aggregating before joining.</li>
        </UL>
        <P>Next: window functions, which compute across related rows without collapsing them.</P>
        <SeriesNav current={5} />
        <p className="mt-6 text-sm italic text-gray-600 dark:text-gray-400">
          The store data is synthetic. Queries run in your browser with DuckDB-WASM; changes are rolled back after each run.
        </p>
      </Narrow>
    </Wide>
  );
};

export default Sql05Story;
