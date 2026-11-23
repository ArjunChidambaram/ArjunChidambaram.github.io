-- @q denormalized
SELECT o.order_id, o.order_date, c.first_name, c.last_name, c.email, c.city,
       p.name AS product, p.category, oi.quantity, oi.unit_price
FROM orders o
JOIN customers c   ON c.customer_id = o.customer_id
JOIN order_items oi ON oi.order_id = o.order_id
JOIN products p    ON p.product_id = oi.product_id
WHERE c.customer_id = 85
ORDER BY o.order_date
LIMIT 8;

-- @q redundancy
WITH wide AS (
  SELECT c.email, c.city
  FROM orders o
  JOIN customers c    ON c.customer_id = o.customer_id
  JOIN order_items oi ON oi.order_id = o.order_id
)
SELECT
  COUNT(*)              AS rows_in_wide_table,
  COUNT(DISTINCT email) AS distinct_customers,
  ROUND(COUNT(*) * 1.0 / COUNT(DISTINCT email), 1) AS copies_of_each_email
FROM wide;

-- @q create
CREATE TABLE reviews (
  review_id   INTEGER PRIMARY KEY,
  product_id  INTEGER NOT NULL REFERENCES products (product_id),
  customer_id INTEGER NOT NULL REFERENCES customers (customer_id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       VARCHAR,
  created_at  DATE DEFAULT DATE '2025-12-31'
);

INSERT INTO reviews (review_id, product_id, customer_id, rating, title) VALUES
  (1, 3, 85, 5, 'Best purchase this year'),
  (2, 3, 12, 4, 'Good, a bit loud'),
  (3, 7, 85, 2, NULL);

SELECT * FROM reviews;

-- @q pk_dup !error
CREATE TABLE reviews (
  review_id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products (product_id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5)
);
INSERT INTO reviews VALUES (1, 3, 5);
INSERT INTO reviews VALUES (1, 7, 4);   -- same review_id again

-- @q check_fail !error
CREATE TABLE reviews (
  review_id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products (product_id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5)
);
INSERT INTO reviews VALUES (1, 3, 6);   -- a 6-star review

-- @q notnull_fail !error
CREATE TABLE reviews (
  review_id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products (product_id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5)
);
INSERT INTO reviews VALUES (1, NULL, 5);   -- which product?

-- @q fk_fail !error
CREATE TABLE reviews (
  review_id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products (product_id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5)
);
INSERT INTO reviews VALUES (1, 999, 5);   -- there is no product 999

-- @q orphans
SELECT
  (SELECT COUNT(*) FROM order_items oi
   WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.order_id = oi.order_id))       AS items_without_order,
  (SELECT COUNT(*) FROM orders o
   WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.customer_id = o.customer_id)) AS orders_without_customer,
  (SELECT COUNT(*) FROM orders o
   WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.order_id))   AS orders_without_items;

-- @q dup_check
SELECT order_id, product_id, COUNT(*) AS copies
FROM order_items
GROUP BY order_id, product_id
HAVING COUNT(*) > 1
ORDER BY copies DESC
LIMIT 5;

-- @q insert_select
CREATE TABLE vip_customers (
  customer_id INTEGER PRIMARY KEY,
  lifetime_spend DECIMAL(10, 2)
);

INSERT INTO vip_customers
SELECT o.customer_id, SUM(oi.quantity * oi.unit_price)
FROM orders o JOIN order_items oi USING (order_id)
WHERE o.status = 'completed'
GROUP BY o.customer_id
HAVING SUM(oi.quantity * oi.unit_price) > 800;

SELECT COUNT(*) AS vips, MIN(lifetime_spend) AS smallest, MAX(lifetime_spend) AS largest
FROM vip_customers;

-- @q ctas
CREATE TABLE monthly_revenue AS
SELECT
  CAST(date_trunc('month', o.order_date) AS DATE) AS month,
  SUM(oi.quantity * oi.unit_price)                 AS revenue
FROM orders o JOIN order_items oi USING (order_id)
WHERE o.status = 'completed'
GROUP BY ALL;

SELECT * FROM monthly_revenue ORDER BY month DESC LIMIT 4;

-- @q update
UPDATE products
SET price = ROUND(price * 1.10, 2)
WHERE category = 'Grocery';

SELECT name, category, price FROM products WHERE category = 'Grocery' ORDER BY price DESC;

-- @q update_returning
-- customer 85 sent back everything they ordered in November
UPDATE orders
SET status = 'returned'
WHERE customer_id = 85
  AND order_date BETWEEN DATE '2025-11-01' AND DATE '2025-11-30'
  AND status = 'completed'
