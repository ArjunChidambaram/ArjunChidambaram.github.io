-- @q daily
WITH daily AS (
  SELECT o.order_date AS day, COUNT(DISTINCT o.order_id) AS orders, SUM(i.quantity * i.unit_price) AS revenue
  FROM orders o
  JOIN order_items i ON i.order_id = o.order_id
  WHERE o.status = 'completed' AND o.order_date >= '2025-12-01'
  GROUP BY o.order_date
)
SELECT * FROM daily ORDER BY day LIMIT 8;

-- @q lag_lead
WITH daily AS (
  SELECT o.order_date AS day, SUM(i.quantity * i.unit_price) AS revenue
  FROM orders o JOIN order_items i ON i.order_id = o.order_id
  WHERE o.status = 'completed' AND o.order_date >= '2025-12-01'
  GROUP BY o.order_date
)
SELECT
  day,
  revenue,
  LAG(revenue)  OVER (ORDER BY day) AS previous_day,
  LEAD(revenue) OVER (ORDER BY day) AS next_day,
  revenue - LAG(revenue) OVER (ORDER BY day) AS change
FROM daily
ORDER BY day
LIMIT 8;

-- @q lag_pct
WITH monthly AS (
  SELECT date_trunc('month', o.order_date)::DATE AS month, SUM(i.quantity * i.unit_price) AS revenue
  FROM orders o JOIN order_items i ON i.order_id = o.order_id
  WHERE o.status = 'completed'
  GROUP BY month
)
SELECT
  month,
  revenue,
  LAG(revenue) OVER (ORDER BY month) AS last_month,
  ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month)) / LAG(revenue) OVER (ORDER BY month), 1) AS pct_change
FROM monthly
ORDER BY month;

-- @q lag_default
SELECT
  month,
  orders,
  LAG(orders, 1, 0) OVER (ORDER BY month) AS last_month_or_zero,
  LAG(orders, 3)    OVER (ORDER BY month) AS three_months_ago
FROM (
  SELECT date_trunc('month', order_date)::DATE AS month, COUNT(*) AS orders
  FROM orders
  GROUP BY month
) m
ORDER BY month
LIMIT 6;

-- @q days_between
SELECT
  customer_id,
  order_id,
  order_date,
  LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS previous_order,
  order_date - LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS days_since_previous
FROM orders
WHERE customer_id IN (2, 3)
ORDER BY customer_id, order_date;

-- @q gap_stats
WITH gaps AS (
  SELECT
    customer_id,
    order_date - LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS gap
  FROM orders
)
SELECT
  COUNT(gap)                       AS repeat_orders,
  ROUND(AVG(gap), 1)               AS avg_days_between_orders,
  MEDIAN(gap)                      AS median_days
FROM gaps;

-- @q running
WITH daily AS (
  SELECT o.order_date AS day, SUM(i.quantity * i.unit_price) AS revenue
  FROM orders o JOIN order_items i ON i.order_id = o.order_id
  WHERE o.status = 'completed' AND o.order_date >= '2025-12-01'
  GROUP BY o.order_date
)
SELECT
  day,
  revenue,
  SUM(revenue) OVER (ORDER BY day) AS month_to_date
FROM daily
ORDER BY day
LIMIT 10;

-- @q running_reset
WITH monthly AS (
  SELECT date_trunc('month', o.order_date)::DATE AS month, SUM(i.quantity * i.unit_price) AS revenue
  FROM orders o JOIN order_items i ON i.order_id = o.order_id
  WHERE o.status = 'completed'
  GROUP BY month
)
SELECT
  month,
  revenue,
  SUM(revenue) OVER (PARTITION BY quarter(month) ORDER BY month) AS quarter_to_date,
  SUM(revenue) OVER (ORDER BY month)                             AS year_to_date
FROM monthly
ORDER BY month;

