-- @q agg_all
SELECT
  COUNT(*)                         AS line_items,
  SUM(quantity)                    AS units,
  SUM(quantity * unit_price)       AS revenue,
  AVG(unit_price)                  AS avg_price,
  MIN(unit_price)                  AS cheapest,
  MAX(unit_price)                  AS priciest
FROM order_items;

-- @q count_variants
SELECT
  COUNT(*)              AS rows,
  COUNT(email)          AS with_email,
  COUNT(city)           AS with_city,
  COUNT(DISTINCT state) AS states
FROM customers;

-- @q avg_nulls
SELECT
  AVG(score)                 AS avg_ignoring_nulls,
  AVG(COALESCE(score, 0))    AS avg_nulls_as_zero,
  SUM(score) / COUNT(*)      AS sum_over_all_rows
FROM (VALUES (10), (20), (NULL), (30)) AS t(score);

-- @q group_channel
SELECT channel, COUNT(*) AS orders
FROM orders
GROUP BY channel
ORDER BY orders DESC;

-- @q group_two
SELECT channel, status, COUNT(*) AS orders
FROM orders
GROUP BY channel, status
ORDER BY channel, status;

-- @q group_product
SELECT
  product_id,
  COUNT(*)                     AS times_ordered,
  SUM(quantity)                AS units,
  SUM(quantity * unit_price)   AS revenue
FROM order_items
GROUP BY product_id
ORDER BY revenue DESC
LIMIT 5;

-- @q group_month
SELECT
  date_trunc('month', order_date)::DATE AS month,
  COUNT(*)                         AS orders
FROM orders
GROUP BY month
ORDER BY month;

-- @q group_null
SELECT city, COUNT(*) AS customers
FROM customers
WHERE state IN ('OR', 'MA')
GROUP BY city
ORDER BY customers DESC;

-- @q bad_group !error
SELECT customer_id, order_date, COUNT(*) AS orders
FROM orders
GROUP BY customer_id;

-- @q any_value
SELECT customer_id, COUNT(*) AS orders, MAX(order_date) AS latest_order
FROM orders
GROUP BY customer_id
ORDER BY orders DESC
LIMIT 5;

-- @q having
SELECT customer_id, COUNT(*) AS orders
FROM orders
GROUP BY customer_id
HAVING COUNT(*) >= 8
ORDER BY orders DESC;

-- @q where_and_having
SELECT customer_id, COUNT(*) AS completed_orders
FROM orders
WHERE status = 'completed'
GROUP BY customer_id
HAVING COUNT(*) >= 8
ORDER BY completed_orders DESC;

-- @q where_agg !error
SELECT customer_id, COUNT(*) AS orders
FROM orders
WHERE COUNT(*) >= 8
GROUP BY customer_id;

-- @q conditional
SELECT
  channel,
  COUNT(*)                                             AS orders,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
  COUNT(*) FILTER (WHERE status = 'returned')           AS returned,
  ROUND(AVG(CASE WHEN status = 'cancelled' THEN 1.0 ELSE 0 END), 3) AS cancel_rate
FROM orders
GROUP BY channel
ORDER BY orders DESC;

-- @q avg_order_value
SELECT
  order_id,
  SUM(quantity * unit_price) AS order_value,
  COUNT(*)                   AS lines
FROM order_items
GROUP BY order_id
ORDER BY order_value DESC
LIMIT 5;

-- @q string_agg
SELECT
  state,
  COUNT(*) AS customers,
  STRING_AGG(DISTINCT city, ', ' ORDER BY city) AS cities
FROM customers
GROUP BY state
ORDER BY customers DESC
LIMIT 5;

-- @q group_by_all
SELECT segment, channel, COUNT(*) AS orders
FROM orders
JOIN customers USING (customer_id)
GROUP BY ALL
ORDER BY segment, channel;

-- @q rollup
SELECT
  channel,
  status,
  COUNT(*) AS orders
FROM orders
GROUP BY ROLLUP (channel, status)
ORDER BY channel NULLS LAST, status NULLS LAST;

-- @q missing_days
SELECT
  COUNT(*)                                   AS days_with_orders,
  COUNT(*) / 365.0                           AS share_of_year,
  AVG(n)                                     AS avg_orders_on_order_days,
  SUM(n) / 365.0                             AS avg_orders_per_calendar_day
FROM (
  SELECT order_date, COUNT(*) AS n
  FROM orders
  GROUP BY order_date
) AS daily;

-- @q ex1
SELECT status, COUNT(*) AS orders
FROM orders
GROUP BY status
ORDER BY orders DESC;

-- @q ex2
SELECT state, COUNT(*) AS customers
FROM customers
GROUP BY state
HAVING COUNT(*) >= 10
ORDER BY customers DESC;

-- @q ex3
SELECT
  date_trunc('month', order_date)::DATE                AS month,
  COUNT(*)                                              AS orders,
  COUNT(*) FILTER (WHERE channel = 'app')               AS app_orders,
  ROUND(COUNT(*) FILTER (WHERE channel = 'app') * 1.0 / COUNT(*), 2) AS app_share
FROM orders
GROUP BY month
ORDER BY month;
