import Link from "next/link";

import { H2, Narrow, P, Scrolly, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { SqlBlock, SqlPlayground, type Saved } from "@/components/sql/SqlBlock";
import { C, Dialect, Exercise, Gotcha, MiniTable, SeriesNav, type MiniRow } from "@/components/sql/SqlKit";
import R from "lib/sql/results/02-sorting-case.json";

/** SQL series, part 2: ORDER BY, LIMIT, DISTINCT, functions and CASE. */

const Q = R as Record<string, Saved>;
const COLS = ["name", "category", "price"];
const BASE: MiniRow[] = [
  ["Trail Running Shoes", "Footwear", "89.99"],
  ["Everyday Sneakers", "Footwear", "59.99"],
  ["Rain Boots", "Footwear", "44.50"],
  ["Water Bottle", "Outdoor", "24.99"],
  ["Daypack 20L", "Outdoor", "64.00"],
  ["Two-Person Tent", "Outdoor", "179.00"],
  ["Wireless Earbuds", "Electronics", "79.00"],
  ["Coffee Beans 1lb", "Grocery", "12.49"],
];
const SORTED = [...BASE].sort((a, b) => Number(b[2]) - Number(a[2]));
const tier = (p: number) => (p >= 100 ? "premium" : p >= 30 ? "standard" : "budget");

const Sql02Story: React.FC = () => {
  const steps: Step[] = [
    {
      key: "unsorted",
      body: (
        <>
          <strong>Rows have no built-in order.</strong> A table is a set of rows, and without ORDER BY the database may return them in any
          order: often insertion order, but that can change with the data, the engine version or a parallel plan. Never rely on it.
        </>
      ),
    },
    {
      key: "sorted",
      body: (
        <>
          <strong>ORDER BY sorts.</strong> <C>ORDER BY price DESC</C> puts the most expensive first. <C>ASC</C> (ascending) is the default.
        </>
      ),
    },
    {
      key: "limit",
      body: (
        <>
          <strong>LIMIT cuts.</strong> After sorting, <C>LIMIT 3</C> keeps the first three rows: a &quot;top 3&quot;. LIMIT is applied last,
          to the finished, sorted result.
        </>
      ),
    },
    {
      key: "distinct",
      body: (
        <>
          <strong>DISTINCT dedupes.</strong> <C>SELECT DISTINCT category</C> returns each category once, however many products share it.
        </>
      ),
    },
    {
      key: "case",
      body: (
        <>
          <strong>CASE labels.</strong> A CASE expression checks its WHEN conditions top to bottom and returns the value of the{" "}
          <em>first</em> one that&apos;s true, here turning prices into tiers.
        </>
      ),
    },
  ];
  const chartFor = (s: number) => {
    if (s === 0) return <MiniTable cols={COLS} rows={BASE} sql={"SELECT name, category, price\nFROM products;"} />;
    if (s === 1) return <MiniTable cols={COLS} rows={SORTED} sql={"SELECT name, category, price\nFROM products\nORDER BY price DESC;"} />;
    if (s === 2) return <MiniTable cols={COLS} rows={SORTED} state={SORTED.map((_, i) => (i < 3 ? "keep" : "gone"))} sql={"SELECT name, category, price\nFROM products\nORDER BY price DESC\nLIMIT 3;"} />;
    if (s === 3) {
      const cats = BASE.map((r) => r[1] as string);
      return (
        <MiniTable
          cols={["category"]}
          rows={BASE.map((r) => [r[1]])}
          state={cats.map((c, i) => (cats.indexOf(c) === i ? "keep" : "drop"))}
          extra={{ head: "duplicate?", vals: cats.map((c, i) => (cats.indexOf(c) === i ? "first" : "yes, removed")) }}
          sql={"SELECT DISTINCT category\nFROM products;"}
        />
      );
    }
    return (
      <MiniTable
        cols={COLS}
        rows={BASE}
        show={[true, false, true]}
        extra={{ head: "tier", vals: BASE.map((r) => tier(Number(r[2]))) }}
        sql={"SELECT name, price,\n  CASE WHEN price >= 100 THEN 'premium'\n       WHEN price >= 30  THEN 'standard'\n       ELSE 'budget'\n  END AS tier\nFROM products;"}
      />
    );
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:48", src: "/explainers/sql-02/intuition.mp4", poster: "/explainers/sql-02/intuition-poster.jpg", square: true },
            { key: "steps", label: "Step by step", len: "1:40", src: "/explainers/sql-02/steps.mp4", poster: "/explainers/sql-02/steps-poster.jpg" },
          ]}
          note="The intuition video shows the four tools in under a minute. The step-by-step video runs one query through FROM, WHERE, SELECT, ORDER BY and LIMIT in order."
        />
        <P>
          In <Link className="link" href="/blog/posts/sql-select-where-explained/">part 1</Link> we chose columns with SELECT and rows with
          WHERE. This post is about shaping the answer: putting rows in order, keeping the top few, removing duplicates, transforming values
          with functions, and adding if-then logic with <C>CASE</C>. Every query is live: click to edit, press Run.
        </P>
        <H2 id="how-it-works">Four ways to shape a result</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="order-by">ORDER BY</H2>
        <P>
          <C>ORDER BY</C> goes after WHERE and sorts the result by one or more columns. Add <C>DESC</C> for largest-first; <C>ASC</C> is the
          default.
        </P>
        <SqlBlock q={Q.order_price} max={6} />
        <P>
          With several columns, the second only breaks ties in the first, and each column gets its own direction. Products by category A to Z,
          and within each category, priciest first:
        </P>
        <SqlBlock q={Q.order_multi} max={9} />
        <P>Text sorts alphabetically (more precisely, by the column&apos;s collation). A classic phone-book order:</P>
        <SqlBlock q={Q.order_text} max={8} />
        <P>
          Because ORDER BY runs <em>after</em> SELECT, it can use column aliases, which WHERE (in standard SQL) can&apos;t:
        </P>
        <SqlBlock q={Q.order_alias} />
        <P>
          You can also sort by column position (<C>ORDER BY 1, 3</C> means the first and third selected columns). It&apos;s quick when
          exploring but fragile in saved queries: reorder the SELECT list and the sort silently changes.
        </P>
        <SqlBlock q={Q.order_position} max={5} />

        <H2 id="nulls">Where NULLs sort</H2>
        <P>
          NULL isn&apos;t smaller or larger than anything, so each database picks a convention. DuckDB and PostgreSQL put NULLs{" "}
          <strong>last</strong> when sorting ascending (and first when descending):
        </P>
        <SqlBlock q={Q.order_nulls_default} />
        <P>
          Say <C>NULLS FIRST</C> or <C>NULLS LAST</C> to control it explicitly:
        </P>
        <SqlBlock q={Q.order_nulls_first} />
        <Dialect>
          <UL>
            <li>
              <strong>NULLs last for ASC</strong>: PostgreSQL, DuckDB, Oracle, Snowflake. <strong>NULLs first for ASC</strong>: MySQL, SQL
              Server, SQLite, BigQuery.
            </li>
            <li>
              <C>NULLS FIRST / LAST</C> works in PostgreSQL, DuckDB, Oracle, Snowflake, BigQuery and SQLite (3.30+). MySQL and SQL Server
              don&apos;t support it; sort on <C>city IS NULL</C> first instead (it&apos;s 0 or 1).
            </li>
          </UL>
        </Dialect>

        <H2 id="limit">LIMIT, top-N and ties</H2>
        <P>
          <C>LIMIT n</C> returns the first n rows of the finished result. With ORDER BY, that&apos;s a top-N:
        </P>
        <SqlBlock q={Q.limit_top} />
        <P>
          The catch is ties. The two most recent orders are on Dec 31 and Dec 30, but <em>two</em> orders share Dec 28, and LIMIT 3 has to pick
          one of them. Which one is up to the database and can change between runs:
        </P>
        <SqlBlock q={Q.limit_ties} />
        <P>
          Make the order deterministic by adding a tie-breaker, usually a unique column like the ID:
        </P>
        <SqlBlock q={Q.limit_ties_fix} />
        <Gotcha>
          LIMIT without ORDER BY returns an arbitrary set of rows. It&apos;s fine for a quick peek (<C>LIMIT 5</C>), never for a real answer.
        </Gotcha>
        <P>
          <C>OFFSET</C> skips rows first, which is how pages of results are built (page 2 of 5-per-page):
        </P>
        <SqlBlock q={Q.offset} />
        <P>
          OFFSET is simple but gets slow on deep pages, because the database still produces and throws away all the skipped rows. Large
          applications paginate by remembering the last value seen instead (<C>WHERE price &lt; 49.99 ORDER BY price DESC LIMIT 5</C>), called
          keyset pagination.
        </P>
        <Dialect>
          SQL Server uses <C>SELECT TOP 3 ...</C> or <C>OFFSET 5 ROWS FETCH NEXT 5 ROWS ONLY</C>; Oracle and standard SQL use <C>FETCH FIRST 3
          ROWS ONLY</C>. PostgreSQL also supports <C>FETCH FIRST 3 ROWS WITH TIES</C>, which keeps every row tied with the last one.
        </Dialect>

        <H2 id="distinct">DISTINCT</H2>
        <P>
          <C>SELECT DISTINCT</C> removes duplicate rows from the result. Which states do our customers live in?
        </P>
        <SqlBlock q={Q.distinct_one} max={12} />
        <P>
          DISTINCT applies to the <strong>whole row</strong>, not just the first column. With two columns you get each distinct
          combination:
        </P>
        <SqlBlock q={Q.distinct_two} />
        <P>
          (That query joins two tables, which part 4 covers.) Unlike{" "}
          <C>=</C>, DISTINCT treats all NULLs as the same value, so they collapse into one row:
        </P>
        <SqlBlock q={Q.distinct_null} />
        <P>
          Inside an aggregate, <C>COUNT(DISTINCT x)</C> counts distinct non-NULL values. 420 orders came from 133 different customers:
        </P>
        <SqlBlock q={Q.count_distinct} />
        <P>
          PostgreSQL and DuckDB also have <C>DISTINCT ON (...)</C>: keep the first row for each value of the listed columns, according to
          ORDER BY. Here, each customer&apos;s first order:
        </P>
        <SqlBlock q={Q.distinct_on} />
        <P>
          It&apos;s not standard SQL; elsewhere you&apos;d write this with a window function (<C>ROW_NUMBER()</C>, part 6).
        </P>
        <Gotcha>
          Reaching for DISTINCT to make duplicate rows go away often hides a bug, usually a join that multiplies rows. Find out <em>why</em>{" "}
          the duplicates appear before deduplicating.
        </Gotcha>

        <H2 id="functions">Functions and expressions</H2>
        <P>
          SELECT can compute anything from a row&apos;s values. Text functions: <C>||</C> joins strings, <C>UPPER</C>/<C>LOWER</C> change
          case, <C>LENGTH</C> counts characters, <C>LEFT</C> takes a prefix:
        </P>
        <SqlBlock q={Q.funcs_text} />
        <P>
          Numbers: <C>ROUND(x, 2)</C>, <C>CEIL</C>, <C>FLOOR</C>, <C>ABS</C>, and casts that change a value&apos;s type. <C>x::INTEGER</C> is
          PostgreSQL/DuckDB shorthand for the standard <C>CAST(x AS INTEGER)</C>, which rounds here:
        </P>
        <SqlBlock q={Q.funcs_num} />
        <P>Division deserves a careful look:</P>
        <SqlBlock q={Q.int_div} />
        <Dialect>
          <C>7 / 2</C> is 3.5 in DuckDB and MySQL, but <strong>3</strong> in PostgreSQL, SQL Server and SQLite, which drop the fraction when both
          sides are integers. That silently breaks ratios like <C>completed / total</C>. Write <C>7 / 2.0</C> or <C>CAST(x AS DECIMAL)</C> /{" "}
          <C>x * 1.0</C> to be safe everywhere. String concatenation is <C>||</C> in most databases, <C>+</C> in SQL Server and{" "}
          <C>CONCAT()</C> in MySQL (where <C>||</C> means OR by default); <C>CONCAT()</C> works almost everywhere.
        </Dialect>

        <H2 id="case">CASE: if-then logic</H2>
        <P>
          <C>CASE</C> is SQL&apos;s if-else. It checks each <C>WHEN</C> in order and returns the <C>THEN</C> value of the first condition that&apos;s
          TRUE; if none match, it returns the <C>ELSE</C> value.
        </P>
        <SqlBlock q={Q.case_tiers} max={8} />
        <P>
          Order matters, because the first match wins. Swap the two WHENs and every product over $30 is caught by the first branch, so the $199
          watch becomes &quot;standard&quot;:
        </P>
        <SqlBlock q={Q.case_order_matters} />
        <P>
          The <em>simple</em> form compares one expression against values, like a switch statement:
        </P>
        <SqlBlock q={Q.case_simple} />
        <P>
          Without an ELSE, rows that match nothing get NULL. That&apos;s sometimes what you want, but often a silent gap:
        </P>
        <SqlBlock q={Q.case_no_else} />
        <P>
          CASE is an expression, so it works anywhere a value does: in ORDER BY for a custom sort order (returns first, then cancellations, then
          the rest)…
        </P>
        <SqlBlock q={Q.case_sort} max={6} />
        <P>…and inside aggregates to count by condition, a pattern we&apos;ll use constantly from part 3 on:</P>
        <SqlBlock q={Q.case_count} />

        <H2 id="order-of-execution">Where these fit in the run order</H2>
        <P>
          Adding to part 1, the logical order is <strong>FROM → WHERE → SELECT → DISTINCT → ORDER BY → LIMIT/OFFSET</strong>. So ORDER BY sees
          aliases and computed columns, and LIMIT applies to the final sorted, deduplicated result. (Part 3 slots GROUP BY and HAVING in after
          WHERE.)
        </P>

        <H2 id="practice">Practice</H2>
        <Exercise n={1} q="Find the two cheapest grocery products." answer={Q.ex1} />
        <Exercise n={2} q="Which categories have at least one product over $50? List each category once." answer={Q.ex2} />
        <Exercise
          n={3}
          q="Label each order 'in person' if its channel is 'store' and 'online' otherwise."
          hint={
            <>
              One <C>CASE WHEN ... THEN ... ELSE ... END</C>.
            </>
          }
          answer={Q.ex3}
        />
        <SqlPlayground start={"SELECT name, price\nFROM products\nORDER BY price DESC\nLIMIT 5;"} />

        <H2 id="recap">Recap</H2>
        <UL>
          <li>Without ORDER BY, row order is undefined. Add a unique tie-breaker when using LIMIT.</li>
          <li>NULLs sort last or first depending on the database: say NULLS FIRST/LAST.</li>
          <li>DISTINCT works on whole rows and treats NULLs as equal; COUNT(DISTINCT x) counts unique values.</li>
          <li>CASE returns the first matching WHEN; no ELSE means NULL.</li>
          <li>Integer division truncates in PostgreSQL, SQL Server and SQLite.</li>
        </UL>
        <P>Next: summarizing many rows into one with GROUP BY and aggregate functions.</P>
        <SeriesNav current={2} />
        <p className="mt-6 text-sm italic text-gray-600 dark:text-gray-400">
          The store data is synthetic. Queries run in your browser with DuckDB-WASM; changes are rolled back after each run.
        </p>
      </Narrow>
    </Wide>
  );
};

export default Sql02Story;