-- @q range_vs_rows
SELECT
  order_id,
  order_date,
  COUNT(*) OVER (ORDER BY order_date)                                      AS default_range,
  COUNT(*) OVER (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS rows_frame,
  COUNT(*) OVER (ORDER BY order_date, order_id)                           AS unique_order
FROM orders
WHERE order_date BETWEEN '2025-12-19' AND '2025-12-21'
ORDER BY order_date, order_id;

-- @q moving_avg
WITH daily AS (
  SELECT o.order_date AS day, SUM(i.quantity * i.unit_price) AS revenue
  FROM orders o JOIN order_items i ON i.order_id = o.order_id
  WHERE o.status = 'completed' AND o.order_date >= '2025-11-01'
  GROUP BY o.order_date
)
SELECT
  day,
  revenue,
  ROUND(AVG(revenue) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS avg_last_7_rows,
  COUNT(*)            OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)     AS rows_in_window
FROM daily
ORDER BY day
LIMIT 10;

-- @q moving_avg_days
WITH daily AS (
  SELECT o.order_date AS day, SUM(i.quantity * i.unit_price) AS revenue
  FROM orders o JOIN order_items i ON i.order_id = o.order_id
  WHERE o.status = 'completed' AND o.order_date >= '2025-11-01'
  GROUP BY o.order_date
),
calendar AS (
  SELECT CAST(d AS DATE) AS day
  FROM generate_series(DATE '2025-11-01', DATE '2025-12-31', INTERVAL 1 DAY) AS t(d)
),
filled AS (
  SELECT c.day, COALESCE(d.revenue, 0) AS revenue
  FROM calendar c
  LEFT JOIN daily d ON d.day = c.day
)
SELECT
  day,
  revenue,
  ROUND(AVG(revenue) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS avg_last_7_days
FROM filled
ORDER BY day
LIMIT 10;

-- @q range_interval
WITH daily AS (
  SELECT o.order_date AS day, SUM(i.quantity * i.unit_price) AS revenue
  FROM orders o JOIN order_items i ON i.order_id = o.order_id
  WHERE o.status = 'completed' AND o.order_date >= '2025-11-01'
  GROUP BY o.order_date
)
SELECT
  day,
  revenue,
  SUM(revenue) OVER (ORDER BY day RANGE BETWEEN INTERVAL 6 DAYS PRECEDING AND CURRENT ROW) AS revenue_last_7_days
FROM daily
ORDER BY day
LIMIT 8;

-- @q centered
WITH monthly AS (
  SELECT date_trunc('month', order_date)::DATE AS month, COUNT(*) AS orders
  FROM orders
  GROUP BY month
)
SELECT
  month,
  orders,
  ROUND(AVG(orders) OVER (ORDER BY month ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING), 1) AS centered_3_month_avg
FROM monthly
ORDER BY month;

-- @q first_last
SELECT
  category,
  name,
  price,
  FIRST_VALUE(name) OVER (PARTITION BY category ORDER BY price DESC) AS priciest,
  LAST_VALUE(name)  OVER (PARTITION BY category ORDER BY price DESC) AS last_value_default,
  LAST_VALUE(name)  OVER (PARTITION BY category ORDER BY price DESC
                          ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS cheapest
FROM products
WHERE category IN ('Footwear', 'Fitness')
ORDER BY category, price DESC;

-- @q pareto
WITH product_revenue AS (
  SELECT p.name, SUM(i.quantity * i.unit_price) AS revenue
  FROM order_items i JOIN products p ON p.product_id = i.product_id
  GROUP BY p.name
)
SELECT
  name,
  revenue,
  ROUND(100 * SUM(revenue) OVER (ORDER BY revenue DESC ROWS UNBOUNDED PRECEDING)
            / SUM(revenue) OVER (), 1) AS cumulative_pct
FROM product_revenue
ORDER BY revenue DESC
LIMIT 8;

-- @q ex1
WITH weekly AS (
  SELECT date_trunc('week', order_date)::DATE AS week, COUNT(*) AS orders
  FROM orders
  WHERE order_date >= '2025-10-01'
  GROUP BY week
)
SELECT week, orders, orders - LAG(orders) OVER (ORDER BY week) AS change_vs_last_week
FROM weekly
ORDER BY week;

-- @q ex2
SELECT
  customer_id,
  order_id,
  order_date,
  ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS nth_order,
  COUNT(*) OVER (PARTITION BY customer_id ORDER BY order_date, order_id
                 ROWS UNBOUNDED PRECEDING) AS running_count
FROM orders
WHERE customer_id = 9
ORDER BY order_date
LIMIT 6;

-- @q ex3
WITH first_orders AS (
  SELECT customer_id, MIN(order_date) AS first_order
  FROM orders
  GROUP BY customer_id
),
monthly AS (
  SELECT date_trunc('month', first_order)::DATE AS month, COUNT(*) AS new_customers
  FROM first_orders
  GROUP BY month
)
SELECT month, new_customers, SUM(new_customers) OVER (ORDER BY month) AS total_customers
FROM monthly
ORDER BY month;
