-- @q peek
SELECT *
FROM customers
LIMIT 5;

-- @q tables
SELECT table_name, COUNT(*) AS columns
FROM information_schema.columns
GROUP BY table_name
ORDER BY table_name;

-- @q describe
DESCRIBE orders;

-- @q pick_cols
SELECT first_name, last_name, city
FROM customers;

-- @q alias_expr
SELECT
  name,
  price,
  price * 1.0825 AS price_with_tax,
  'USD' AS currency
FROM products;

-- @q where_eq
SELECT first_name, last_name, city, state
FROM customers
WHERE state = 'TX';

-- @q where_cmp
SELECT name, category, price
FROM products
WHERE price >= 50;

-- @q where_and
SELECT order_id, customer_id, order_date, channel
FROM orders
WHERE channel = 'app'
  AND order_date >= '2025-12-01';

-- @q precedence_wrong
SELECT name, category, price
FROM products
WHERE category = 'Footwear' OR category = 'Outdoor' AND price < 40;

-- @q precedence_right
SELECT name, category, price
FROM products
WHERE (category = 'Footwear' OR category = 'Outdoor') AND price < 40;

-- @q where_in
SELECT first_name, city, state
FROM customers
WHERE state IN ('WA', 'OR', 'CA');

-- @q where_between
SELECT name, price
FROM products
WHERE price BETWEEN 20 AND 30;

-- @q where_dates
SELECT order_id, order_date, status
FROM orders
WHERE order_date BETWEEN '2025-11-24' AND '2025-11-30'
  AND status <> 'completed';

-- @q where_like
SELECT name, category
FROM products
WHERE name LIKE '%Bottle%' OR name LIKE 'S%';

-- @q where_like_underscore
SELECT first_name
FROM customers
WHERE first_name LIKE '_a%';

-- @q where_ilike
SELECT name
FROM products
WHERE name ILIKE '%tea%';

-- @q null_eq
SELECT first_name, city
FROM customers
WHERE city = NULL;

-- @q null_is
SELECT first_name, last_name, city, state
FROM customers
WHERE city IS NULL;

-- @q null_not_equal
SELECT COUNT(*) AS not_austin
FROM customers
WHERE city <> 'Austin';

-- @q null_counts
SELECT
  COUNT(*)                                        AS all_customers,
  COUNT(*) FILTER (WHERE city = 'Austin')         AS austin,
  COUNT(*) FILTER (WHERE city <> 'Austin')        AS not_austin,
  COUNT(*) FILTER (WHERE city IS NULL)            AS unknown_city
FROM customers;

-- @q null_logic
SELECT
  NULL = NULL        AS null_equals_null,
  NULL <> 1          AS null_not_one,
  TRUE AND NULL      AS true_and_null,
  FALSE AND NULL     AS false_and_null,
  TRUE OR NULL       AS true_or_null,
  NOT NULL           AS not_null;

-- @q null_distinct
SELECT first_name, city
FROM customers
WHERE city IS DISTINCT FROM 'Austin'
LIMIT 5;

-- @q coalesce
SELECT first_name, COALESCE(city, '(unknown)') AS city, state
FROM customers
WHERE city IS NULL OR email IS NULL;

-- @q alias_where
SELECT name, price * 1.0825 AS price_with_tax
FROM products
WHERE price_with_tax > 100;

-- @q alias_where_fix
SELECT name, price * 1.0825 AS price_with_tax
FROM products
WHERE price * 1.0825 > 100;

-- @q double_quote !error
SELECT first_name
FROM customers
WHERE city = "Austin";

-- @q ex1
SELECT name, price
FROM products
WHERE category = 'Electronics' AND price < 50;

-- @q ex2
SELECT order_id, customer_id, order_date
FROM orders
WHERE status IN ('cancelled', 'returned')
  AND order_date >= '2025-11-01';

-- @q ex3
SELECT customer_id, first_name, last_name
FROM customers
WHERE email IS NULL;
