-- @q union_all
SELECT first_name || ' ' || last_name AS name, 'customer' AS kind
FROM customers
WHERE customer_id <= 3
UNION ALL
SELECT name, 'employee' AS kind
FROM employees
WHERE employee_id <= 3;

-- @q union_dedupe
SELECT state FROM customers WHERE city IN ('Austin', 'Dallas')
UNION
SELECT state FROM customers WHERE city = 'Houston';

-- @q union_all_dupes
SELECT state FROM customers WHERE city IN ('Austin', 'Dallas')
UNION ALL
SELECT state FROM customers WHERE city = 'Houston';

-- @q union_mismatch !error
SELECT customer_id, first_name FROM customers
UNION ALL
SELECT employee_id FROM employees;

-- @q union_positional
SELECT first_name, last_name FROM customers WHERE customer_id = 1
UNION ALL
SELECT title, name FROM employees WHERE employee_id = 1;

-- @q union_order
SELECT 'orders' AS metric, COUNT(*) AS value FROM orders
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'products', COUNT(*) FROM products
ORDER BY value DESC;

-- @q intersect
SELECT customer_id FROM orders WHERE order_date >= '2025-11-01' AND order_date < '2025-12-01'
INTERSECT
SELECT customer_id FROM orders WHERE order_date >= '2025-12-01'
ORDER BY customer_id
LIMIT 8;

-- @q set_counts
SELECT
  (SELECT COUNT(*) FROM (SELECT customer_id FROM orders WHERE order_date >= '2025-11-01' AND order_date < '2025-12-01'
                         INTERSECT
                         SELECT customer_id FROM orders WHERE order_date >= '2025-12-01')) AS both_months,
  (SELECT COUNT(*) FROM (SELECT customer_id FROM orders WHERE order_date >= '2025-11-01' AND order_date < '2025-12-01'
                         EXCEPT
                         SELECT customer_id FROM orders WHERE order_date >= '2025-12-01')) AS november_only,
  (SELECT COUNT(*) FROM (SELECT customer_id FROM orders WHERE order_date >= '2025-12-01'
                         EXCEPT
                         SELECT customer_id FROM orders WHERE order_date >= '2025-11-01' AND order_date < '2025-12-01')) AS december_only;

-- @q except
SELECT customer_id FROM orders WHERE order_date >= '2025-11-01' AND order_date < '2025-12-01'
EXCEPT
SELECT customer_id FROM orders WHERE order_date >= '2025-12-01'
ORDER BY customer_id;

-- @q long
SELECT date_trunc('month', order_date)::DATE AS month, channel, COUNT(*) AS orders
FROM orders
WHERE order_date >= '2025-09-01'
GROUP BY month, channel
ORDER BY month, channel;

-- @q pivot_case
SELECT
  date_trunc('month', order_date)::DATE           AS month,
  COUNT(*) FILTER (WHERE channel = 'web')          AS web,
  COUNT(*) FILTER (WHERE channel = 'app')          AS app,
  COUNT(*) FILTER (WHERE channel = 'store')        AS store,
  COUNT(*)                                         AS total
FROM orders
WHERE order_date >= '2025-09-01'
GROUP BY month
ORDER BY month;

-- @q pivot_sum_case
SELECT
  p.category,
  SUM(CASE WHEN o.channel = 'web'   THEN i.quantity * i.unit_price ELSE 0 END) AS web,
  SUM(CASE WHEN o.channel = 'app'   THEN i.quantity * i.unit_price ELSE 0 END) AS app,
  SUM(CASE WHEN o.channel = 'store' THEN i.quantity * i.unit_price ELSE 0 END) AS store
FROM order_items i
JOIN orders o   ON o.order_id = i.order_id
JOIN products p ON p.product_id = i.product_id
GROUP BY p.category
ORDER BY p.category;

-- @q pivot_keyword
PIVOT (
  SELECT date_trunc('month', order_date)::DATE AS month, channel
  FROM orders
  WHERE order_date >= '2025-09-01'
)
ON channel
USING COUNT(*)
ORDER BY month;

-- @q unpivot
WITH wide AS (
  SELECT
    date_trunc('month', order_date)::DATE    AS month,
    COUNT(*) FILTER (WHERE channel = 'web')   AS web,
    COUNT(*) FILTER (WHERE channel = 'app')   AS app,
    COUNT(*) FILTER (WHERE channel = 'store') AS store
  FROM orders
  WHERE order_date >= '2025-11-01'
  GROUP BY month
)
UNPIVOT wide
ON web, app, store
INTO NAME channel VALUE orders
ORDER BY month, channel;

-- @q unpivot_union
WITH wide AS (
  SELECT
    date_trunc('month', order_date)::DATE    AS month,
    COUNT(*) FILTER (WHERE channel = 'web')   AS web,
    COUNT(*) FILTER (WHERE channel = 'app')   AS app,
    COUNT(*) FILTER (WHERE channel = 'store') AS store
  FROM orders
  WHERE order_date >= '2025-11-01'
  GROUP BY month
)
SELECT month, 'web' AS channel, web AS orders FROM wide
UNION ALL SELECT month, 'app', app FROM wide
UNION ALL SELECT month, 'store', store FROM wide
ORDER BY month, channel;

-- @q grouping_sets
SELECT
  channel,
  status,
  COUNT(*) AS orders,
  GROUPING(channel, status) AS level
FROM orders
GROUP BY GROUPING SETS ((channel), (status), ())
ORDER BY level, channel, status;

-- @q full_outer_emulate
WITH planned(state, target) AS (VALUES ('TX', 30), ('CA', 20), ('NV', 5)),
     actual AS (SELECT state, COUNT(*) AS customers FROM customers WHERE state IN ('TX', 'CA', 'WA') GROUP BY state)
SELECT p.state, p.target, a.customers
FROM planned p LEFT JOIN actual a ON a.state = p.state
UNION ALL
SELECT a.state, NULL, a.customers
FROM actual a
WHERE NOT EXISTS (SELECT 1 FROM planned p WHERE p.state = a.state)
ORDER BY state;

-- @q ex1
SELECT name AS label, 'product' AS kind FROM products WHERE category = 'Fitness'
UNION ALL
SELECT DISTINCT category, 'category' FROM products
ORDER BY kind, label;

-- @q ex2
SELECT customer_id FROM sessions WHERE device = 'tablet' AND customer_id IS NOT NULL
EXCEPT
SELECT customer_id FROM sessions WHERE device = 'desktop'
ORDER BY customer_id;

-- @q ex3
SELECT
  device,
  COUNT(*) FILTER (WHERE source = 'search') AS search,
  COUNT(*) FILTER (WHERE source = 'email')  AS email,
  COUNT(*) FILTER (WHERE source = 'social') AS social,
  COUNT(*) FILTER (WHERE source = 'direct') AS direct,
  COUNT(*) FILTER (WHERE source = 'ads')    AS ads
FROM sessions
GROUP BY device
ORDER BY device;
