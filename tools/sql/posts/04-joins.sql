-- @q orders_only
SELECT order_id, customer_id, order_date
FROM orders
LIMIT 3;

-- @q inner_basic
SELECT o.order_id, o.order_date, c.first_name, c.last_name, c.city
FROM orders AS o
JOIN customers AS c ON c.customer_id = o.customer_id
ORDER BY o.order_id
LIMIT 6;

-- @q ambiguous !error
SELECT customer_id, first_name, order_id
FROM orders
JOIN customers ON customers.customer_id = orders.customer_id;

-- @q using
SELECT customer_id, first_name, order_id
FROM orders
JOIN customers USING (customer_id)
ORDER BY order_id
LIMIT 4;

-- @q three_tables
SELECT
  p.category,
  COUNT(DISTINCT o.order_id)          AS orders,
  SUM(i.quantity * i.unit_price)      AS revenue
FROM order_items AS i
JOIN orders   AS o ON o.order_id   = i.order_id
JOIN products AS p ON p.product_id = i.product_id
WHERE o.status = 'completed'
GROUP BY p.category
ORDER BY revenue DESC;

-- @q inner_drops
SELECT COUNT(*) AS customers_in_inner_join
FROM (
  SELECT DISTINCT c.customer_id
  FROM customers c
  JOIN orders o ON o.customer_id = c.customer_id
) t;

-- @q left_basic
SELECT c.customer_id, c.first_name, o.order_id, o.order_date
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.customer_id
WHERE c.customer_id IN (1, 6, 7, 11)
ORDER BY c.customer_id, o.order_id;

-- @q left_count_trap
SELECT
  c.customer_id,
  c.first_name,
  COUNT(*)          AS count_star,
  COUNT(o.order_id) AS orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE c.customer_id IN (1, 6, 7, 11)
GROUP BY c.customer_id, c.first_name
ORDER BY c.customer_id;

-- @q anti_join
SELECT c.customer_id, c.first_name, c.last_name, c.signup_date
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL
ORDER BY c.signup_date DESC;

-- @q not_exists
SELECT c.customer_id, c.first_name
FROM customers AS c
WHERE NOT EXISTS (
  SELECT 1 FROM orders AS o WHERE o.customer_id = c.customer_id
)
LIMIT 5;

-- @q filter_where
SELECT COUNT(DISTINCT c.customer_id) AS customers
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_date >= '2025-12-01';

-- @q filter_on
SELECT COUNT(DISTINCT c.customer_id) AS customers
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.customer_id
 AND o.order_date >= '2025-12-01';

-- @q filter_on_detail
SELECT
  c.first_name,
  COUNT(o.order_id) AS december_orders
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.customer_id
 AND o.order_date >= '2025-12-01'
WHERE c.customer_id IN (1, 6, 7, 11, 36)
GROUP BY c.customer_id, c.first_name
ORDER BY c.customer_id;

-- @q right_join
SELECT c.first_name, o.order_id
FROM orders AS o
RIGHT JOIN customers AS c ON c.customer_id = o.customer_id
WHERE c.customer_id IN (1, 7);

-- @q full_join
WITH planned(state, target) AS (VALUES ('TX', 30), ('CA', 20), ('NV', 5)),
     actual AS (SELECT state, COUNT(*) AS customers FROM customers WHERE state IN ('TX', 'CA', 'WA') GROUP BY state)
SELECT
  COALESCE(p.state, a.state) AS state,
  p.target,
  a.customers
FROM planned p
FULL OUTER JOIN actual a ON a.state = p.state
ORDER BY state;

-- @q self_join
SELECT
  e.name  AS employee,
  e.title,
  m.name  AS manager
FROM employees AS e
LEFT JOIN employees AS m ON m.employee_id = e.manager_id
ORDER BY e.employee_id;

-- @q cross_join
SELECT ch.channel, st.status
FROM (SELECT DISTINCT channel FROM orders) ch
CROSS JOIN (SELECT DISTINCT status FROM orders) st
ORDER BY ch.channel, st.status;

-- @q cross_fill
WITH grid AS (
  SELECT ch.channel, st.status
  FROM (SELECT DISTINCT channel FROM orders) ch
  CROSS JOIN (SELECT DISTINCT status FROM orders) st
)
SELECT g.channel, g.status, COUNT(o.order_id) AS december_orders
FROM grid g
LEFT JOIN orders o
  ON o.channel = g.channel
 AND o.status  = g.status
 AND o.order_date >= '2025-12-01'
GROUP BY g.channel, g.status
ORDER BY g.channel, g.status;

-- @q fanout_count
SELECT
  COUNT(*)                   AS rows_after_join,
  COUNT(DISTINCT o.order_id) AS actual_orders
FROM orders o
JOIN order_items i ON i.order_id = o.order_id;

-- @q fanout_wrong
SELECT
  c.segment,
  COUNT(*)                       AS orders_wrong,
  COUNT(DISTINCT o.order_id)     AS orders_right,
  SUM(i.quantity * i.unit_price) AS revenue
FROM customers c
JOIN orders o      ON o.customer_id = c.customer_id
JOIN order_items i ON i.order_id    = o.order_id
GROUP BY c.segment;

-- @q null_keys
WITH a(k, x) AS (VALUES (1, 'a1'), (NULL, 'a-null')),
     b(k, y) AS (VALUES (1, 'b1'), (NULL, 'b-null'))
SELECT a.x, b.y
FROM a JOIN b ON a.k = b.k;

-- @q ex1
SELECT o.order_id, o.order_date, c.first_name, c.last_name
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
WHERE c.state = 'WA'
ORDER BY o.order_date
LIMIT 10;

-- @q ex2
SELECT p.product_id, p.name, COUNT(i.order_id) AS times_ordered
FROM products p
LEFT JOIN order_items i ON i.product_id = p.product_id
GROUP BY p.product_id, p.name
ORDER BY times_ordered
LIMIT 5;

-- @q ex3
SELECT c.state, SUM(i.quantity * i.unit_price) AS revenue
FROM customers c
JOIN orders o      ON o.customer_id = c.customer_id
JOIN order_items i ON i.order_id    = o.order_id
WHERE o.status = 'completed'
GROUP BY c.state
ORDER BY revenue DESC
LIMIT 5;
