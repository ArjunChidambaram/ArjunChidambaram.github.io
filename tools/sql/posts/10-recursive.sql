-- @q count
WITH RECURSIVE numbers(n) AS (
  SELECT 1                   -- anchor: where to start
  UNION ALL
  SELECT n + 1 FROM numbers  -- recursive step: build on the last rows
  WHERE n < 10               -- stop condition
)
SELECT n FROM numbers;

-- @q calendar
WITH RECURSIVE days(day) AS (
  SELECT DATE '2025-12-24'
  UNION ALL
  SELECT CAST(day + INTERVAL 1 DAY AS DATE) FROM days
  WHERE day < DATE '2025-12-31'
)
SELECT d.day, COUNT(o.order_id) AS orders
FROM days d
LEFT JOIN orders o ON o.order_date = d.day
GROUP BY d.day
ORDER BY d.day;

-- @q employees
SELECT employee_id, name, title, manager_id
FROM employees
ORDER BY employee_id;

-- @q chain_up
WITH RECURSIVE chain AS (
  SELECT employee_id, name, title, manager_id, 0 AS steps_up
  FROM employees
  WHERE name = 'Nina Rossi'
  UNION ALL
  SELECT e.employee_id, e.name, e.title, e.manager_id, c.steps_up + 1
  FROM employees e
  JOIN chain c ON e.employee_id = c.manager_id
)
SELECT steps_up, name, title
FROM chain
ORDER BY steps_up;

-- @q org_down
WITH RECURSIVE org AS (
  SELECT employee_id, name, title, 0 AS depth, name AS path
  FROM employees
  WHERE manager_id IS NULL
  UNION ALL
  SELECT e.employee_id, e.name, e.title, o.depth + 1, o.path || ' > ' || e.name
  FROM employees e
  JOIN org o ON e.manager_id = o.employee_id
)
SELECT depth, repeat('    ', depth) || name AS org_chart, title
FROM org
ORDER BY path;

-- @q subtree
WITH RECURSIVE team AS (
  SELECT employee_id, name, title, 0 AS depth
  FROM employees
  WHERE name = 'Priya Raman'
  UNION ALL
  SELECT e.employee_id, e.name, e.title, t.depth + 1
  FROM employees e
  JOIN team t ON e.manager_id = t.employee_id
)
SELECT depth, name, title
FROM team
ORDER BY depth, name;

-- @q headcount
WITH RECURSIVE pairs AS (
  -- every (manager, person below them) pair, at any distance
  SELECT manager_id AS boss, employee_id AS person
  FROM employees
  WHERE manager_id IS NOT NULL
  UNION ALL
  SELECT e.manager_id, p.person
  FROM pairs p
  JOIN employees e ON e.employee_id = p.boss
  WHERE e.manager_id IS NOT NULL
)
SELECT m.name, m.title, COUNT(*) AS people_below
FROM pairs p
JOIN employees m ON m.employee_id = p.boss
GROUP BY m.name, m.title
ORDER BY people_below DESC;

-- @q guard
WITH RECURSIVE numbers(n) AS (
  SELECT 1
  UNION ALL
  SELECT n * 2 FROM numbers
  WHERE n < 1000000   -- without this the query would never finish
)
SELECT COUNT(*) AS rows, MAX(n) AS largest FROM numbers;

-- @q compound
WITH RECURSIVE forecast(month, customers) AS (
  SELECT 0, 133.0
  UNION ALL
  SELECT month + 1, customers * 1.05
  FROM forecast
  WHERE month < 12
)
SELECT month, ROUND(customers) AS customers_if_5pct_monthly_growth
FROM forecast
WHERE month IN (0, 3, 6, 9, 12);

-- @q islands_days
WITH order_days AS (
  SELECT DISTINCT order_date AS day
  FROM orders
  WHERE order_date >= '2025-11-01'
),
grouped AS (
  SELECT
    day,
    ROW_NUMBER() OVER (ORDER BY day)                       AS rn,
    day - CAST(ROW_NUMBER() OVER (ORDER BY day) AS INTEGER) AS island
  FROM order_days
)
SELECT day, rn, island
FROM grouped
ORDER BY day
LIMIT 10;

-- @q islands
WITH order_days AS (
  SELECT DISTINCT order_date AS day
  FROM orders
  WHERE order_date >= '2025-11-01'
),
grouped AS (
  SELECT day, day - CAST(ROW_NUMBER() OVER (ORDER BY day) AS INTEGER) AS island
  FROM order_days
)
SELECT MIN(day) AS streak_start, MAX(day) AS streak_end, COUNT(*) AS days_in_a_row
FROM grouped
GROUP BY island
ORDER BY days_in_a_row DESC, streak_start
LIMIT 5;

-- @q gaps
WITH order_days AS (
  SELECT DISTINCT order_date AS day FROM orders WHERE order_date >= '2025-11-01'
)
SELECT
  day AS last_day_with_orders,
  LEAD(day) OVER (ORDER BY day) AS next_day_with_orders,
  LEAD(day) OVER (ORDER BY day) - day - 1 AS empty_days
FROM order_days
QUALIFY empty_days > 0
ORDER BY empty_days DESC
LIMIT 5;

-- @q ex1
WITH RECURSIVE chain AS (
  SELECT employee_id, name, manager_id, 0 AS level
  FROM employees WHERE name = 'Mateo Silva'
  UNION ALL
  SELECT e.employee_id, e.name, e.manager_id, c.level + 1
  FROM employees e JOIN chain c ON e.employee_id = c.manager_id
)
SELECT level, name FROM chain ORDER BY level;

-- @q ex2
WITH RECURSIVE weeks(week_start) AS (
  SELECT DATE '2025-11-03'
  UNION ALL
  SELECT CAST(week_start + INTERVAL 7 DAY AS DATE) FROM weeks WHERE week_start < DATE '2025-12-22'
)
SELECT w.week_start, COUNT(o.order_id) AS orders
FROM weeks w
LEFT JOIN orders o ON o.order_date >= w.week_start AND o.order_date < w.week_start + INTERVAL 7 DAY
GROUP BY w.week_start
ORDER BY w.week_start;

-- @q ex3
WITH customer_days AS (
  SELECT DISTINCT customer_id, CAST(started_at AS DATE) AS day
  FROM sessions
  WHERE customer_id IS NOT NULL
),
grouped AS (
  SELECT customer_id, day,
         day - CAST(ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY day) AS INTEGER) AS island
  FROM customer_days
)
SELECT customer_id, MIN(day) AS start, MAX(day) AS finish, COUNT(*) AS consecutive_days
FROM grouped
GROUP BY customer_id, island
ORDER BY consecutive_days DESC, customer_id
LIMIT 5;
