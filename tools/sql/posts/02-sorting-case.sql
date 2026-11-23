-- @q order_price
SELECT name, category, price
FROM products
ORDER BY price DESC;

-- @q order_multi
SELECT name, category, price
FROM products
ORDER BY category, price DESC;

-- @q order_text
SELECT first_name, last_name
FROM customers
ORDER BY last_name, first_name
LIMIT 8;

-- @q order_nulls_default
SELECT first_name, city
FROM customers
ORDER BY city
LIMIT 5;

-- @q order_nulls_first
SELECT first_name, city
FROM customers
ORDER BY city NULLS FIRST
LIMIT 5;

-- @q order_alias
SELECT name, price * 1.0825 AS price_with_tax
FROM products
ORDER BY price_with_tax DESC
LIMIT 5;

-- @q order_position
SELECT category, name, price
FROM products
ORDER BY 1, 3;

-- @q limit_top
SELECT name, price
FROM products
ORDER BY price DESC
LIMIT 3;

-- @q limit_ties
SELECT order_id, order_date
FROM orders
ORDER BY order_date DESC
LIMIT 3;

-- @q limit_ties_fix
SELECT order_id, order_date
FROM orders
ORDER BY order_date DESC, order_id DESC
LIMIT 3;

-- @q offset
SELECT name, price
FROM products
ORDER BY price DESC
LIMIT 5 OFFSET 5;

-- @q distinct_one
SELECT DISTINCT state
FROM customers
ORDER BY state;

-- @q distinct_two
SELECT DISTINCT segment, channel
FROM orders
JOIN customers USING (customer_id)
ORDER BY segment, channel;

-- @q distinct_null
SELECT DISTINCT city
FROM customers
WHERE state = 'OR' OR state = 'MA'
ORDER BY city;

-- @q count_distinct
SELECT
  COUNT(*)                    AS orders,
  COUNT(DISTINCT customer_id) AS customers_who_ordered
FROM orders;

-- @q distinct_on
SELECT DISTINCT ON (customer_id)
  customer_id, order_id, order_date
FROM orders
ORDER BY customer_id, order_date
LIMIT 6;

-- @q funcs_text
SELECT
  first_name || ' ' || last_name     AS full_name,
  UPPER(state)                       AS state,
  LENGTH(first_name)                 AS name_length,
  LEFT(last_name, 1) || '.'          AS initial
FROM customers
LIMIT 5;

-- @q funcs_num
SELECT
  name,
  price,
  ROUND(price * 0.85, 2)  AS sale_price,
  CEIL(price)             AS rounded_up,
  price::INTEGER          AS cast_to_int
FROM products
LIMIT 5;

-- @q int_div
SELECT 7 / 2 AS slash, 7 // 2 AS integer_division, 7 % 2 AS remainder, 7 / 2.0 AS with_decimal;

-- @q case_tiers
SELECT
  name,
  price,
  CASE
    WHEN price >= 100 THEN 'premium'
    WHEN price >= 30  THEN 'standard'
    ELSE 'budget'
  END AS tier
FROM products
ORDER BY price DESC;

-- @q case_order_matters
SELECT
  name,
  price,
  CASE
    WHEN price >= 30  THEN 'standard'
    WHEN price >= 100 THEN 'premium'
    ELSE 'budget'
  END AS tier
FROM products
ORDER BY price DESC
LIMIT 4;

-- @q case_simple
SELECT
  order_id,
  status,
  CASE status
    WHEN 'completed' THEN 'Delivered'
    WHEN 'returned'  THEN 'Sent back'
    WHEN 'cancelled' THEN 'Never shipped'
  END AS label
FROM orders
WHERE order_id IN (1001, 1254, 1291, 1302);

-- @q case_no_else
SELECT
  first_name,
  city,
  CASE WHEN city IN ('Austin', 'Dallas', 'Houston') THEN 'Texas metro' END AS region
FROM customers
LIMIT 6;

-- @q case_sort
SELECT order_id, status, order_date
FROM orders
WHERE order_date >= '2025-12-20'
ORDER BY
  CASE status WHEN 'returned' THEN 1 WHEN 'cancelled' THEN 2 ELSE 3 END,
  order_date DESC;

-- @q case_count
SELECT
  COUNT(*) AS products,
  SUM(CASE WHEN price >= 100 THEN 1 ELSE 0 END) AS premium,
  SUM(CASE WHEN price < 30 THEN 1 ELSE 0 END)   AS budget
FROM products;

-- @q ex1
SELECT name, category, price
FROM products
WHERE category = 'Grocery'
ORDER BY price
LIMIT 2;

-- @q ex2
SELECT DISTINCT category
FROM products
WHERE price > 50
ORDER BY category;

-- @q ex3
SELECT
  order_id,
  channel,
  CASE WHEN channel = 'store' THEN 'in person' ELSE 'online' END AS how
FROM orders
ORDER BY order_id
LIMIT 6;
