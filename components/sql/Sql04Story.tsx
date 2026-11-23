import Link from "next/link";

import { H2, Narrow, P, Scrolly, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { SqlBlock, SqlPlayground, type Saved } from "@/components/sql/SqlBlock";
import { C, Dialect, Exercise, Gotcha, MiniTable, SchemaRef, SeriesNav, type MiniRow } from "@/components/sql/SqlKit";
import R from "lib/sql/results/04-joins.json";

/** SQL series, part 4: JOINs. */

const Q = R as Record<string, Saved>;
const CU: MiniRow[] = [
  [1, "Sophia"],
  [6, "Ethan"],
  [7, "Kenji"],
  [11, "Henry"],
];
const OR: MiniRow[] = [
  [1125, 6],
  [1127, 11],
  [1165, 11],
  [1190, 7],
  [1287, 6],
];
const name = (id: unknown) => CU.find((c) => c[0] === id)?.[1] ?? null;
const INNER: MiniRow[] = [
  ["Ethan", 1125],
  ["Ethan", 1287],
  ["Kenji", 1190],
  ["Henry", 1127],
  ["Henry", 1165],
];

const Sql04Story: React.FC = () => {
  const steps: Step[] = [
    {
      key: "two",
      body: (
        <>
          <strong>Two tables, one key.</strong> An order records <em>which</em> customer placed it (<C>customer_id</C>) but not their name.
          Names live once in <C>customers</C>. Splitting data this way avoids repeating a customer&apos;s details on every order; JOINs put it
          back together.
        </>
      ),
    },
    {
      key: "match",
      body: (
        <>
          <strong>Match on the key.</strong> <C>ON o.customer_id = c.customer_id</C> pairs each order with the customer row that has the
          same id. Ethan and Henry match two orders each.
        </>
      ),
    },
    {
      key: "inner",
      body: (
        <>
          <strong>INNER JOIN keeps matched pairs.</strong> Every order found its customer, giving 5 rows. A customer can appear several times,
          once per order. Sophia has no orders, so she&apos;s not in the result at all.
        </>
      ),
    },
    {
      key: "left",
      body: (
        <>
          <strong>LEFT JOIN keeps every left row.</strong> All customers stay. Where there&apos;s no matching order, the order columns are
          filled with NULL (amber). That&apos;s how you find customers who never ordered.
        </>
      ),
    },
  ];
  const chartFor = (s: number) => {
    if (s <= 1)
      return (
        <div className="grid grid-cols-2 gap-3">
          <MiniTable cols={["customer_id", "first_name"]} rows={CU} state={s === 1 ? CU.map((c) => (c[0] === 1 ? "drop" : "keep")) : undefined} sql="customers" />
          <MiniTable cols={["order_id", "customer_id"]} rows={OR} state={s === 1 ? OR.map(() => "keep") : undefined} extra={s === 1 ? { head: "→ customer", vals: OR.map((o) => String(name(o[1]))) } : null} sql="orders" />
        </div>
      );
    if (s === 2) return <MiniTable cols={["first_name", "order_id"]} rows={INNER} sql={"SELECT c.first_name, o.order_id\nFROM customers c\nJOIN orders o\n  ON o.customer_id = c.customer_id;"} />;
    return (
      <MiniTable
        cols={["first_name", "order_id"]}
        rows={[["Sophia", null], ...INNER]}
        state={["unknown", null, null, null, null, null]}
        sql={"SELECT c.first_name, o.order_id\nFROM customers c\nLEFT JOIN orders o\n  ON o.customer_id = c.customer_id;"}
      />
    );
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:48", src: "/explainers/sql-04/intuition.mp4", poster: "/explainers/sql-04/intuition-poster.jpg", square: true },
            { key: "steps", label: "Step by step", len: "1:44", src: "/explainers/sql-04/steps.mp4", poster: "/explainers/sql-04/steps-poster.jpg" },
          ]}
          note="The intuition video shows matching rows in under a minute. The step-by-step video walks a LEFT JOIN customer by customer, then covers the two most common join bugs."
        />
        <P>
          Real databases spread information across many tables, each describing one kind of thing: customers, orders, products. That design
          (normalization, part 12) keeps every fact in exactly one place. The price is that answering almost any interesting question means
          combining tables again, and that&apos;s what <C>JOIN</C> does. This is part 4 of the SQL series; it builds on{" "}
          <Link className="link" href="/blog/posts/sql-group-by-explained/">GROUP BY</Link> from part 3.
        </P>
        <H2 id="how-it-works">Matching rows across tables</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="keys">Keys: how tables point at each other</H2>
        <P>
          Each table has a <strong>primary key</strong>, a column that uniquely identifies a row (<C>customers.customer_id</C>). Other tables
          refer to it with a <strong>foreign key</strong> (<C>orders.customer_id</C>). Here&apos;s how our tables connect:
        </P>
        <UL>
          <li>
            <C>orders.customer_id</C> → <C>customers.customer_id</C>
          </li>
          <li>
            <C>order_items.order_id</C> → <C>orders.order_id</C>, and <C>order_items.product_id</C> → <C>products.product_id</C>
          </li>
          <li>
            <C>sessions.customer_id</C> → <C>customers</C>; <C>events.session_id</C> and <C>experiment.session_id</C> → <C>sessions</C>
          </li>
          <li>
            <C>employees.manager_id</C> → <C>employees.employee_id</C> (a table pointing at itself)
          </li>
        </UL>
        <SchemaRef only={["customers", "orders", "order_items", "products"]} />
        <P>On its own, the orders table can only tell you a customer&apos;s number:</P>
        <SqlBlock q={Q.orders_only} />

        <H2 id="inner">INNER JOIN</H2>
        <P>
          <C>JOIN ... ON condition</C> (INNER is the default) pairs every row of the left table with every row of the right table for which the
          condition is true. Short <strong>table aliases</strong> (<C>o</C>, <C>c</C>) keep it readable:
        </P>
        <SqlBlock q={Q.inner_basic} />
        <P>
          When a column name exists in both tables, you must say which one you mean, or the database refuses:
        </P>
        <SqlBlock q={Q.ambiguous} />
        <P>
          If the key has the same name on both sides, <C>USING (customer_id)</C> is a shortcut that also merges the two key columns into one:
        </P>
        <SqlBlock q={Q.using} />
        <P>
          Chain joins to reach across several tables. Revenue by product category needs line items (quantity, price), orders (status) and
          products (category):
        </P>
        <SqlBlock q={Q.three_tables} />
        <P>
          An INNER JOIN drops rows without a match on either side. Only 133 of 150 customers survive a join to orders:
        </P>
        <SqlBlock q={Q.inner_drops} />

        <H2 id="left">LEFT JOIN</H2>
        <P>
          <C>LEFT JOIN</C> (or <C>LEFT OUTER JOIN</C>) keeps every row of the left table. Rows with matches are paired as usual; rows without
          get NULLs for the right table&apos;s columns:
        </P>
        <SqlBlock q={Q.left_basic} />
        <P>
          Count carefully after a LEFT JOIN. <C>COUNT(*)</C> counts Sophia&apos;s NULL-padded row as 1; <C>COUNT(o.order_id)</C> skips the NULL
          and correctly gives 0:
        </P>
        <SqlBlock q={Q.left_count_trap} />

        <H2 id="anti">Finding what&apos;s missing: anti joins</H2>
        <P>
          A LEFT JOIN followed by <C>WHERE right.key IS NULL</C> keeps only the rows with <em>no</em> match, an <strong>anti join</strong>.
          The 17 customers who never ordered, newest first:
        </P>
        <SqlBlock q={Q.anti_join} max={6} />
        <P>
          <C>NOT EXISTS</C> says the same thing more directly, and databases optimize it well (part 5 covers subqueries):
        </P>
        <SqlBlock q={Q.not_exists} />

        <H2 id="on-vs-where">Pitfall: filtering in WHERE vs ON</H2>
        <P>
          Say you want every customer, with their December orders if they have any. Filtering the order date in WHERE looks natural:
        </P>
        <SqlBlock q={Q.filter_where} />
        <P>
          Only 63 customers. For customers without December orders the LEFT JOIN produced NULL dates, <C>NULL &gt;= &apos;2025-12-01&apos;</C> is
          NULL, and WHERE threw those rows away: the LEFT JOIN quietly became an INNER JOIN. Put conditions on the right table in the ON
          clause instead, so they decide what <em>matches</em> rather than which rows survive:
        </P>
        <SqlBlock q={Q.filter_on} />
        <SqlBlock q={Q.filter_on_detail} />
        <Gotcha>
          With a LEFT JOIN, conditions on the <strong>right</strong> table go in <C>ON</C>; conditions on the <strong>left</strong> table go in{" "}
          <C>WHERE</C>. A WHERE condition on the right table (other than <C>IS NULL</C>) turns the LEFT JOIN into an INNER JOIN.
        </Gotcha>

        <H2 id="right-full">RIGHT and FULL OUTER JOIN</H2>
        <P>
          <C>RIGHT JOIN</C> is a LEFT JOIN with the tables swapped. Most people rewrite it as a LEFT JOIN, which reads more naturally:
        </P>
        <SqlBlock q={Q.right_join} />
        <P>
          <C>FULL OUTER JOIN</C> keeps unmatched rows from <em>both</em> sides. It&apos;s the tool for reconciling two lists: here, a sales
          target per state against actual customers. Nevada has a target but no customers; Washington has customers but no target:
        </P>
        <SqlBlock q={Q.full_join} />
        <P>
          (<C>WITH</C> names a temporary result, a CTE, covered in part 5.) <C>COALESCE(p.state, a.state)</C> picks whichever side has the key.
        </P>
        <Dialect>MySQL has no FULL OUTER JOIN; emulate it with a LEFT JOIN UNION a RIGHT JOIN (part 9). SQLite added RIGHT and FULL joins in version 3.39.</Dialect>

        <H2 id="self">Self joins</H2>
        <P>
          A table can be joined to itself under two aliases. Each employee row stores its manager&apos;s id; joining employees to employees turns
          that id into a name. It&apos;s a LEFT JOIN so the CEO, who has no manager, stays:
        </P>
        <SqlBlock q={Q.self_join} max={8} />
        <P>Walking a hierarchy of unknown depth (manager&apos;s manager&apos;s …) needs a recursive query, part 10.</P>

        <H2 id="cross">CROSS JOIN</H2>
        <P>
          <C>CROSS JOIN</C> pairs every row of one table with every row of the other, with no condition: 3 channels × 3 statuses = 9 rows. A
          10,000-row table crossed with itself is 100 million rows, so use it deliberately.
        </P>
        <SqlBlock q={Q.cross_join} />
        <P>
          Its most useful job: building a complete grid, then LEFT JOINing the data onto it so combinations with no rows show up as 0 instead of
          disappearing (the missing-groups problem from part 3):
        </P>
        <SqlBlock q={Q.cross_fill} />

        <H2 id="fan-out">Pitfall: fan-out and grain</H2>
        <P>
          Every table has a <strong>grain</strong>: what one row represents. Orders are one row per order; order_items are one row per product
          in an order. Joining them gives one row per <em>item</em>, so each order is repeated once per item:
        </P>
        <SqlBlock q={Q.fanout_count} />
        <P>
          Count rows after that join and you count items, not orders. Here&apos;s the bug in a real report: orders per segment, with revenue:
        </P>
        <SqlBlock q={Q.fanout_wrong} />
        <P>
          <C>orders_wrong</C> is inflated by about 1.8×. <C>COUNT(DISTINCT o.order_id)</C> fixes counts, but sums of order-level values (a
          shipping fee, say) can&apos;t be fixed that way: aggregate each table to the same grain first, then join (part 5 shows how). Also notice
          419, not 420: one order has no line items, and the INNER JOIN silently dropped it.
        </P>
        <Gotcha>
          Before any join, ask: is the join key unique on at least one side? If both sides can repeat the key (many-to-many), rows multiply.
          After joining, sanity-check row counts against the tables you started from.
        </Gotcha>

        <H2 id="nulls">NULL keys never match</H2>
        <P>
          Since <C>NULL = NULL</C> is NULL, rows with a NULL key never match anything, not even another NULL. Here only the 1s pair up:
        </P>
        <SqlBlock q={Q.null_keys} />
        <P>
          That&apos;s usually right (an anonymous website session shouldn&apos;t match an anonymous customer), but it&apos;s worth knowing when a
          join returns fewer rows than you expect. Use <C>IS NOT DISTINCT FROM</C> in the ON clause if you really want NULLs to match.
        </P>

        <H2 id="practice">Practice</H2>
        <Exercise n={1} q="List orders placed by customers in Washington (WA), with the customer's name, oldest first." answer={Q.ex1} />
        <Exercise
          n={2}
          q="How many times has each product been ordered? Include products never ordered, least popular first."
          hint={
            <>
              Products LEFT JOIN order_items, then count a column from order_items.
            </>
          }
          answer={Q.ex2}
        />
        <Exercise
          n={3}
          q="Which five states produced the most revenue from completed orders?"
          hint={<>Three tables: customers → orders → order_items.</>}
          answer={Q.ex3}
        />
        <SqlPlayground start={"SELECT c.first_name, COUNT(o.order_id) AS orders\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.customer_id\nGROUP BY c.customer_id, c.first_name\nORDER BY orders DESC\nLIMIT 10;"} />

        <H2 id="recap">Recap</H2>
        <UL>
          <li>JOIN pairs rows whose keys match; INNER keeps matches only, LEFT keeps every left row (NULLs for no match), FULL keeps both sides.</li>
          <li>Anti join (LEFT JOIN + IS NULL, or NOT EXISTS) finds rows with no match.</li>
          <li>With LEFT JOIN, filter the right table in ON, not WHERE.</li>
          <li>Know each table&apos;s grain; joining one-to-many repeats rows (fan-out).</li>
          <li>NULL keys never match.</li>
        </UL>
        <P>Next: queries inside queries, with subqueries and CTEs.</P>
        <SeriesNav current={4} />
        <p className="mt-6 text-sm italic text-gray-600 dark:text-gray-400">
          The store data is synthetic. Queries run in your browser with DuckDB-WASM; changes are rolled back after each run.
        </p>
      </Narrow>
    </Wide>
  );
};

export default Sql04Story;
