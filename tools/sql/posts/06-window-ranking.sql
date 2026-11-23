-- @q group_collapse
SELECT category, ROUND(AVG(price), 2) AS avg_price
FROM products
GROUP BY category
ORDER BY category;

-- @q window_keep
SELECT
  name,
  category,
  price,
  ROUND(AVG(price) OVER (PARTITION BY category), 2) AS category_avg
FROM products
ORDER BY category, price DESC;

-- @q over_empty
SELECT
  name,
  price,
  SUM(price) OVER ()                       AS total_of_all_prices,
  ROUND(100 * price / SUM(price) OVER (), 1) AS pct_of_total
FROM products
ORDER BY price DESC
LIMIT 5;

-- @q vs_category
SELECT
  name,
  category,
  price,
  ROUND(price - AVG(price) OVER (PARTITION BY category), 2) AS vs_category_avg,
  COUNT(*) OVER (PARTITION BY category)                     AS products_in_category
FROM products
ORDER BY category, price DESC;

-- @q row_number
SELECT
  category,
  name,
  price,
  ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS price_rank
FROM products
ORDER BY category, price_rank;

-- @q ties
WITH customer_orders AS (
  SELECT c.customer_id, c.first_name, COUNT(*) AS orders
  FROM customers c
  JOIN orders o ON o.customer_id = c.customer_id
  GROUP BY c.customer_id, c.first_name
)
SELECT
  first_name,
  orders,
  ROW_NUMBER() OVER (ORDER BY orders DESC) AS row_number,
  RANK()       OVER (ORDER BY orders DESC) AS rank,
  DENSE_RANK() OVER (ORDER BY orders DESC) AS dense_rank
FROM customer_orders
ORDER BY orders DESC, first_name
LIMIT 12;

-- @q where_window !error
SELECT category, name, price,
       ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn
FROM products
WHERE rn <= 2;

-- @q top_n
WITH ranked AS (
  SELECT
    category, name, price,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn
  FROM products
)
SELECT category, name, price
FROM ranked
WHERE rn <= 2
ORDER BY category, rn;

-- @q qualify
SELECT category, name, price
FROM products
QUALIFY ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) <= 2
ORDER BY category, price DESC;

-- @q latest_per_customer
WITH ranked AS (
  SELECT
    customer_id, order_id, order_date, channel,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC, order_id DESC) AS rn
  FROM orders
)
SELECT customer_id, order_id, order_date, channel
FROM ranked
WHERE rn = 1
ORDER BY customer_id
LIMIT 6;

-- @q rank_groups
SELECT
  p.category,
  SUM(i.quantity * i.unit_price)                             AS revenue,
  RANK() OVER (ORDER BY SUM(i.quantity * i.unit_price) DESC) AS revenue_rank
FROM order_items i
JOIN products p ON p.product_id = i.product_id
GROUP BY p.category
ORDER BY revenue_rank;

-- @q ntile
WITH value AS (
  SELECT o.customer_id, SUM(i.quantity * i.unit_price) AS lifetime_value
  FROM orders o
  JOIN order_items i ON i.order_id = o.order_id
  GROUP BY o.customer_id
),
q AS (
  SELECT customer_id, lifetime_value, NTILE(4) OVER (ORDER BY lifetime_value DESC) AS quartile
  FROM value
)
SELECT
  quartile,
  COUNT(*)                         AS customers,
  ROUND(MIN(lifetime_value), 2)    AS min_value,
  ROUND(MAX(lifetime_value), 2)    AS max_value,
  ROUND(100 * SUM(lifetime_value) / SUM(SUM(lifetime_value)) OVER (), 1) AS pct_of_revenue
FROM q
GROUP BY quartile
ORDER BY quartile;

-- @q percent_rank
SELECT
  name,
  price,
  ROUND(PERCENT_RANK() OVER (ORDER BY price), 3) AS percent_rank,
  ROUND(CUME_DIST()    OVER (ORDER BY price), 3) AS cume_dist
FROM products
ORDER BY price DESC
LIMIT 6;

-- @q named_window
SELECT
  category, name, price,
  RANK()     OVER w AS price_rank,
  MAX(price) OVER w2 AS top_price_in_category
FROM products
WINDOW w  AS (PARTITION BY category ORDER BY price DESC),
       w2 AS (PARTITION BY category)
ORDER BY category, price_rank
LIMIT 8;

-- @q ex1
WITH ranked AS (
  SELECT
    c.state, c.first_name, c.last_name, c.signup_date,
    ROW_NUMBER() OVER (PARTITION BY c.state ORDER BY c.signup_date) AS rn
  FROM customers c
)
SELECT state, first_name, last_name, signup_date
FROM ranked
WHERE rn = 1
ORDER BY state;

-- @q ex2
SELECT
  order_id,
  SUM(quantity * unit_price) AS value,
  DENSE_RANK() OVER (ORDER BY SUM(quantity * unit_price) DESC) AS value_rank
FROM order_items
GROUP BY order_id
QUALIFY value_rank <= 5
ORDER BY value_rank;

-- @q ex3
SELECT
  channel,
  order_id,
  order_date,
  ROW_NUMBER() OVER (PARTITION BY channel ORDER BY order_date, order_id) AS nth_order_in_channel
FROM orders
QUALIFY nth_order_in_channel = 100;
