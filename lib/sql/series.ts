/** The SQL series, in reading order. `live` posts get links in each post's series list. */
export const SQL_SERIES: { n: number; slug: string; title: string; live: boolean }[] = [
  { n: 1, slug: "sql-select-where-explained", title: "SELECT, FROM and WHERE", live: true },
  { n: 2, slug: "sql-sorting-case-explained", title: "Sorting, LIMIT, DISTINCT and CASE", live: true },
  { n: 3, slug: "sql-group-by-explained", title: "GROUP BY and aggregation", live: true },
  { n: 4, slug: "sql-joins-explained", title: "JOINs", live: true },
  { n: 5, slug: "sql-subqueries-ctes-explained", title: "Subqueries and CTEs", live: true },
  { n: 6, slug: "sql-window-functions-ranking-explained", title: "Window functions I: ranking", live: true },
  { n: 7, slug: "sql-window-functions-running-totals-explained", title: "Window functions II: LAG, LEAD and running totals", live: true },
  { n: 8, slug: "sql-dates-strings-cleaning-explained", title: "Dates, strings and cleaning data", live: true },
  { n: 9, slug: "sql-set-operations-pivoting-explained", title: "UNION, pivoting and conditional aggregation", live: true },
  { n: 10, slug: "sql-recursive-ctes-explained", title: "Recursive CTEs", live: true },
  { n: 11, slug: "sql-analytics-patterns-explained", title: "Analytics patterns: funnels, retention, sessions", live: true },
  { n: 12, slug: "sql-data-modeling-dml-explained", title: "Tables, keys, INSERT/UPDATE and transactions", live: true },
  { n: 13, slug: "sql-performance-indexes-explained", title: "Performance: indexes and query plans", live: false },
];
