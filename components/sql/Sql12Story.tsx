import { H2, Narrow, P, Scrolly, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { SqlBlock, SqlCode, SqlPlayground, type Saved } from "@/components/sql/SqlBlock";
import { C, Dialect, Exercise, Gotcha, MiniTable, SeriesNav, type MiniRow } from "@/components/sql/SqlKit";
import R from "lib/sql/results/12-modeling-dml.json";

/** SQL series, part 12: modeling (keys, normalization, star schemas), DDL, DML and transactions. */

const Q = R as Record<string, Saved>;
const H3: React.FC<{ children: React.ReactNode }> = ({ children }) => <h3 className="mt-8 mb-2 text-lg font-semibold">{children}</h3>;
const WIDE: MiniRow[] = [
  [1001, "Kenji Martin", "Miami", "Chocolate"],
  [1002, "Kenji Martin", "Miami", "Charger"],
  [1009, "Kenji Martin", "Miami", "Earbuds"],
  [1064, "Kenji Martin", "Miami", "USB-C Cable"],
];
const TRY: MiniRow[] = [
  [1, 3, 5, "stored"],
  [1, 7, 4, "duplicate key"],
  [2, 3, 6, "CHECK failed"],
  [3, null, 5, "NOT NULL failed"],
  [4, 999, 5, "no product 999"],
];
const PR: MiniRow[] = [
  ["Coffee Beans", "Grocery", 13.74],
  ["Trail Mix", "Grocery", 8.79],
  ["Rain Boots", "Footwear", 44.5],
  ["Green Tea", "Grocery", 7.69],
];

const Sql12Story: React.FC = () => {
  const steps: Step[] = [
    {
      key: "normalize",
      body: (
        <>
          <strong>Store each fact once.</strong> A wide table repeats Kenji&apos;s name and city on every order. Move them to a{" "}
          <C>customers</C> table and keep only <C>customer_id</C> on the order. Now his city lives in one place.
        </>
      ),
    },
    {
      key: "constraints",
      body: (
        <>
          <strong>Constraints reject bad rows.</strong> A primary key refuses duplicates, CHECK refuses impossible values, NOT NULL refuses
          missing ones, and a foreign key refuses references to rows that don&apos;t exist.
        </>
      ),
    },
    {
      key: "update",
      body: (
        <>
          <strong>UPDATE changes what WHERE matches.</strong> A 10% price rise on groceries touches three rows. The same statement without the
          WHERE would change every product.
        </>
      ),
    },
    {
      key: "tx",
      body: (
        <>
          <strong>Transactions make changes all-or-nothing.</strong> Move 30 from Ava to Ben in two UPDATEs inside BEGIN ... COMMIT. If anything
          fails in between, ROLLBACK undoes both.
        </>
      ),
    },
  ];
  const chartFor = (s: number) => {
    if (s === 0)
      return (
        <div className="grid gap-3">
          <MiniTable cols={["order_id", "customer", "city", "product"]} rows={WIDE} state={WIDE.map(() => "drop")} sql="-- wide: customer repeated" />
          <MiniTable cols={["customer_id", "name", "city"]} rows={[[85, "Kenji Martin", "Miami"]]} state={["keep"]} sql="-- customers: once" />
        </div>
      );
    if (s === 1) return <MiniTable cols={["review_id", "product_id", "rating", "result"]} rows={TRY} state={TRY.map((r) => (r[3] === "stored" ? "keep" : "drop"))} sql="INSERT INTO reviews VALUES ..." />;
    if (s === 2)
      return (
        <MiniTable
          cols={["name", "category", "price"]}
          rows={PR}
          state={PR.map((r) => (r[1] === "Grocery" ? "keep" : null))}
          sql={"UPDATE products\nSET price = ROUND(price * 1.10, 2)\nWHERE category = 'Grocery';"}
        />
      );
    return (
      <MiniTable
        cols={["owner", "balance"]}
        rows={[
          ["Ava", 70],
          ["Ben", 80],
        ]}
        state={["keep", "keep"]}
        sql={"BEGIN;\nUPDATE ... Ava - 30;\nUPDATE ... Ben + 30;\nCOMMIT;"}
      />
    );
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:48", src: "/explainers/sql-12/intuition.mp4", poster: "/explainers/sql-12/intuition-poster.jpg", square: true },
            { key: "steps", label: "Step by step", len: "1:40", src: "/explainers/sql-12/steps.mp4", poster: "/explainers/sql-12/steps-poster.jpg" },
          ]}
          note="The intuition video covers normalization, constraints, UPDATE and transactions. The step-by-step video sends six INSERTs at a table with constraints and shows which survive."
        />
        <P>
          Eleven parts in, every query has read data. This one is about the other side: designing tables, putting rows in, changing and
          removing them, and keeping the data correct while you do. Even if you mostly write SELECTs, knowing why tables are shaped the way they
          are makes every join easier to reason about. This is part 12 of the SQL series.
        </P>
        <Dialect title="Everything here is safe to run">
          The editor on this page wraps each run in a transaction and rolls it back afterwards. You can create tables, update every row or
          delete everything, see the result, and the next run starts from the original data. That&apos;s also why you&apos;ll see each
          example recreate the tables it needs.
        </Dialect>
        <H2 id="how-it-works">Four ideas</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="normalization">Why tables are split up</H2>
        <P>Joining four tables gives one wide row per item sold, with everything about the order, customer and product on it:</P>
        <SqlBlock q={Q.denormalized} />
        <P>
          Kenji&apos;s name, email and city are repeated on every line. Across the whole store, each customer&apos;s email would be stored about
          6 times:
        </P>
        <SqlBlock q={Q.redundancy} />
        <P>
          Repetition isn&apos;t just wasted space. If Kenji moves, you have to update every copy; miss one and the data contradicts itself (an{" "}
          <strong>update anomaly</strong>). You can&apos;t record a customer until they order (an <strong>insert anomaly</strong>). Delete his
          only order and you lose the customer too (a <strong>delete anomaly</strong>).
        </P>
        <P>
          <strong>Normalization</strong> is the discipline of removing that repetition: each fact lives in one place, and other tables refer
          to it by key. The usual targets, informally:
        </P>
        <UL>
          <li>
            <strong>1NF</strong>: one value per cell. No comma-separated lists of products in an order row; use a separate{" "}
            <C>order_items</C> table.
          </li>
          <li>
            <strong>2NF</strong>: every column depends on the whole key. In <C>order_items</C> (key: order and product), the product&apos;s
            name depends on product alone, so it belongs in <C>products</C>.
          </li>
          <li>
            <strong>3NF</strong>: no column depends on another non-key column. If orders stored both <C>customer_id</C> and the
            customer&apos;s city, the city depends on the customer, not the order.
          </li>
        </UL>
        <P>
          Our store is in third normal form, which is why answering almost any question takes joins. Note what <C>order_items</C> keeps
          deliberately: <C>unit_price</C>, the price <em>at the time of sale</em>. That&apos;s not a copy of <C>products.price</C>; it&apos;s a
          different fact that happens to start with the same value.
        </P>

        <H3>Star schemas: denormalizing on purpose</H3>
        <P>
          Analytics warehouses often organize data as a <strong>star schema</strong>: a central <strong>fact table</strong> of events or
          transactions (one row per item sold, with quantities and amounts) surrounded by <strong>dimension tables</strong> describing the
          who, what, where and when (customers, products, stores, dates). Dimensions are often flattened (category name stored right on the
          product row) because they change rarely and reads vastly outnumber writes. Our <C>order_items</C> table works as a fact table:
        </P>
        <SqlBlock q={Q.star} />
        <P>
          The rule of thumb: normalize where data is written (applications), denormalize where it&apos;s read in bulk (warehouses, dashboards).
        </P>

        <H2 id="create-table">CREATE TABLE and constraints</H2>
        <P>
          A table definition names each column, gives it a type, and declares the rules every row must follow. Here&apos;s a reviews table
          wired to the existing products and customers:
        </P>
        <SqlBlock q={Q.create} />
        <UL>
          <li>
            <C>PRIMARY KEY</C>: unique and never NULL. Every table should have one; it&apos;s how other tables point to a row.
          </li>
          <li>
            <C>REFERENCES</C> (a <strong>foreign key</strong>): the value must exist in the other table&apos;s key.
          </li>
          <li>
            <C>NOT NULL</C>: the value must be present.
          </li>
          <li>
            <C>CHECK</C>: any true/false condition on the row.
          </li>
          <li>
            <C>DEFAULT</C>: the value used when an INSERT leaves the column out. <C>title</C> has no NOT NULL, so review 3 stores NULL.
          </li>
          <li>
            <C>UNIQUE</C> (not used here): no duplicates, but NULL allowed. Good for emails and other natural identifiers.
          </li>
        </UL>
        <P>Now try to insert bad data. A duplicate key:</P>
        <SqlBlock q={Q.pk_dup} />
        <P>A rating outside the allowed range:</P>
        <SqlBlock q={Q.check_fail} />
        <P>A review of no product:</P>
        <SqlBlock q={Q.notnull_fail} />
        <P>A review of a product that doesn&apos;t exist:</P>
        <SqlBlock q={Q.fk_fail} />
        <P>
          Each mistake is caught at the door with a precise message, instead of surfacing months later as a broken join or an average rating
          of 5.3. Constraints are the cheapest data quality tool there is.
        </P>
        <Dialect>
          Many warehouses (Snowflake, BigQuery, Redshift) let you declare primary and foreign keys but <strong>don&apos;t enforce them</strong>;
          they&apos;re hints for the optimizer. There, duplicates and orphans are your job to detect. Foreign keys can also say what happens when
          the parent is deleted: <C>ON DELETE CASCADE</C> (delete the children too) or <C>SET NULL</C>, in PostgreSQL, MySQL and SQL Server.
          DuckDB doesn&apos;t support cascading actions. MySQL only enforces CHECK from version 8.0.16.
        </Dialect>
        <P>When the database doesn&apos;t enforce keys for you, check them with the anti-join from part 5:</P>
        <SqlBlock q={Q.orphans} />
        <P>
          No orphans, and one order without items (order 1420, a cancelled order). And check that a would-be key really is
          unique:
        </P>
        <SqlBlock q={Q.dup_check} />
        <P>No rows: each product appears at most once per order, so (order_id, product_id) could be declared as a composite primary key.</P>

        <H3>Data types matter</H3>
        <P>
          Pick the type that matches the meaning. Money in <C>DECIMAL</C> (exact), not <C>DOUBLE</C> (binary floating point, which can&apos;t
          represent 0.1 exactly). Dates as <C>DATE</C>, not text, so they sort and subtract correctly:
        </P>
        <SqlBlock q={Q.types} />

        <H2 id="insert">INSERT</H2>
        <P>
          Two forms. <C>INSERT ... VALUES</C> adds rows you write out, as in the reviews example; always list the columns, so the statement
          survives someone adding a column later. <C>INSERT ... SELECT</C> adds the result of a query:
        </P>
        <SqlBlock q={Q.insert_select} />
        <P>
          <C>CREATE TABLE ... AS SELECT</C> (CTAS) creates and fills a table in one step. It copies the data, not the constraints, so it&apos;s
          best for snapshots and intermediate results:
        </P>
        <SqlBlock q={Q.ctas} />
        <P>
          An <strong>upsert</strong> inserts new rows and updates the ones that already exist, keyed on a unique column. Restocking inventory,
          where some products are new and some need their count increased (<C>excluded</C> means the row you tried to insert):
        </P>
        <SqlBlock q={Q.upsert} />
        <Dialect>
          <C>ON CONFLICT ... DO UPDATE</C> is PostgreSQL, SQLite and DuckDB. MySQL uses <C>ON DUPLICATE KEY UPDATE</C>. SQL Server, Oracle,
          Snowflake and BigQuery use the standard <C>MERGE</C> statement, which PostgreSQL also supports since version 15.
        </Dialect>

        <H2 id="update">UPDATE</H2>
        <P>
          <C>UPDATE</C> sets new values on every row the WHERE matches. The right side can use the row&apos;s current values. Groceries go up
          10%:
        </P>
        <SqlBlock q={Q.update} />
        <P>
          <C>RETURNING</C> shows exactly which rows changed. Customer 85 returned everything from November:
        </P>
        <SqlBlock q={Q.update_returning} />
        <P>And the mistake everyone makes once:</P>
        <SqlBlock q={Q.update_all_oops} />
        <Gotcha>
          An UPDATE or DELETE without WHERE affects <strong>every row</strong>, with no confirmation. Habit that prevents it: write the WHERE
          first, as a SELECT, check the count, then change SELECT to UPDATE. In a real database, start a transaction first so a bad count can be
          rolled back.
        </Gotcha>
        <P>
          To update from another table, join it in with <C>FROM</C>. Resetting an order&apos;s line prices to the current catalog price:
        </P>
        <SqlBlock q={Q.update_from} />
        <Dialect>
          <C>UPDATE ... FROM</C> is PostgreSQL, SQL Server, SQLite and DuckDB. MySQL writes it as <C>UPDATE order_items JOIN products ...
          SET</C>. Oracle uses a subquery or MERGE. <C>RETURNING</C> works in PostgreSQL, SQLite 3.35+ and DuckDB; SQL Server has{" "}
          <C>OUTPUT</C>; MySQL has neither.
        </Dialect>

        <H2 id="delete">DELETE</H2>
        <P>Delete the order that has no items, and see what was removed:</P>
        <SqlBlock q={Q.delete} />
        <P>Delete all cancelled orders and look at what&apos;s left:</P>
        <SqlBlock q={Q.delete_count} />
        <P>
          Notice the problem: the cancelled orders&apos; items in <C>order_items</C> are now orphans, because our tables don&apos;t declare
          foreign keys. With a foreign key, the DELETE would have been refused (or cascaded). The same look-first habit applies:
        </P>
        <SqlBlock q={Q.delete_safe} />
        <P>
          Many production systems never hard-delete business records. A <strong>soft delete</strong> adds a <C>deleted_at</C> timestamp and
          filters on <C>deleted_at IS NULL</C>, so history and audit trails survive. <C>TRUNCATE</C> empties a whole table quickly; <C>DROP
          TABLE</C> removes the table itself.
        </P>

        <H2 id="alter-view">ALTER TABLE and views</H2>
        <P>Tables change shape over time. Add a column with a default, rename another:</P>
        <SqlBlock q={Q.alter} />
        <P>
          A <strong>view</strong> is a saved query that behaves like a table. It stores no data; each query against it runs the underlying
          SELECT. Views give a stable, simple name to logic people would otherwise copy and paste:
        </P>
        <SqlBlock q={Q.view} />
        <P>
          A <strong>materialized view</strong> (PostgreSQL, Oracle, Snowflake, BigQuery) does store the result, trading freshness for speed;
          it has to be refreshed when the base tables change.
        </P>

        <H2 id="transactions">Transactions</H2>
        <P>
          A transaction groups statements so they succeed or fail as a unit. Transferring money is the classic example: subtracting from one
          account and adding to another must both happen, or neither:
        </P>
        <SqlCode
          sql={
            "BEGIN;\n\nUPDATE accounts SET balance = balance - 30 WHERE owner = 'Ava';\nUPDATE accounts SET balance = balance + 30 WHERE owner = 'Ben';\n\n-- check anything you like here, then:\nCOMMIT;      -- make both changes permanent\n-- or\nROLLBACK;    -- undo both, as if nothing happened"
          }
          title="SQL (BEGIN/COMMIT can't run inside this page's editor, which already wraps each run in a transaction)"
        />
        <P>Transactions provide the four <strong>ACID</strong> guarantees:</P>
        <UL>
          <li>
            <strong>Atomicity</strong>: all statements take effect, or none do. A crash between the two UPDATEs leaves both balances unchanged.
          </li>
          <li>
            <strong>Consistency</strong>: constraints hold at the end. If the second UPDATE broke a CHECK, the whole transaction fails.
          </li>
          <li>
            <strong>Isolation</strong>: other sessions don&apos;t see your half-finished work. How strictly is set by the isolation level.
          </li>
          <li>
            <strong>Durability</strong>: once COMMIT returns, the change survives a crash or power loss.
          </li>
        </UL>
        <P>
          Outside an explicit BEGIN, most databases run each statement in its own transaction and commit it immediately (<em>autocommit</em>),
          which is exactly why an UPDATE without WHERE is instantly permanent.
        </P>
        <Dialect>
          Default isolation is <C>READ COMMITTED</C> in PostgreSQL, SQL Server and Oracle, and <C>REPEATABLE READ</C> in MySQL (InnoDB).
          PostgreSQL can roll back <C>CREATE TABLE</C> and other schema changes inside a transaction; MySQL and Oracle commit implicitly before
          DDL, so a schema change can&apos;t be undone with ROLLBACK there.
        </Dialect>

        <H2 id="practice">Practice</H2>
        <Exercise
          n={1}
          q="Create a wishlist table where each customer can save each product at most once, with the date added. Insert a few rows and list them with product names."
          hint={<>A composite primary key on (customer_id, product_id) enforces &quot;at most once&quot;.</>}
          answer={Q.ex1}
        />
        <Exercise n={2} q="Move every customer with 8 or more orders to the business segment, and show who changed." answer={Q.ex2} />
        <Exercise n={3} q="Delete all events from tablet sessions, then confirm none are left." answer={Q.ex3} />
        <SqlPlayground start={"CREATE TABLE notes (\n  note_id INTEGER PRIMARY KEY,\n  body    VARCHAR NOT NULL\n);\nINSERT INTO notes VALUES (1, 'try breaking me');\nSELECT * FROM notes;"} />

        <H2 id="recap">Recap</H2>
        <UL>
          <li>Normalize: store each fact once and refer to it by key; warehouses denormalize into star schemas for reading.</li>
          <li>Constraints (PRIMARY KEY, FOREIGN KEY, NOT NULL, CHECK, UNIQUE) reject bad data at write time.</li>
          <li>INSERT ... VALUES / SELECT, upserts with ON CONFLICT or MERGE, CTAS for snapshots.</li>
          <li>UPDATE and DELETE change what WHERE matches: SELECT first, use RETURNING, keep a transaction open.</li>
          <li>Transactions make groups of changes atomic, consistent, isolated and durable.</li>
        </UL>
        <P>Next, the last part: making queries fast with indexes and query plans.</P>
        <SeriesNav current={12} />
        <p className="mt-6 text-sm italic text-gray-600 dark:text-gray-400">
          The store data is synthetic. Queries run in your browser with DuckDB-WASM; changes are rolled back after each run.
        </p>
      </Narrow>
    </Wide>
  );
};

export default Sql12Story;
