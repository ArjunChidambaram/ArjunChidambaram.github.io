-- @q explain_simple
EXPLAIN
SELECT order_id, order_date
FROM orders
WHERE customer_id = 85;

-- @q explain_join
EXPLAIN
SELECT c.state, COUNT(*) AS orders
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
WHERE o.order_date >= DATE '2025-12-01'
GROUP BY c.state;

-- @q explain_analyze
EXPLAIN ANALYZE
SELECT c.state, COUNT(*) AS orders
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
WHERE o.order_date >= DATE '2025-12-01'
GROUP BY c.state;

-- @q projection
EXPLAIN
SELECT *
FROM orders
WHERE customer_id = 85;

-- @q make_big
CREATE TABLE sales AS
SELECT
  range                                              AS sale_id,
  DATE '2022-01-01' + CAST(range // 1000 AS INTEGER) AS sale_date,  -- 1,000 sales a day, in date order
  CAST((range * 7919) % 100000 AS INTEGER)           AS customer_id,
  ROUND(5 + (range * 37 % 9500) / 100.0, 2)          AS amount
FROM range(1000000);

SELECT COUNT(*) AS rows, MIN(sale_date) AS first_day, MAX(sale_date) AS last_day,
       COUNT(DISTINCT customer_id) AS customers
FROM sales;

-- @q sargable_good
CREATE TABLE sales AS
SELECT range AS sale_id,
       DATE '2022-01-01' + CAST(range // 1000 AS INTEGER) AS sale_date,
       CAST((range * 7919) % 100000 AS INTEGER) AS customer_id,
       ROUND(5 + (range * 37 % 9500) / 100.0, 2) AS amount
FROM range(1000000);

-- the column is compared directly, so whole blocks of rows can be skipped
EXPLAIN ANALYZE
SELECT SUM(amount) AS revenue
FROM sales
WHERE sale_date >= DATE '2023-06-01' AND sale_date < DATE '2023-07-01';

-- @q sargable_bad
CREATE TABLE sales AS
SELECT range AS sale_id,
       DATE '2022-01-01' + CAST(range // 1000 AS INTEGER) AS sale_date,
       CAST((range * 7919) % 100000 AS INTEGER) AS customer_id,
       ROUND(5 + (range * 37 % 9500) / 100.0, 2) AS amount
FROM range(1000000);

-- functions wrap the column: every row is computed, then compared
EXPLAIN ANALYZE
SELECT SUM(amount) AS revenue
FROM sales
WHERE year(sale_date) = 2023 AND month(sale_date) = 6;

-- @q cluster_unsorted
CREATE TABLE sales AS
SELECT range AS sale_id,
       DATE '2022-01-01' + CAST(range // 1000 AS INTEGER) AS sale_date,
       CAST((range * 7919) % 100000 AS INTEGER) AS customer_id,
       ROUND(5 + (range * 37 % 9500) / 100.0, 2) AS amount
FROM range(1000000);

-- customer_id values are scattered through the table
EXPLAIN ANALYZE
SELECT SUM(amount) FROM sales
WHERE customer_id BETWEEN 4000 AND 4099;

-- @q cluster_sorted
CREATE TABLE sales AS
SELECT range AS sale_id,
       DATE '2022-01-01' + CAST(range // 1000 AS INTEGER) AS sale_date,
       CAST((range * 7919) % 100000 AS INTEGER) AS customer_id,
       ROUND(5 + (range * 37 % 9500) / 100.0, 2) AS amount
FROM range(1000000);

CREATE TABLE sales_by_customer AS
SELECT * FROM sales ORDER BY customer_id;   -- same rows, stored in customer order

EXPLAIN ANALYZE
SELECT SUM(amount) FROM sales_by_customer
WHERE customer_id BETWEEN 4000 AND 4099;

-- @q index
CREATE TABLE sales AS
SELECT range AS sale_id,
       DATE '2022-01-01' + CAST(range // 1000 AS INTEGER) AS sale_date,
       CAST((range * 7919) % 100000 AS INTEGER) AS customer_id,
       ROUND(5 + (range * 37 % 9500) / 100.0, 2) AS amount
FROM range(1000000);

CREATE INDEX sales_customer ON sales (customer_id);

SELECT sale_id, sale_date, amount
FROM sales
WHERE customer_id = 4242
ORDER BY sale_date;

-- @q semi_exists
EXPLAIN
SELECT c.customer_id
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);

-- @q semi_in
EXPLAIN
SELECT c.customer_id
FROM customers c
WHERE c.customer_id IN (SELECT customer_id FROM orders);

-- @q fanout_wrong
SELECT
  c.customer_id,
  SUM(oi.quantity * oi.unit_price) AS revenue,
  COUNT(s.session_id)              AS sessions
FROM customers c
JOIN orders o       ON o.customer_id = c.customer_id
JOIN order_items oi ON oi.order_id = o.order_id
JOIN sessions s     ON s.customer_id = c.customer_id
WHERE c.customer_id = 85 AND o.status = 'completed'
GROUP BY c.customer_id;

-- @q fanout_right
WITH rev AS (
  SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS revenue
  FROM orders o JOIN order_items oi USING (order_id)
  WHERE o.status = 'completed'
  GROUP BY o.customer_id
),
ses AS (
  SELECT customer_id, COUNT(*) AS sessions
  FROM sessions
  GROUP BY customer_id
)
SELECT r.customer_id, r.revenue, s.sessions
FROM rev r
LEFT JOIN ses s USING (customer_id)
WHERE r.customer_id = 85;

-- @q fanout_check
SELECT
  (SELECT COUNT(*) FROM orders o JOIN order_items oi USING (order_id) WHERE o.customer_id = 85 AND o.status = 'completed') AS item_rows,
  (SELECT COUNT(*) FROM sessions WHERE customer_id = 85)                                                                AS session_rows,
  (SELECT COUNT(*) FROM orders o JOIN order_items oi USING (order_id) JOIN sessions s ON s.customer_id = o.customer_id
    WHERE o.customer_id = 85 AND o.status = 'completed')                                                               AS joined_rows;

-- @q approx
CREATE TABLE sales AS
SELECT range AS sale_id,
       CAST((range * 7919) % 100000 AS INTEGER) AS customer_id
FROM range(1000000);

SELECT
  COUNT(DISTINCT customer_id)        AS exact_customers,
  APPROX_COUNT_DISTINCT(customer_id) AS approx_customers
FROM sales;

-- @q ex1
EXPLAIN
SELECT p.category, SUM(oi.quantity * oi.unit_price) AS revenue
FROM order_items oi
JOIN products p USING (product_id)
GROUP BY p.category;

-- @q ex2
SELECT o.order_id, o.order_date
FROM orders o
WHERE o.order_date >= DATE '2025-12-24' AND o.order_date < DATE '2025-12-26'
ORDER BY o.order_date;

-- @q ex3
WITH items AS (
  SELECT order_id, SUM(quantity) AS units
  FROM order_items
  GROUP BY order_id
)
SELECT o.channel, COUNT(*) AS orders, SUM(i.units) AS units
FROM orders o
JOIN items i USING (order_id)
GROUP BY o.channel
ORDER BY units DESC;
