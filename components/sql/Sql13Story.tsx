import { H2, Narrow, P, Scrolly, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { SqlBlock, SqlCode, SqlPlayground, type Saved } from "@/components/sql/SqlBlock";
import { C, Dialect, Exercise, Gotcha, MiniTable, SeriesNav, type MiniRow } from "@/components/sql/SqlKit";
import R from "lib/sql/results/13-performance.json";

/** SQL series, part 13: performance (query plans, sargable filters, indexes, clustering, fan-out). */

const Q = R as Record<string, Saved>;
const PLAN: MiniRow[] = [
  ["SEQ_SCAN orders", "filter on date", 89],
  ["SEQ_SCAN customers", "", 150],
  ["HASH_JOIN", "customer_id", 89],
  ["HASH_GROUP_BY", "state", 12],
];
const BLOCKS: MiniRow[] = [
  ["block 1", "2022-01-01", "2022-04-13", "skip"],
  ["block 2", "2022-04-14", "2022-07-24", "skip"],
  ["…", "", "", ""],
  ["block 13", "2023-05-29", "2023-09-07", "read"],
  ["…", "", "", ""],
];
const FAN: MiniRow[] = [
  ["order items", 16],
  ["sessions", 10],
  ["joined rows", 160],
];

const Sql13Story: React.FC = () => {
  const steps: Step[] = [
    {
      key: "plan",
      body: (
        <>
          <strong>Every query becomes a plan.</strong> The optimizer turns your SQL into a tree of operators: scans at the leaves, then joins,
          grouping and sorting. <C>EXPLAIN</C> prints it; read it bottom-up.
        </>
      ),
    },
    {
      key: "skip",
      body: (
        <>
          <strong>The fastest work is skipped work.</strong> Tables are stored in blocks that remember the min and max of each column. A filter
          on the raw column lets the scan skip every block whose range can&apos;t match.
        </>
      ),
    },
    {
      key: "function",
      body: (
        <>
          <strong>Functions on columns defeat skipping.</strong> <C>month(sale_date) = 6</C> can&apos;t be checked against a block&apos;s
          min/max, so every block is read and the function runs on every row.
        </>
      ),
    },
    {
      key: "fanout",
      body: (
        <>
          <strong>Joins can multiply rows.</strong> Customer 85 has 16 order items and 10 sessions. Joining both gives 16 × 10 = 160 rows:
          slower, and every SUM is ten times too big.
        </>
      ),
    },
  ];
  const chartFor = (s: number) => {
    if (s === 0) return <MiniTable cols={["operator", "on", "rows"]} rows={PLAN} sql="-- read from the bottom row up" />;
    if (s === 1 || s === 2)
      return (
        <MiniTable
          cols={["block", "min date", "max date", "action"]}
          rows={BLOCKS.map((r) => (s === 2 && r[3] ? [r[0], r[1], r[2], "read"] : r))}
          state={BLOCKS.map((r) => (r[3] === "read" || (s === 2 && r[3]) ? "keep" : r[3] === "skip" ? "drop" : null))}
          sql={s === 1 ? "WHERE sale_date >= '2023-06-01'\n  AND sale_date <  '2023-07-01'" : "WHERE month(sale_date) = 6"}
        />
      );
    return <MiniTable cols={["rows", "count"]} rows={FAN} state={[null, null, "drop"]} sql="-- 16 × 10 = 160" />;
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:48", src: "/explainers/sql-13/intuition.mp4", poster: "/explainers/sql-13/intuition-poster.jpg", square: true },
            { key: "steps", label: "Step by step", len: "1:40", src: "/explainers/sql-13/steps.mp4", poster: "/explainers/sql-13/steps-poster.jpg" },
          ]}
          note="The intuition video shows a plan tree, block skipping and join fan-out. The step-by-step video walks through a real plan, how a B-tree index finds a row, and a checklist."
        />
        <P>
          SQL is declarative: you say what you want, and the database decides how to get it. Most of the time it decides well. When a query is
          slow, the fix is rarely clever syntax. It&apos;s understanding what the database actually does, and giving it a way to do less. This
          last part of the SQL series covers reading query plans, writing filters the engine can use, indexes, and the join mistake that makes
          queries both slow and wrong.
        </P>
        <H2 id="how-it-works">Four ideas</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="explain">Reading a plan with EXPLAIN</H2>
        <P>Put <C>EXPLAIN</C> in front of any query to see the plan instead of the result. The simplest plan is one scan:</P>
        <SqlBlock q={Q.explain_simple} />
        <P>
          Three things to read in a scan. <strong>Projections</strong>: the columns it will read (only two of the five). <strong>Filters</strong>
          : conditions checked during the scan itself, so non-matching rows never leave it. <strong>~4 rows</strong>: the optimizer&apos;s
          estimate of how many rows come out. A join with grouping gives a tree:
        </P>
        <SqlBlock q={Q.explain_join} />
        <P>
          Read it from the bottom up. Both tables are scanned; the date filter is applied inside the orders scan. <C>HASH_JOIN</C> builds a hash
          table on one input and probes it with the other. <C>HASH_GROUP_BY</C> counts per state. (The <C>__internal_compress</C> projections
          are DuckDB packing values into smaller types for speed; you can ignore them.)
        </P>
        <P>
          <C>EXPLAIN ANALYZE</C> actually runs the query and reports the real row count and time for every operator, plus the total:
        </P>
        <SqlBlock q={Q.explain_analyze} />
        <P>
          The estimate said ~84 rows from the join; the real number is 89. Close estimates mean the optimizer understood the data. When an
          estimate is off by 100× or more, it may have picked a bad join order or algorithm: in PostgreSQL that usually means running{" "}
          <C>ANALYZE</C> to refresh table statistics.
        </P>
        <Dialect>
          Every database has EXPLAIN, with different output. PostgreSQL: <C>EXPLAIN (ANALYZE, BUFFERS)</C>, an indented text tree with cost
          estimates. MySQL: <C>EXPLAIN</C> as a table, or <C>EXPLAIN ANALYZE</C> (8.0.18+). SQL Server: graphical &quot;actual execution
          plan&quot; in SSMS or <C>SET SHOWPLAN_TEXT ON</C>. Snowflake and BigQuery show the plan in the query profile after a run.
        </Dialect>

        <H2 id="columns">Read only the columns you need</H2>
        <P>
          Analytics databases (DuckDB, BigQuery, Snowflake, Redshift) store each column separately. <C>SELECT *</C> makes the scan read every
          column:
        </P>
        <SqlBlock q={Q.projection} />
        <P>
          Compare the Projections with the two-column version above. On a five-column table it doesn&apos;t matter; on a 200-column table it
          can mean reading 100× more data. BigQuery bills by bytes scanned, so <C>SELECT *</C> costs money there, and <C>LIMIT</C> doesn&apos;t
          reduce it.
        </P>

        <H2 id="sargable">Filters the engine can use</H2>
        <P>To see real differences, we need more than 420 orders. This generates a million sales, 1,000 per day, in date order:</P>
        <SqlBlock q={Q.make_big} />
        <P>
          Each block of the table (DuckDB calls them <em>row groups</em>, about 122,000 rows each) records the min and max of every column.
          A filter that compares the raw column to constants can be checked against those: if a block&apos;s dates all fall before June 2023,
          skip it without reading a row. Here&apos;s June 2023&apos;s revenue, written two ways:
        </P>
        <SqlBlock q={Q.sargable_good} />
        <SqlBlock q={Q.sargable_bad} />
        <P>
          Same answer; different work. The second plan has a separate <C>FILTER</C> operator: the scan reads every row, computes{" "}
          <C>year()</C> and <C>month()</C> on each, and only then throws most of them away. Run both a few times and compare the{" "}
          <strong>Total Time</strong> lines: in my browser the first takes about 2–5 ms and the second 20–70 ms. The gap grows with the
          table.
        </P>
        <P>
          A filter the engine can use directly is called <strong>sargable</strong> (from &quot;search argument able&quot;). The rule: leave the
          column alone, and move the work to the constant side.
        </P>
        <UL>
          <li>
            <C>WHERE sale_date &gt;= &apos;2023-06-01&apos; AND sale_date &lt; &apos;2023-07-01&apos;</C>, not{" "}
            <C>month(sale_date) = 6</C> or <C>CAST(sale_date AS VARCHAR) LIKE &apos;2023-06%&apos;</C>
          </li>
          <li>
            <C>WHERE amount &gt; 100 / 1.2</C>, not <C>WHERE amount * 1.2 &gt; 100</C> (some optimizers rewrite simple arithmetic, many
            don&apos;t)
          </li>
          <li>
            <C>WHERE email = &apos;a@b.com&apos;</C> on a column stored lowercase, not <C>WHERE LOWER(email) = ...</C>
          </li>
          <li>
            <C>WHERE name LIKE &apos;Kim%&apos;</C> can use an index; <C>LIKE &apos;%Kim&apos;</C> can&apos;t, because the start is
            unknown
          </li>
        </UL>

        <H2 id="clustering">Sorted data skips more</H2>
        <P>
          Block skipping only works when similar values sit together. Dates in our table arrive in order, so each block covers a narrow date
          range. Customer IDs are scattered, so every block contains nearly every ID and nothing can be skipped:
        </P>
        <SqlBlock q={Q.cluster_unsorted} />
        <P>Store the same rows sorted by customer, and a range of 100 customers lives in one or two blocks:</P>
        <SqlBlock q={Q.cluster_sorted} />
        <P>
          This is what <strong>clustering</strong> or <strong>partitioning</strong> means in a warehouse: arranging data on disk by the
          columns people filter on most, usually a date. BigQuery has <C>PARTITION BY</C> and <C>CLUSTER BY</C> on tables, Snowflake has
          clustering keys, Redshift has sort keys. Choosing them well matters more than almost any query rewrite.
        </P>

        <H2 id="indexes">Indexes</H2>
        <P>
          In row-oriented databases built for many small reads and writes (PostgreSQL, MySQL, SQL Server, Oracle, SQLite), the main tool is
          the <strong>index</strong>: a separate, sorted structure (usually a B-tree) mapping column values to row locations. Like the index of
          a book, it lets the database jump straight to the matching rows instead of reading every page. Finding one row among a million takes
          about three or four steps down the tree instead of a million comparisons.
        </P>
        <SqlCode
          title="PostgreSQL (not runnable here): the same lookup before and after an index"
          sql={
            "EXPLAIN SELECT * FROM sales WHERE customer_id = 4242;\n--  Seq Scan on sales  (cost=0.00..17906.00 rows=10 width=24)\n--    Filter: (customer_id = 4242)\n\nCREATE INDEX sales_customer ON sales (customer_id);\n\nEXPLAIN SELECT * FROM sales WHERE customer_id = 4242;\n--  Index Scan using sales_customer on sales  (cost=0.42..44.58 rows=10 width=24)\n--    Index Cond: (customer_id = 4242)"
          }
        />
        <P>
          DuckDB supports <C>CREATE INDEX</C> too (it builds an ART index, also used to enforce primary keys), and uses it for highly selective
          equality lookups. The syntax is the same everywhere:
        </P>
        <SqlBlock q={Q.index} />
        <P>What to know about indexes:</P>
        <UL>
          <li>
            <strong>They help selective queries</strong>: lookups by ID, joins on a key, <C>ORDER BY ... LIMIT</C> on the indexed column. If a
            filter matches 30% of the table, a full scan is usually faster and the optimizer will ignore the index.
          </li>
          <li>
            <strong>They cost writes</strong>: every INSERT, UPDATE and DELETE must also update every index on the table, and each takes disk
            space. Index the columns you actually filter and join on, not everything.
          </li>
          <li>
            <strong>Column order matters in composite indexes</strong>. An index on <C>(state, city)</C> is sorted by state, then city. It
            helps <C>WHERE state = &apos;TX&apos;</C> and <C>WHERE state = &apos;TX&apos; AND city = &apos;Austin&apos;</C>, but not{" "}
            <C>WHERE city = &apos;Austin&apos;</C> alone, just as a phone book sorted by last name doesn&apos;t help you find every
            &quot;Maria&quot;.
          </li>
          <li>
            <strong>Sargability applies here too</strong>: <C>WHERE LOWER(email) = ...</C> can&apos;t use an index on <C>email</C> (but
            PostgreSQL can index the expression <C>LOWER(email)</C> itself).
          </li>
          <li>
            <strong>Primary keys and UNIQUE constraints create indexes automatically</strong>; foreign keys usually don&apos;t (except in
            MySQL), and joining on an unindexed foreign key is a classic slow query.
          </li>
        </UL>

        <H2 id="optimizer">Trust the optimizer (mostly)</H2>
        <P>
          A lot of SQL performance folklore is about rewriting queries into &quot;faster&quot; equivalent forms. Modern optimizers already do
          most of that. EXISTS and IN, written very differently, produce the same semi join:
        </P>
        <SqlBlock q={Q.semi_exists} />
        <SqlBlock q={Q.semi_in} />
        <P>
          Both are a <C>SEMI</C> hash join: for each customer, stop at the first matching order. The same goes for CTEs (usually inlined like a
          subquery), correlated subqueries (DuckDB, PostgreSQL and SQL Server rewrite many of them into joins) and predicate order in WHERE.
          Write the clearest version first, and change it only if EXPLAIN shows a problem.
        </P>

        <H2 id="fanout">The fan-out trap</H2>
        <P>
          The most common performance problem in analytics SQL is also a correctness bug. Revenue and session count for customer 85, in one
          query:
        </P>
        <SqlBlock q={Q.fanout_wrong} />
        <P>
          The revenue is 10× too high. Orders-to-items and customer-to-sessions are both one-to-many, so joining them pairs every item row with
          every session row:
        </P>
        <SqlBlock q={Q.fanout_check} />
        <P>
          16 × 10 = 160 rows, each item counted once per session. On real data this turns millions of rows into billions, which is why the
          query is also slow. The fix: aggregate each table to one row per customer, then join one row to one row:
        </P>
        <SqlBlock q={Q.fanout_right} />
        <Gotcha>
          A <C>SELECT DISTINCT</C> or <C>COUNT(DISTINCT ...)</C> added to &quot;fix&quot; duplicate rows after a join is a warning sign. It
          usually hides a fan-out, costs a large sort or hash, and leaves SUMs wrong. Check row counts at each join instead.
        </Gotcha>

        <H2 id="approx">When close enough is enough</H2>
        <P>
          Exact <C>COUNT(DISTINCT)</C> has to remember every value it has seen. HyperLogLog-based approximations use a few kilobytes of memory
          regardless of size, and are typically within a few percent:
        </P>
        <SqlBlock q={Q.approx} />
        <P>
          96,408 against an exact 100,000: off by 3.6%. For a dashboard tile showing &quot;~100K customers&quot; that&apos;s fine; for billing,
          it isn&apos;t. BigQuery, Snowflake, Redshift and SQL Server 2019+ all have <C>APPROX_COUNT_DISTINCT</C>; PostgreSQL needs an
          extension.
        </P>

        <H2 id="checklist">A checklist for slow queries</H2>
        <UL>
          <li>Run <C>EXPLAIN ANALYZE</C>. Find the operator with the most time and the biggest row counts.</li>
          <li>Check estimates against actuals; refresh statistics if they&apos;re far apart.</li>
          <li>Filter on raw columns, with constants on the other side, and filter as early as possible.</li>
          <li>Select only the columns you need, especially on columnar warehouses.</li>
          <li>Aggregate before joining one-to-many tables; count rows after each join when in doubt.</li>
          <li>In row stores, index the columns you filter and join on; mind composite index order.</li>
          <li>In warehouses, partition or cluster big tables by the column most queries filter on.</li>
          <li>Measure before and after. A rewrite that doesn&apos;t change the plan doesn&apos;t change the speed.</li>
        </UL>

        <H2 id="practice">Practice</H2>
        <Exercise
          n={1}
          q="Read the plan for revenue by category. Which operator joins the tables, and which table's scan reads the most columns?"
          answer={Q.ex1}
        />
        <Exercise
          n={2}
          q="Rewrite this sargably: orders placed on Dec 24 or 25, 2025, written as WHERE strftime(order_date, '%m-%d') IN ('12-24', '12-25')."
          hint={<>Use a half-open date range on the raw column.</>}
          answer={Q.ex2}
        />
        <Exercise
          n={3}
          q="Count orders and units per channel without the fan-out bug (an order has several items)."
          hint={<>Aggregate order_items to one row per order first.</>}
          answer={Q.ex3}
        />
        <SqlPlayground
          start={
            "CREATE TABLE sales AS\nSELECT range AS sale_id,\n       DATE '2022-01-01' + CAST(range // 1000 AS INTEGER) AS sale_date,\n       ROUND(5 + (range * 37 % 9500) / 100.0, 2) AS amount\nFROM range(1000000);\n\nEXPLAIN ANALYZE\nSELECT SUM(amount) FROM sales\nWHERE sale_date BETWEEN DATE '2023-06-01' AND DATE '2023-06-30';"
          }
        />

        <H2 id="recap">Recap</H2>
        <UL>
          <li>EXPLAIN shows the plan; EXPLAIN ANALYZE adds real row counts and times. Read plans bottom-up.</li>
          <li>The biggest wins come from skipping work: fewer columns, sargable filters, sorted or partitioned data.</li>
          <li>Indexes make selective lookups fast in row stores, at the cost of slower writes.</li>
          <li>The optimizer rewrites equivalent queries for you; write for clarity, then measure.</li>
          <li>Aggregate before joining one-to-many tables: fan-out is both slow and wrong.</li>
        </UL>
        <P>
          That&apos;s the end of the series: from your first SELECT to reading query plans. Every query in all 13 parts still runs in the
          editors, so the best way to keep it is to go back and change them.
        </P>
        <SeriesNav current={13} />
        <p className="mt-6 text-sm italic text-gray-600 dark:text-gray-400">
          The store data is synthetic. Queries run in your browser with DuckDB-WASM; changes are rolled back after each run. Timings depend on
          your device.
        </p>
      </Narrow>
    </Wide>
  );
};

export default Sql13Story;
