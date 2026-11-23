import Link from "next/link";

import { H2, Narrow, P, Scrolly, UL, Videos, Wide, type Step } from "@/components/explainers/kit";
import { SqlBlock, SqlPlayground, type Saved } from "@/components/sql/SqlBlock";
import { C, Dialect, Exercise, Gotcha, MiniTable, SeriesNav } from "@/components/sql/SqlKit";
import R from "lib/sql/results/08-dates-strings.json";

/** SQL series, part 8: dates, strings and cleaning messy data. */

const Q = R as Record<string, Saved>;

const Sql08Story: React.FC = () => {
  const steps: Step[] = [
    {
      key: "extract",
      body: (
        <>
          <strong>A timestamp is many facts at once.</strong> <C>EXTRACT</C> pulls out the year, month, day, hour or day of week, so you can
          group sessions by hour of day or weekday.
        </>
      ),
    },
    {
      key: "trunc",
      body: (
        <>
          <strong>Round down to a period.</strong> <C>date_trunc(&apos;month&apos;, ts)</C> turns every moment in November into November 1,
          00:00. That&apos;s the key you GROUP BY for daily, weekly or monthly reports.
        </>
      ),
    },
    {
      key: "strings",
      body: (
        <>
          <strong>Take text apart.</strong> <C>TRIM</C> strips spaces, <C>LOWER</C> normalizes case, <C>SPLIT_PART</C> and{" "}
          <C>SUBSTRING</C> cut out pieces like an email&apos;s domain.
        </>
      ),
    },
    {
      key: "clean",
      body: (
        <>
          <strong>Clean before you count.</strong> Two signups look different until you trim and lowercase them; then it&apos;s the same
          person twice. Blank strings become NULL, &quot;n/a&quot; becomes NULL instead of an error.
        </>
      ),
    },
  ];
  const chartFor = (s: number) => {
    if (s === 0)
      return (
        <MiniTable
          cols={["function", "result"]}
          rows={[
            ["EXTRACT(year FROM ts)", 2025],
            ["EXTRACT(month FROM ts)", 11],
            ["EXTRACT(day FROM ts)", 23],
            ["EXTRACT(hour FROM ts)", 17],
            ["dayname(ts)", "Sunday"],
          ]}
          sql={"ts = TIMESTAMP '2025-11-23 17:45:29'"}
        />
      );
    if (s === 1)
      return (
        <MiniTable
          cols={["function", "result"]}
          rows={[
            ["date_trunc('hour', ts)", "2025-11-23 17:00:00"],
            ["date_trunc('day', ts)", "2025-11-23 00:00:00"],
            ["date_trunc('week', ts)", "2025-11-17 00:00:00"],
            ["date_trunc('month', ts)", "2025-11-01 00:00:00"],
          ]}
          sql={"ts = TIMESTAMP '2025-11-23 17:45:29'"}
        />
      );
    if (s === 2)
      return (
        <MiniTable
          cols={["expression", "result"]}
          rows={[
            ["email", "'  Ava.Smith@Example.com '"],
            ["TRIM(email)", "'Ava.Smith@Example.com'"],
            ["LOWER(TRIM(email))", "'ava.smith@example.com'"],
            ["SPLIT_PART(…, '@', 1)", "'ava.smith'"],
            ["SPLIT_PART(…, '@', 2)", "'example.com'"],
          ]}
        />
      );
    return (
      <MiniTable
        cols={["raw email", "cleaned"]}
        rows={[
          ["  Ava.Smith@Example.com ", "ava.smith@example.com"],
          ["liam.jones@example.com", "liam.jones@example.com"],
          ["ava.smith@example.com", "ava.smith@example.com"],
          ["noah@example.com", "noah@example.com"],
        ]}
        state={["unknown", null, "unknown", null]}
        sql={"SELECT LOWER(TRIM(email)) AS email, COUNT(*)\nFROM signups_raw\nGROUP BY 1;"}
      />
    );
  };

  return (
    <Wide>
      <Narrow>
        <Videos
          videos={[
            { key: "intuition", label: "The intuition", len: "0:48", src: "/explainers/sql-08/intuition.mp4", poster: "/explainers/sql-08/intuition-poster.jpg", square: true },
            { key: "steps", label: "Step by step", len: "1:40", src: "/explainers/sql-08/steps.mp4", poster: "/explainers/sql-08/steps-poster.jpg" },
          ]}
          note="The intuition video covers date parts, rounding, string functions and deduplication. The step-by-step video cleans a messy table column by column."
        />
        <P>
          Clean, consistent values are an assumption behind every query in this series. Real data isn&apos;t like that: timestamps need to be
          rounded to days or months before you can group them, text arrives with stray spaces and mixed case, and numbers come in as strings
          like &quot;n/a&quot;. This post is the toolkit for all three. It&apos;s part 8 of the SQL series and uses ideas from{" "}
          <Link className="link" href="/blog/posts/sql-group-by-explained/">GROUP BY</Link> and{" "}
          <Link className="link" href="/blog/posts/sql-window-functions-running-totals-explained/">part 7</Link>.
        </P>
        <H2 id="how-it-works">Taking values apart</H2>
      </Narrow>
      <Scrolly steps={steps} chart={chartFor} />

      <Narrow>
        <H2 id="types">Date and time types</H2>
        <P>
          A <C>DATE</C> is a calendar day; a <C>TIMESTAMP</C> is a date plus a time; an <C>INTERVAL</C> is a length of time. Subtracting dates
          gives days, and adding an interval to a date moves it:
        </P>
        <SqlBlock q={Q.types} />
        <P>
          (DuckDB returns a timestamp when you add an interval to a date; cast with <C>::DATE</C> if you need a date back.) Our{" "}
          <C>orders.order_date</C> is a DATE; <C>sessions.started_at</C> is a TIMESTAMP.
        </P>
        <Dialect>
          Time zones are their own topic. <C>TIMESTAMP</C> (without time zone) stores wall-clock time with no zone; <C>TIMESTAMPTZ</C> /{" "}
          <C>TIMESTAMP WITH TIME ZONE</C> stores an absolute instant. When a report says &quot;sales per day&quot;, decide whose day it is (UTC or the
          store&apos;s local time) and convert before truncating, e.g. <C>(ts AT TIME ZONE &apos;America/Chicago&apos;)</C>.
        </Dialect>

        <H2 id="extract">Extracting parts</H2>
        <P>
          <C>EXTRACT(part FROM ts)</C> (or <C>date_part(&apos;part&apos;, ts)</C>) returns a number. <C>isodow</C> numbers weekdays Monday = 1 to
          Sunday = 7:
        </P>
        <SqlBlock q={Q.extract} />
        <P>Website traffic by hour of day:</P>
        <SqlBlock q={Q.by_hour} max={17} />
        <P>
          And by weekday, also divided by the number of such days. Our 28 days contain exactly four of each weekday, so here both columns rank the same; over a range that isn't whole weeks, raw counts would favor whichever weekdays appear more often:
        </P>
        <SqlBlock q={Q.by_weekday} />

        <H2 id="trunc">Rounding with date_trunc</H2>
        <P>
          <C>date_trunc(unit, ts)</C> rounds down to the start of the hour, day, week (Monday), month, quarter or year. It keeps the full date,
          which is what you want for grouping and charting a time series, unlike EXTRACT(month), which would merge November 2024 with November
          2025:
        </P>
        <SqlBlock q={Q.trunc} />

        <H2 id="arithmetic">Date arithmetic</H2>
        <P>
          <C>date_diff(unit, start, end)</C> counts boundaries crossed. Days from signup to first order:
        </P>
        <SqlBlock q={Q.diff} />
        <P>
          Adding intervals handles month lengths for you, and <C>last_day</C> finds the end of a month. Notice how one month after December 3 is
          January 3, but 30 days after is January 2:
        </P>
        <SqlBlock q={Q.add_interval} />

        <H2 id="filtering-time">Filtering timestamps</H2>
        <P>
          How many sessions on November 27 and 28? This looks right but counts only the 27th, because <C>&apos;2025-11-28&apos;</C> as a timestamp
          is midnight at the <em>start</em> of the 28th:
        </P>
        <SqlBlock q={Q.timestamp_filter_wrong} />
        <P>Use a half-open range: include the start, exclude the end:</P>
        <SqlBlock q={Q.timestamp_filter_right} />
        <Gotcha>
          For time ranges, always write <C>ts &gt;= start AND ts &lt; next_start</C>. It works for dates and timestamps alike, never double-counts
          a boundary, and keeps the column bare so an index on it can be used (part 13).
        </Gotcha>
        <P>
          To display dates, format them as text (<C>strftime</C> in DuckDB, <C>to_char</C> in PostgreSQL), but group and sort on the real date,
          not the text:
        </P>
        <SqlBlock q={Q.format} />

        <H2 id="strings">String functions</H2>
        <P>The everyday toolkit, applied to emails:</P>
        <SqlBlock q={Q.strings} />
        <P>
          Concatenating with <C>||</C> returns NULL if any piece is NULL (Chloe has no city). <C>CONCAT</C> and <C>CONCAT_WS</C> treat NULL as
          empty:
        </P>
        <SqlBlock q={Q.concat} />
        <P>
          For patterns beyond LIKE, regular expressions: test with <C>regexp_matches</C>, pull out pieces with <C>regexp_extract</C>, rewrite
          with <C>regexp_replace</C>:
        </P>
        <SqlBlock q={Q.regex} />
        <Dialect>
          String functions vary: <C>SPLIT_PART</C> exists in PostgreSQL, DuckDB, Snowflake and Redshift (BigQuery uses <C>SPLIT(s, &apos;@&apos;)[OFFSET(1)]</C>
          ); positions are 1-based in SQL. Regex functions are <C>~</C> / <C>regexp_match</C> in PostgreSQL, <C>REGEXP_CONTAINS</C> /{" "}
          <C>REGEXP_EXTRACT</C> in BigQuery, <C>REGEXP_LIKE</C> in MySQL and Oracle. <C>INITCAP</C> (capitalize each word) exists in
          PostgreSQL, Oracle and Snowflake but not DuckDB, so we build it from <C>UPPER</C> and <C>LOWER</C> below.
        </Dialect>

        <H2 id="cleaning">Cleaning a messy table</H2>
        <P>
          Imagine a raw signup export. It has every common problem: padding spaces, inconsistent case, empty strings where values are missing,
          text in a number column, and NULLs:
        </P>
        <SqlBlock q={Q.messy} />
        <P>Each problem has a standard fix, and they compose:</P>
        <UL>
          <li>
            <C>TRIM</C> and <C>LOWER</C> make text comparable.
          </li>
          <li>
            <C>NULLIF(x, &apos;&apos;)</C> turns empty strings into real NULLs, so COUNT and COALESCE treat them as missing.
          </li>
          <li>
            <C>TRY_CAST</C> converts text to a number, returning NULL instead of failing on values like &quot;n/a&quot;.
          </li>
          <li>
            <C>COALESCE(x, &apos;unknown&apos;)</C> fills in a default.
          </li>
        </UL>
        <SqlBlock q={Q.cleaned} />
        <P>A plain CAST stops the whole query at the first bad value:</P>
        <SqlBlock q={Q.cast_fail} />
        <P>Only after cleaning can you see that two signups are one person:</P>
        <SqlBlock q={Q.dedupe} />
        <P>Our real customers table has the same issue, hidden by capitalization:</P>
        <SqlBlock q={Q.dup_customers} />

        <H2 id="nullif">NULLIF and division by zero</H2>
        <P>
          Dividing by zero is an error in most databases. <C>x / NULLIF(y, 0)</C> turns a zero denominator into NULL, so the ratio becomes NULL
          (unknown) instead of crashing the report:
        </P>
        <SqlBlock q={Q.nullif_div} />

        <H2 id="audit">Auditing data quality</H2>
        <P>Before analysis, a few queries tell you what you&apos;re dealing with. Missing values per column:</P>
        <SqlBlock q={Q.null_audit} />
        <P>Orders with no line items (the one that silently vanished from inner joins in part 4):</P>
        <SqlBlock q={Q.orphan_check} />
        <Gotcha title="Make cleaning repeatable">
          Do cleaning in a view or a CTE at the top of your query (or in your data pipeline), never by hand-editing results. Then every report
          uses the same rules, and you can see exactly what was changed.
        </Gotcha>

        <H2 id="practice">Practice</H2>
        <Exercise n={1} q="Count sessions per week, and how many of them were on mobile." answer={Q.ex1} />
        <Exercise n={2} q="Group customers by the domain of their email address (ignoring case)." answer={Q.ex2} />
        <Exercise n={3} q="List customers who signed up in the last 60 days of 2025, with how many days they've been customers as of Dec 31." answer={Q.ex3} />
        <SqlPlayground start={"SELECT\n  date_trunc('day', started_at)::DATE AS day,\n  COUNT(*) AS sessions\nFROM sessions\nGROUP BY day\nORDER BY day;"} />

        <H2 id="recap">Recap</H2>
        <UL>
          <li>EXTRACT pulls out parts of a date; date_trunc rounds down to a period and is the right GROUP BY key.</li>
          <li>Filter time ranges with half-open intervals: &gt;= start AND &lt; next start.</li>
          <li>TRIM, LOWER, SPLIT_PART, SUBSTRING and regexes reshape text; || with NULL gives NULL.</li>
          <li>NULLIF, TRY_CAST and COALESCE turn blanks, bad values and gaps into something countable.</li>
          <li>Clean, then deduplicate, then count.</li>
        </UL>
        <P>Next: stacking results with UNION, and turning rows into columns.</P>
        <SeriesNav current={8} />
        <p className="mt-6 text-sm italic text-gray-600 dark:text-gray-400">
          The store data is synthetic. Queries run in your browser with DuckDB-WASM; changes are rolled back after each run.
        </p>
      </Narrow>
    </Wide>
  );
};

export default Sql08Story;
