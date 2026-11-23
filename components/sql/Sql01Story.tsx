import { H2, Narrow, P, Scrolly, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { SqlBlock, SqlPlayground } from "@/components/sql/SqlBlock";
import { C, Dialect, Exercise, Gotcha, MiniTable, SchemaRef, SeriesNav, type MiniRow } from "@/components/sql/SqlKit";
import R from "lib/sql/results/01-select-where.json";

/** SQL series, part 1: SELECT, FROM and WHERE. */

const Q = R as Record<string, { sql: string; columns?: string[]; rows?: (string | number | null)[][]; total?: number; error?: string }>;

const COLS = ["customer_id", "first_name", "city", "state", "signup_date"];
const ROWS: MiniRow[] = [
  [1, "Sophia", "Austin", "TX", "2025-10-02"],
  [2, "Aiden", "Houston", "TX", "2025-09-16"],
  [3, "Wei", "Portland", "OR", "2025-10-31"],
  [4, "Daniel", "Seattle", "WA", "2024-12-20"],
  [8, "Arjun", "New York", "NY", "2025-05-17"],
  [12, "Chloe", "Houston", "TX", "2024-01-26"],
  [51, "Chloe", null, "OR", "2024-06-14"],
  [60, "David", null, "MA", "2025-10-08"],
];
const tf = (b: boolean | null) => (b === null ? "NULL" : b ? "TRUE" : "FALSE");

const Sql01Story: React.FC = () => {
  const tx = ROWS.map((r) => r[3] === "TX");
  const both = ROWS.map((r, i) => tx[i] && String(r[4]) >= "2025-01-01");
  const notAustin = ROWS.map((r) => (r[2] === null ? null : r[2] !== "Austin"));

  const steps: Step[] = [
    {
      key: "table",
      body: (
        <>
          <strong>A table is a grid.</strong> Each row is one customer; each column is one fact about them, with a fixed type (number, text,
          date). <C>SELECT * FROM customers</C> asks for every column of every row. Here are 8 of the 150 rows.
        </>
      ),
    },
    {
      key: "select",
      body: (
        <>
          <strong>SELECT picks columns.</strong> Name the columns you want, in the order you want them. The other columns are still in the
          table; they're just not in your answer.
        </>
      ),
    },
    {
      key: "where",
      body: (
        <>
          <strong>WHERE picks rows.</strong> The condition <C>state = &apos;TX&apos;</C> is checked against every row. Rows where it&apos;s TRUE are
          kept (green); the rest are dropped.
        </>
      ),
    },
    {
      key: "and",
      body: (
        <>
          <strong>Combine conditions with AND.</strong> Adding <C>AND signup_date &gt;= &apos;2025-01-01&apos;</C> keeps only rows where{" "}
          <em>both</em> tests pass. Chloe from Houston is in Texas but signed up in 2024, so she&apos;s out. {both.filter(Boolean).length} of 8
          rows remain.
        </>
      ),
    },
    {
      key: "null",
      body: (
        <>
          <strong>Watch out for NULL.</strong> Two customers have no city on file: it&apos;s <C>NULL</C>, meaning unknown. For them,{" "}
          <C>city &lt;&gt; &apos;Austin&apos;</C> isn&apos;t TRUE or FALSE but NULL (amber), and WHERE only keeps TRUE. They vanish from both
          &quot;Austin&quot; and &quot;not Austin&quot;.
        </>
      ),
    },
  ];
  const chartFor = (s: number) => {
    if (s === 0) return <MiniTable cols={COLS} rows={ROWS} sql={"SELECT *\nFROM customers;"} />;
    if (s === 1) return <MiniTable cols={COLS} rows={ROWS} show={[false, true, true, true, false]} sql={"SELECT first_name, city, state\nFROM customers;"} />;
    if (s === 2)
      return (
        <MiniTable
          cols={COLS}
          rows={ROWS}
          state={tx.map((b) => (b ? "keep" : "drop"))}
          extra={{ head: "state = 'TX'", vals: tx.map(tf) }}
          sql={"SELECT *\nFROM customers\nWHERE state = 'TX';"}
        />
      );
    if (s === 3)
      return (
        <MiniTable
          cols={COLS}
          rows={ROWS}
          state={both.map((b) => (b ? "keep" : "drop"))}
          extra={{ head: "both TRUE?", vals: both.map(tf) }}
          sql={"SELECT *\nFROM customers\nWHERE state = 'TX'\n  AND signup_date >= '2025-01-01';"}
        />
      );
    return (
      <MiniTable
        cols={COLS}
        rows={ROWS}
        state={notAustin.map((b) => (b === null ? "unknown" : b ? "keep" : "drop"))}
        extra={{ head: "city <> 'Austin'", vals: notAustin.map(tf) }}
        sql={"SELECT *\nFROM customers\nWHERE city <> 'Austin';"}
      />
    );
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:48", src: "/explainers/sql-01/intuition.mp4", poster: "/explainers/sql-01/intuition-poster.jpg", square: true },
            { key: "steps", label: "Step by step", len: "1:40", src: "/explainers/sql-01/steps.mp4", poster: "/explainers/sql-01/steps-poster.jpg" },
          ]}
          note="The intuition video is the idea in under a minute. The step-by-step video shows the order the database actually runs a query in, and how NULL behaves."
        />
        <P>
          SQL (Structured Query Language) is how you ask questions of data stored in tables. Almost every company keeps its important data in
          a database you query with SQL, which makes it the most widely used tool in data work. This series goes from your first query to
          window functions, recursive queries and performance, one concept per post. Every example runs on the same small online-store
          database, and <strong>every query on these pages is live</strong>: click it to edit, then press Run to execute it in your browser
          with DuckDB.
        </P>
        <H2 id="how-it-works">Asking a table a question</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="database">The store database</H2>
        <P>
          A <strong>database</strong> is a collection of tables. Ours describes an online store: who the customers are, what they ordered, and
          what they clicked on the website. Each table has a fixed set of named columns, and every value in a column has the same type.
        </P>
        <SchemaRef />
        <P>The quickest way to get to know a table is to look at a few rows. Try changing the table name:</P>
        <SqlBlock q={Q.peek} />
        <P>
          You can also ask the database about itself. <C>DESCRIBE</C> lists a table&apos;s columns and types (in PostgreSQL, use <C>\d orders</C>
          in psql, or query <C>information_schema.columns</C>, which works almost everywhere):
        </P>
        <SqlBlock q={Q.describe} />

        <H2 id="select">SELECT: choosing columns</H2>
        <P>
          Every query starts with <C>SELECT</C> followed by what you want back, then <C>FROM</C> and the table. List columns separated by
          commas; the result has exactly those columns, in that order.
        </P>
        <SqlBlock q={Q.pick_cols} max={6} />
        <P>
          <C>SELECT *</C> means &quot;every column&quot;. It&apos;s handy for exploring but avoid it in saved queries: it fetches columns you
          don&apos;t need, and the result silently changes when someone adds a column to the table.
        </P>
        <P>
          You can also compute new columns from expressions, and name them with <C>AS</C> (an <em>alias</em>). Here we add 8.25% sales tax to
          each price, plus a constant column:
        </P>
        <SqlBlock q={Q.alias_expr} max={6} />
        <P>
          Arithmetic works as you&apos;d expect (<C>+ - * /</C>), with one trap: in many databases, dividing two integers drops the fraction (
          <C>7 / 2</C> is 3 in PostgreSQL and SQL Server). Write <C>7 / 2.0</C> or cast one side to a decimal when you want 3.5. DuckDB and
          MySQL return 3.5.
        </P>

        <H2 id="where">WHERE: choosing rows</H2>
        <P>
          <C>WHERE</C> takes a condition and keeps only the rows for which it&apos;s TRUE. Text and dates go in <strong>single quotes</strong>
          ; numbers don&apos;t.
        </P>
        <SqlBlock q={Q.where_eq} max={6} />
        <P>
          The comparison operators are <C>=</C>, <C>&lt;&gt;</C> (not equal; <C>!=</C> also works almost everywhere), <C>&lt;</C>,{" "}
          <C>&lt;=</C>, <C>&gt;</C> and <C>&gt;=</C>. They work on numbers, text (alphabetical order) and dates (calendar order):
        </P>
        <SqlBlock q={Q.where_cmp} max={8} />

        <H2 id="and-or">AND, OR, NOT and parentheses</H2>
        <P>
          Combine conditions with <C>AND</C> (both must be true), <C>OR</C> (at least one) and <C>NOT</C> (flips it). App orders from December
          onward:
        </P>
        <SqlBlock q={Q.where_and} max={5} />
        <P>
          Like multiplication before addition, <strong>AND binds tighter than OR</strong>. Suppose you want footwear or outdoor products under
          $40. This looks right but isn&apos;t:
        </P>
        <SqlBlock q={Q.precedence_wrong} />
        <P>
          SQL reads it as <C>category = &apos;Footwear&apos; OR (category = &apos;Outdoor&apos; AND price &lt; 40)</C>, so every footwear item
          slips through regardless of price. Parentheses fix it:
        </P>
        <SqlBlock q={Q.precedence_right} />
        <Gotcha>Whenever a WHERE mixes AND and OR, add parentheses, even when you think they&apos;re unnecessary. It costs nothing and saves the next reader (often you) from guessing.</Gotcha>

        <H2 id="shortcuts">IN, BETWEEN and LIKE</H2>
        <P>
          <C>IN</C> checks membership in a list. It&apos;s shorthand for a chain of ORs:
        </P>
        <SqlBlock q={Q.where_in} max={5} />
        <P>
          <C>BETWEEN a AND b</C> is shorthand for <C>&gt;= a AND &lt;= b</C>. <strong>Both ends are included.</strong>
        </P>
        <SqlBlock q={Q.where_between} />
        <P>
          It works on dates too, here for Thanksgiving week. With timestamps (date <em>and</em> time), BETWEEN has a trap: <C>BETWEEN
          &apos;2025-11-24&apos; AND &apos;2025-11-30&apos;</C> stops at midnight at the start of November 30 and misses the rest of that day.
          For timestamps, prefer <C>&gt;= &apos;2025-11-24&apos; AND &lt; &apos;2025-12-01&apos;</C>.
        </P>
        <SqlBlock q={Q.where_dates} />
        <P>
          <C>LIKE</C> matches text patterns: <C>%</C> stands for any run of characters (including none) and <C>_</C> for exactly one character.
        </P>
        <SqlBlock q={Q.where_like} />
        <P>First names whose second letter is &quot;a&quot;:</P>
        <SqlBlock q={Q.where_like_underscore} max={5} />
        <P>
          <C>LIKE</C> is case-sensitive in PostgreSQL and DuckDB, so <C>&apos;%tea%&apos;</C> wouldn&apos;t find &quot;Green Tea&quot;. Use{" "}
          <C>ILIKE</C> (case-insensitive) or compare lowercased text, <C>LOWER(name) LIKE &apos;%tea%&apos;</C>:
        </P>
        <SqlBlock q={Q.where_ilike} />
        <Dialect>
          <UL>
            <li>
              <strong>Case sensitivity of LIKE:</strong> case-sensitive in PostgreSQL, DuckDB, Snowflake and BigQuery; case-insensitive by
              default in MySQL and SQL Server (it depends on the column&apos;s collation).
            </li>
            <li>
              <strong>ILIKE</strong> exists in PostgreSQL, DuckDB and Snowflake, not in MySQL, SQL Server or BigQuery. <C>LOWER(x) LIKE
              ...</C> works everywhere.
            </li>
          </UL>
        </Dialect>

        <H2 id="null">NULL and three-valued logic</H2>
        <P>
          A missing value is stored as <C>NULL</C>. NULL isn&apos;t zero or an empty string; it means <em>unknown</em>. And since you can&apos;t
          know whether an unknown value equals something, any comparison with NULL gives NULL, not TRUE or FALSE. Even <C>NULL = NULL</C> is
          NULL:
        </P>
        <SqlBlock q={Q.null_logic} />
        <P>
          This is <strong>three-valued logic</strong>: TRUE, FALSE and NULL (unknown). The rules are what you&apos;d expect if NULL means
          &quot;could be either&quot;: <C>FALSE AND NULL</C> is FALSE (it fails whatever the unknown is), and <C>TRUE OR NULL</C> is TRUE. WHERE
          keeps a row only when its condition is TRUE, so a NULL result drops the row. That makes <C>= NULL</C> useless:
        </P>
        <SqlBlock q={Q.null_eq} />
        <P>
          To find missing values, use <C>IS NULL</C> (and <C>IS NOT NULL</C> for the opposite):
        </P>
        <SqlBlock q={Q.null_is} />
        <P>
          The subtle consequence: a condition and its opposite don&apos;t always add up to the whole table. Customers in Austin plus customers
          &quot;not in Austin&quot; is 148, not 150:
        </P>
        <SqlBlock q={Q.null_counts} />
        <P>
          If you mean &quot;anything except Austin, including unknown&quot;, say so: <C>city &lt;&gt; &apos;Austin&apos; OR city IS NULL</C>,
          or use <C>IS DISTINCT FROM</C>, which treats NULL as an ordinary value:
        </P>
        <SqlBlock q={Q.null_distinct} />
        <P>
          To display a fallback for missing values, <C>COALESCE(a, b, ...)</C> returns the first argument that isn&apos;t NULL:
        </P>
        <SqlBlock q={Q.coalesce} />
        <Gotcha>
          NULLs hide in every real dataset. Before trusting a filter, ask whether the column can be NULL and which side of your condition those
          rows should land on.
        </Gotcha>

        <H2 id="order">The order a query runs in</H2>
        <P>
          You write <C>SELECT</C> first, but the database runs the clauses in a different order: <strong>FROM</strong> (get the rows),{" "}
          <strong>WHERE</strong> (filter them), then <strong>SELECT</strong> (compute the output columns). Later posts add GROUP BY, HAVING and
          ORDER BY to this sequence. One consequence: in standard SQL, an alias defined in SELECT doesn&apos;t exist yet when WHERE runs.
        </P>
        <SqlBlock q={Q.alias_where} />
        <P>
          DuckDB accepts this as a convenience, as does Snowflake, but PostgreSQL, SQL Server, MySQL and BigQuery reject it with an error like{" "}
          <C>column &quot;price_with_tax&quot; does not exist</C>. The portable version repeats the expression:
        </P>
        <SqlBlock q={Q.alias_where_fix} />

        <H2 id="quotes">Quotes, case and semicolons</H2>
        <UL>
          <li>
            <strong>Single quotes are for values</strong> (<C>&apos;Austin&apos;</C>). <strong>Double quotes are for names</strong> of columns
            and tables (<C>&quot;first name&quot;</C>, needed only for names with spaces or capitals). Using double quotes for a value is a
            classic error; the database looks for a column called Austin:
          </li>
        </UL>
        <SqlBlock q={Q.double_quote} />
        <UL>
          <li>
            Keywords aren&apos;t case-sensitive: <C>select</C> and <C>SELECT</C> are the same. Uppercase keywords are just a convention for
            readability. Text values <em>are</em> case-sensitive: <C>&apos;austin&apos;</C> doesn&apos;t match &quot;Austin&quot;.
          </li>
          <li>An apostrophe inside a value is written twice: <C>&apos;O&apos;&apos;Brien&apos;</C>.</li>
          <li>A semicolon ends a statement. It&apos;s optional for a single query but required between several.</li>
          <li>
            <C>--</C> starts a comment to the end of the line; <C>{"/* ... */"}</C> comments a block.
          </li>
        </UL>
        <Dialect>
          <UL>
            <li>
              <strong>Identifiers:</strong> MySQL and BigQuery quote names with backticks (<C>`first name`</C>); SQL Server uses brackets (
              <C>[first name]</C>).
            </li>
            <li>
              <strong>Limiting rows:</strong> <C>LIMIT 5</C> in PostgreSQL, DuckDB, MySQL, SQLite, BigQuery and Snowflake; <C>SELECT TOP 5</C> in
              SQL Server; <C>FETCH FIRST 5 ROWS ONLY</C> in standard SQL and Oracle.
            </li>
            <li>
              <strong>Date literals:</strong> <C>&apos;2025-01-01&apos;</C> is converted automatically when compared to a date column in
              most databases; <C>DATE &apos;2025-01-01&apos;</C> makes the type explicit and works in PostgreSQL, DuckDB, BigQuery and Oracle.
            </li>
          </UL>
        </Dialect>

        <H2 id="practice">Practice</H2>
        <Exercise n={1} q="List electronics that cost less than $50, with their prices." answer={Q.ex1} />
        <Exercise
          n={2}
          q="Find every order from November 2025 onward that was cancelled or returned."
          hint={
            <>
              Use <C>IN</C> for the two statuses and a date comparison.
            </>
          }
          answer={Q.ex2}
        />
        <Exercise
          n={3}
          q="Which customers have no email address on file?"
          hint={
            <>
              Remember: <C>= NULL</C> never matches.
            </>
          }
          answer={Q.ex3}
        />
        <P>Or write anything you like against the store database:</P>
        <SqlPlayground />

        <H2 id="recap">Recap</H2>
        <UL>
          <li>
            <C>SELECT</C> chooses columns (and computes new ones), <C>FROM</C> chooses the table, <C>WHERE</C> chooses rows.
          </li>
          <li>The database runs FROM, then WHERE, then SELECT.</li>
          <li>AND binds tighter than OR: use parentheses.</li>
          <li>
            NULL means unknown. Comparisons with NULL give NULL, WHERE drops it, and <C>IS NULL</C> is how you find it.
          </li>
        </UL>
        <P>
          Next in the series: sorting results, taking the top N, removing duplicates and writing if-then logic with <C>CASE</C>.
        </P>
        <SeriesNav current={1} />
        <p className="mt-6 text-sm italic text-gray-600 dark:text-gray-400">
          The store data is synthetic. Queries run in your browser with DuckDB-WASM; changes you make are rolled back after each run.
        </p>
      </Narrow>
    </Wide>
  );
};

export default Sql01Story;
