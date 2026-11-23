import Link from "next/link";

import { H2, Narrow, P, Scrolly, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { SqlBlock, SqlPlayground, type Saved } from "@/components/sql/SqlBlock";
import { C, Dialect, Exercise, Gotcha, MiniTable, SeriesNav, type MiniRow } from "@/components/sql/SqlKit";
import R from "lib/sql/results/06-window-ranking.json";

/** SQL series, part 6: window functions I (OVER, PARTITION BY, ranking). */

const Q = R as Record<string, Saved>;
const PROD: MiniRow[] = [
  ["Smart Watch", "Electronics", "199.00"],
  ["Wireless Earbuds", "Electronics", "79.00"],
  ["Trail Running Shoes", "Footwear", "89.99"],
  ["Everyday Sneakers", "Footwear", "59.99"],
  ["Rain Boots", "Footwear", "44.50"],
  ["Two-Person Tent", "Outdoor", "179.00"],
  ["Daypack 20L", "Outdoor", "64.00"],
  ["Water Bottle", "Outdoor", "24.99"],
];
const AVG: Record<string, string> = { Electronics: "71.59", Footwear: "52.37", Outdoor: "83.39" };
const TIES: MiniRow[] = [
  ["Sofia", 19, 1, 1, 1],
  ["Noah", 18, 2, 2, 2],
  ["Kenji", 15, 3, 3, 3],
  ["Liam", 13, 4, 4, 4],
  ["Elijah", 11, 5, 5, 5],
  ["Sofia", 11, 6, 5, 5],
  ["Wei", 11, 7, 5, 5],
  ["Liam", 10, 8, 8, 6],
];

const Sql06Story: React.FC = () => {
  const rn = PROD.map((r, i) => PROD.slice(0, i + 1).filter((q) => q[1] === r[1]).length);
  const steps: Step[] = [
    {
      key: "group",
      body: (
        <>
          <strong>GROUP BY collapses.</strong> Averaging price per category gives one row per category. The individual products are gone, so
          you can&apos;t compare a product to its category average in the same row.
        </>
      ),
    },
    {
      key: "window",
      body: (
        <>
          <strong>A window keeps every row.</strong> <C>AVG(price) OVER (PARTITION BY category)</C> computes the same averages but attaches
          the result to each row. Same math, no collapsing.
        </>
      ),
    },
    {
      key: "rownum",
      body: (
        <>
          <strong>Ranking within groups.</strong> <C>ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC)</C> numbers the products
          1, 2, 3… inside each category, priciest first. It starts over in every partition.
        </>
      ),
    },
    {
      key: "ties",
      body: (
        <>
          <strong>Ties.</strong> Three customers have 11 orders. <C>ROW_NUMBER</C> still hands out 5, 6, 7 (in an arbitrary order),{" "}
          <C>RANK</C> gives all three 5 and then <em>skips</em> to 8, and <C>DENSE_RANK</C> gives them 5 and continues with 6.
        </>
      ),
    },
  ];
  const chartFor = (s: number) => {
    if (s === 0)
      return <MiniTable cols={["category", "avg_price"]} rows={Object.entries(AVG).map(([k, v]) => [k, v])} sql={"SELECT category, AVG(price)\nFROM products\nGROUP BY category;"} />;
    if (s === 1)
      return (
        <MiniTable
          cols={["name", "category", "price"]}
          rows={PROD}
          extra={{ head: "category_avg", vals: PROD.map((r) => AVG[r[1] as string]) }}
          sql={"SELECT name, category, price,\n  AVG(price) OVER (PARTITION BY category)\nFROM products;"}
        />
      );
    if (s === 2)
      return (
        <MiniTable
          cols={["name", "category", "price"]}
          rows={PROD}
          state={PROD.map((r) => (r[1] === "Footwear" ? "keep" : r[1] === "Electronics" ? "unknown" : null))}
          extra={{ head: "rn", vals: rn.map(String) }}
          sql={"SELECT name, category, price,\n  ROW_NUMBER() OVER (\n    PARTITION BY category\n    ORDER BY price DESC) AS rn\nFROM products;"}
        />
      );
    return <MiniTable cols={["customer", "orders", "ROW_NUMBER", "RANK", "DENSE_RANK"]} rows={TIES} state={TIES.map((r) => (r[1] === 11 ? "unknown" : null))} />;
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:48", src: "/explainers/sql-06/intuition.mp4", poster: "/explainers/sql-06/intuition-poster.jpg", square: true },
            { key: "steps", label: "Step by step", len: "1:40", src: "/explainers/sql-06/steps.mp4", poster: "/explainers/sql-06/steps-poster.jpg" },
          ]}
          note="The intuition video contrasts GROUP BY with a window and shows the three ranking functions. The step-by-step video partitions, orders and ranks row by row."
        />
        <P>
          Window functions are the feature that separates everyday SQL from fluent SQL. They compute across a set of related rows (a
          &quot;window&quot;) like an aggregate does, but instead of collapsing those rows into one, they attach the answer to each row. That
          makes questions like &quot;rank products within their category&quot;, &quot;each customer&apos;s latest order&quot; or &quot;each
          product&apos;s share of the total&quot; one-liners. This is part 6 of the SQL series; it builds on{" "}
          <Link className="link" href="/blog/posts/sql-group-by-explained/">GROUP BY</Link> and{" "}
          <Link className="link" href="/blog/posts/sql-subqueries-ctes-explained/">CTEs</Link>.
        </P>
        <H2 id="how-it-works">Aggregate without collapsing</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="over">OVER: turning an aggregate into a window function</H2>
        <P>GROUP BY gives one row per category:</P>
        <SqlBlock q={Q.group_collapse} />
        <P>
          Add <C>OVER (...)</C> after an aggregate and it becomes a window function: computed per group, returned on every row.
        </P>
        <SqlBlock q={Q.window_keep} max={8} />
        <P>
          An empty <C>OVER ()</C> makes the whole result one window. Each product&apos;s share of the sum of all prices:
        </P>
        <SqlBlock q={Q.over_empty} />
        <P>
          Because the group value sits next to the row value, comparing them is plain arithmetic. How far is each product from its
          category&apos;s average, and how big is its category?
        </P>
        <SqlBlock q={Q.vs_category} max={8} />
        <P>
          Compare that with the correlated subquery from part 5: same answer, one pass over the table.
        </P>

        <H2 id="anatomy">Anatomy of a window</H2>
        <UL>
          <li>
            <C>PARTITION BY</C> splits rows into independent groups (optional; without it, all rows are one partition).
          </li>
          <li>
            <C>ORDER BY</C> inside OVER orders rows within each partition. It&apos;s required by ranking functions and, as part 7 shows, changes
            what aggregates like SUM compute.
          </li>
          <li>
            The function (<C>ROW_NUMBER()</C>, <C>RANK()</C>, <C>SUM(x)</C>…) is evaluated for each row using its partition.
          </li>
        </UL>
        <P>
          The OVER&apos;s ORDER BY only affects the calculation. It doesn&apos;t sort the output; you still need a regular ORDER BY at the end for
          that.
        </P>

        <H2 id="row-number">ROW_NUMBER</H2>
        <P>
          <C>ROW_NUMBER()</C> numbers rows 1, 2, 3… within each partition, in the window&apos;s order:
        </P>
        <SqlBlock q={Q.row_number} max={8} />

        <H2 id="ties">RANK, DENSE_RANK and ties</H2>
        <P>The three ranking functions differ only in how they handle ties. Customers ranked by number of orders:</P>
        <SqlBlock q={Q.ties} />
        <UL>
          <li>
            <C>ROW_NUMBER</C>: always unique. Among tied rows the order is arbitrary, so it can change between runs unless you add a tie-breaker
            (<C>ORDER BY orders DESC, customer_id</C>).
          </li>
          <li>
            <C>RANK</C>: ties share a rank and the next rank skips ahead (5, 5, 5, 8), like a race with a three-way tie for fifth.
          </li>
          <li>
            <C>DENSE_RANK</C>: ties share a rank with no gap (5, 5, 5, 6). Use it for &quot;the top 3 distinct values&quot;.
          </li>
        </UL>

        <H2 id="filter">Filtering on a window: top N per group</H2>
        <P>Window functions are computed after WHERE, so you can&apos;t filter on them there:</P>
        <SqlBlock q={Q.where_window} />
        <P>Compute the rank in a CTE, then filter outside it. The two most expensive products in every category:</P>
        <SqlBlock q={Q.top_n} />
        <P>
          Some databases add <C>QUALIFY</C>, which filters on window results directly, the way HAVING filters on aggregates:
        </P>
        <SqlBlock q={Q.qualify} />
        <Dialect>
          <C>QUALIFY</C> works in DuckDB, Snowflake, BigQuery, Databricks and Teradata, but not PostgreSQL, MySQL or SQL Server; use the CTE
          pattern there. Window functions themselves work everywhere modern (MySQL from 8.0, SQLite from 3.25).
        </Dialect>

        <H2 id="latest">Latest row per key (and deduplication)</H2>
        <P>
          <C>ROW_NUMBER() = 1</C> with the right ORDER BY picks one row per group: here each customer&apos;s most recent order. The order_id
          tie-breaker makes it deterministic when two orders share a date:
        </P>
        <SqlBlock q={Q.latest_per_customer} />
        <P>
          The same pattern removes duplicates from messy data: partition by whatever defines a duplicate, order by what decides the keeper (most
          recent, most complete), and keep row 1.
        </P>

        <H2 id="after-group">Windows over grouped results</H2>
        <P>
          Windows run after GROUP BY, so they can rank the groups themselves. <C>SUM(...)</C> inside the OVER&apos;s ORDER BY is the group&apos;s
          aggregate:
        </P>
        <SqlBlock q={Q.rank_groups} />

        <H2 id="ntile">NTILE, PERCENT_RANK and CUME_DIST</H2>
        <P>
          <C>NTILE(4)</C> splits ordered rows into 4 nearly equal buckets: quartiles. Here, customers by lifetime value; the top quarter of
          customers brings in over two thirds of revenue (and the share column is itself a window over a grouped result):
        </P>
        <SqlBlock q={Q.ntile} />
        <P>
          <C>PERCENT_RANK()</C> is (rank − 1) / (rows − 1), from 0 to 1. <C>CUME_DIST()</C> is the share of rows at or below the current value:
        </P>
        <SqlBlock q={Q.percent_rank} />

        <H2 id="named">Named windows</H2>
        <P>
          When several functions share a window, define it once with <C>WINDOW</C> and refer to it by name:
        </P>
        <SqlBlock q={Q.named_window} />
        <Gotcha>
          Ranking without a tie-breaker is the most common window bug: a report that silently changes between runs because two rows tied. If the
          ORDER BY columns aren&apos;t unique, add one that is.
        </Gotcha>

        <H2 id="practice">Practice</H2>
        <Exercise n={1} q="Find the first customer to sign up in each state." hint={<>ROW_NUMBER partitioned by state, ordered by signup_date; keep row 1.</>} answer={Q.ex1} />
        <Exercise n={2} q="Rank orders by total value and show the top 5." hint={<>Group line items by order, then DENSE_RANK over the sum.</>} answer={Q.ex2} />
        <Exercise n={3} q="What was the 100th order placed through each channel?" answer={Q.ex3} />
        <SqlPlayground start={"SELECT\n  category, name, price,\n  RANK() OVER (PARTITION BY category ORDER BY price DESC) AS rank_in_category\nFROM products\nORDER BY category, rank_in_category;"} />

        <H2 id="recap">Recap</H2>
        <UL>
          <li>A window function computes over related rows and returns a value on every row: nothing collapses.</li>
          <li>PARTITION BY defines the groups; ORDER BY inside OVER defines the order within them.</li>
          <li>ROW_NUMBER is unique; RANK skips after ties; DENSE_RANK doesn&apos;t.</li>
          <li>Filter on window results in an outer query or with QUALIFY, not WHERE.</li>
          <li>Top N per group and latest row per key are ROW_NUMBER patterns.</li>
        </UL>
        <P>Next: LAG, LEAD, running totals, moving averages and window frames.</P>
        <SeriesNav current={6} />
        <p className="mt-6 text-sm italic text-gray-600 dark:text-gray-400">
          The store data is synthetic. Queries run in your browser with DuckDB-WASM; changes are rolled back after each run.
        </p>
      </Narrow>
    </Wide>
  );
};

export default Sql06Story;
