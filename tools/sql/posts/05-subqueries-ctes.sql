-- @q avg_price
SELECT AVG(price) AS avg_price
FROM products;

-- @q above_avg
SELECT name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products)
ORDER BY price DESC;

-- @q scalar_select
SELECT
  name,
  price,
  ROUND(price - (SELECT AVG(price) FROM products), 2) AS vs_average
FROM products
ORDER BY vs_average DESC
LIMIT 5;

-- @q scalar_many !error
SELECT name
FROM products
WHERE price > (SELECT price FROM products WHERE category = 'Outdoor');

-- @q in_sub
SELECT customer_id, first_name, last_name
FROM customers
WHERE customer_id IN (
  SELECT customer_id
  FROM orders
  WHERE order_date >= '2025-12-24'
)
ORDER BY customer_id;

-- @q not_in_trap
SELECT COUNT(*) AS never_came_from_email
FROM customers
WHERE customer_id NOT IN (
  SELECT customer_id FROM sessions WHERE source = 'email'
);

-- @q not_in_why
SELECT
  COUNT(*)                      AS email_sessions,
  COUNT(customer_id)            AS logged_in,
  COUNT(*) - COUNT(customer_id) AS anonymous_null_ids
FROM sessions
WHERE source = 'email';

-- @q not_in_fixed
SELECT COUNT(*) AS never_came_from_email
FROM customers
WHERE customer_id NOT IN (
  SELECT customer_id FROM sessions
  WHERE source = 'email' AND customer_id IS NOT NULL
);

-- @q not_exists
SELECT COUNT(*) AS never_came_from_email
FROM customers c
WHERE NOT EXISTS (
  SELECT 1
  FROM sessions s
  WHERE s.customer_id = c.customer_id
    AND s.source = 'email'
);

-- @q exists
SELECT c.customer_id, c.first_name
FROM customers c
WHERE EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id
    AND o.status = 'returned'
)
ORDER BY c.customer_id
LIMIT 6;

-- @q correlated
SELECT
  c.customer_id,
  c.first_name,
  (SELECT MAX(o.order_date)
   FROM orders o
   WHERE o.customer_id = c.customer_id) AS last_order
FROM customers c
ORDER BY c.customer_id
LIMIT 6;

-- @q correlated_category
SELECT p.name, p.category, p.price
FROM products p
WHERE p.price > (
  SELECT AVG(p2.price)
  FROM products p2
  WHERE p2.category = p.category
)
ORDER BY p.category, p.price DESC;

-- @q derived
SELECT
  COUNT(*)              AS orders,
  ROUND(AVG(value), 2)  AS avg_order_value,
  MAX(value)            AS biggest_order
FROM (
  SELECT order_id, SUM(quantity * unit_price) AS value
  FROM order_items
  GROUP BY order_id
) AS order_values;

-- @q cte
WITH order_values AS (
  SELECT order_id, SUM(quantity * unit_price) AS value
  FROM order_items
  GROUP BY order_id
)
SELECT
  COUNT(*)              AS orders,
  ROUND(AVG(value), 2)  AS avg_order_value,
  MAX(value)            AS biggest_order
FROM order_values;

-- @q cte_chain
WITH order_values AS (
  SELECT o.order_id, o.customer_id, SUM(i.quantity * i.unit_price) AS value
  FROM orders o
  JOIN order_items i ON i.order_id = o.order_id
  WHERE o.status = 'completed'
  GROUP BY o.order_id, o.customer_id
),
customer_stats AS (
  SELECT customer_id, COUNT(*) AS orders, SUM(value) AS lifetime_value
  FROM order_values
  GROUP BY customer_id
),
tiers AS (
  SELECT
    customer_id, orders, lifetime_value,
    CASE WHEN lifetime_value >= 800 THEN 'VIP'
         WHEN lifetime_value >= 300 THEN 'regular'
         ELSE 'occasional' END AS tier
  FROM customer_stats
)
SELECT tier, COUNT(*) AS customers, ROUND(AVG(lifetime_value), 2) AS avg_value
FROM tiers
GROUP BY tier
ORDER BY avg_value DESC;

-- @q fanout_fixed
WITH orders_per_customer AS (
  SELECT customer_id, COUNT(*) AS orders
  FROM orders
  GROUP BY customer_id
),
revenue_per_customer AS (
  SELECT o.customer_id, SUM(i.quantity * i.unit_price) AS revenue
  FROM orders o
  JOIN order_items i ON i.order_id = o.order_id
  GROUP BY o.customer_id
)
SELECT
  c.segment,
  SUM(opc.orders)  AS orders,
  SUM(rpc.revenue) AS revenue
FROM customers c
JOIN orders_per_customer  opc ON opc.customer_id = c.customer_id
JOIN revenue_per_customer rpc ON rpc.customer_id = c.customer_id
GROUP BY c.segment;

-- @q cte_reuse
WITH daily AS (
  SELECT order_date, COUNT(*) AS orders
  FROM orders
  GROUP BY order_date
)
SELECT order_date, orders
FROM daily
WHERE orders = (SELECT MAX(orders) FROM daily);

-- @q lateral
SELECT c.first_name, recent.order_id, recent.order_date
FROM customers c,
LATERAL (
  SELECT o.order_id, o.order_date
  FROM orders o
  WHERE o.customer_id = c.customer_id
  ORDER BY o.order_date DESC
  LIMIT 2
) AS recent
WHERE c.customer_id IN (2, 3, 6)
ORDER BY c.first_name, recent.order_date DESC;

-- @q ex1
SELECT name, category, price
FROM products
WHERE price < (SELECT AVG(price) FROM products WHERE category = 'Electronics')
  AND category = 'Electronics';

-- @q ex2
SELECT p.product_id, p.name
FROM products p
WHERE NOT EXISTS (
  SELECT 1
  FROM order_items i
  JOIN orders o ON o.order_id = i.order_id
  WHERE i.product_id = p.product_id
    AND o.order_date >= '2025-12-20'
);

-- @q ex3
WITH monthly AS (
  SELECT date_trunc('month', order_date)::DATE AS month, COUNT(*) AS orders
  FROM orders
  GROUP BY month
)
SELECT month, orders
FROM monthly
WHERE orders > (SELECT AVG(orders) FROM monthly)
ORDER BY month;