RETURNING order_id, order_date, status;

-- @q update_all_oops
UPDATE customers SET city = 'Austin';   -- forgot the WHERE

SELECT city, COUNT(*) AS customers FROM customers GROUP BY city;

-- @q update_from
UPDATE order_items
SET unit_price = p.price
FROM products p
WHERE p.product_id = order_items.product_id
  AND order_items.order_id = 1001;

SELECT oi.product_id, p.name, oi.quantity, oi.unit_price
FROM order_items oi JOIN products p USING (product_id)
WHERE oi.order_id = 1001;

-- @q delete
DELETE FROM orders
WHERE order_id NOT IN (SELECT order_id FROM order_items)
RETURNING *;

-- @q delete_count
DELETE FROM orders WHERE status = 'cancelled';

SELECT status, COUNT(*) AS orders FROM orders GROUP BY status ORDER BY orders DESC;

-- @q delete_safe
-- 1. look first
SELECT COUNT(*) AS would_delete
FROM sessions
WHERE customer_id IS NULL AND started_at < TIMESTAMP '2025-11-08';

-- @q upsert
CREATE TABLE inventory (
  product_id INTEGER PRIMARY KEY,
  on_hand    INTEGER NOT NULL
);
INSERT INTO inventory VALUES (1, 40), (2, 15), (3, 8);

-- a delivery arrives: some products are new, some already exist
INSERT INTO inventory VALUES (3, 20), (4, 12)
ON CONFLICT (product_id) DO UPDATE SET on_hand = inventory.on_hand + excluded.on_hand;

SELECT * FROM inventory ORDER BY product_id;

-- @q alter
ALTER TABLE products ADD COLUMN in_stock BOOLEAN DEFAULT true;
ALTER TABLE products RENAME COLUMN name TO product_name;

SELECT product_id, product_name, price, in_stock FROM products LIMIT 3;

-- @q view
CREATE VIEW order_totals AS
SELECT o.order_id, o.customer_id, o.order_date, o.status,
       SUM(oi.quantity * oi.unit_price) AS order_total
FROM orders o
JOIN order_items oi USING (order_id)
GROUP BY ALL;

SELECT status, COUNT(*) AS orders, ROUND(AVG(order_total), 2) AS avg_total
FROM order_totals
GROUP BY status;

-- @q types
SELECT
  0.1 + 0.2 = 0.3                        AS decimal_math_ok,
  0.1::DOUBLE + 0.2::DOUBLE = 0.3::DOUBLE AS float_math_ok,
  (0.1::DOUBLE + 0.2::DOUBLE)::VARCHAR   AS float_sum,
  CAST('2025-12-31' AS DATE) + 1         AS next_day,
  'abc' < 'abd'                          AS text_compare;

-- @q star
SELECT
  d.category,
  c.segment,
  o.channel,
  SUM(f.quantity * f.unit_price) AS revenue
FROM order_items f                                   -- fact: one row per item sold
JOIN orders o    ON o.order_id = f.order_id          -- order details
JOIN products d  ON d.product_id = f.product_id      -- product dimension
JOIN customers c ON c.customer_id = o.customer_id    -- customer dimension
WHERE o.status = 'completed'
GROUP BY ALL
ORDER BY revenue DESC
LIMIT 6;

-- @q ex1
CREATE TABLE wishlist (
  customer_id INTEGER NOT NULL REFERENCES customers (customer_id),
  product_id  INTEGER NOT NULL REFERENCES products (product_id),
  added_on    DATE NOT NULL,
  PRIMARY KEY (customer_id, product_id)
);
INSERT INTO wishlist VALUES (85, 3, DATE '2025-12-01'), (85, 7, DATE '2025-12-02'), (12, 3, DATE '2025-12-05');
SELECT w.customer_id, p.name, w.added_on
FROM wishlist w JOIN products p USING (product_id)
ORDER BY w.added_on;

-- @q ex2
UPDATE customers
SET segment = 'business'
WHERE customer_id IN (
  SELECT customer_id FROM orders GROUP BY customer_id HAVING COUNT(*) >= 8
)
RETURNING customer_id, first_name, segment;

-- @q ex3
DELETE FROM events
WHERE session_id IN (SELECT session_id FROM sessions WHERE device = 'tablet');

SELECT COUNT(*) AS events_left,
       COUNT(*) FILTER (WHERE session_id IN (SELECT session_id FROM sessions WHERE device = 'tablet')) AS tablet_events_left
FROM events;
