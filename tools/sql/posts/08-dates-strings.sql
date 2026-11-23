-- @q types
SELECT
  DATE '2025-11-28'                      AS a_date,
  TIMESTAMP '2025-11-28 14:35:00'        AS a_timestamp,
  INTERVAL 3 DAY                         AS an_interval,
  DATE '2025-11-28' + INTERVAL 3 DAY     AS three_days_later,
  DATE '2025-12-25' - DATE '2025-11-28'  AS days_between;

-- @q extract
SELECT
  started_at,
  EXTRACT(year FROM started_at)   AS year,
  EXTRACT(month FROM started_at)  AS month,
  EXTRACT(day FROM started_at)    AS day,
  EXTRACT(hour FROM started_at)   AS hour,
  dayname(started_at)             AS weekday,
  EXTRACT(isodow FROM started_at) AS iso_weekday
FROM sessions
ORDER BY session_id
LIMIT 4;

-- @q by_hour
SELECT
  EXTRACT(hour FROM started_at) AS hour,
  COUNT(*)                      AS sessions
FROM sessions
GROUP BY hour
ORDER BY hour;

-- @q by_weekday
SELECT
  dayname(started_at)           AS weekday,
  EXTRACT(isodow FROM started_at) AS d,
  COUNT(*)                      AS sessions,
  ROUND(COUNT(*) / COUNT(DISTINCT started_at::DATE), 1) AS per_day
FROM sessions
GROUP BY ALL
ORDER BY d;

-- @q trunc
SELECT
  started_at,
  date_trunc('hour',  started_at) AS hour,
  date_trunc('day',   started_at) AS day,
  date_trunc('week',  started_at) AS week_starting_monday,
  date_trunc('month', started_at) AS month
FROM sessions
WHERE session_id = 1500;

-- @q diff
SELECT
  c.customer_id,
  c.signup_date,
  MIN(o.order_date)                                AS first_order,
  date_diff('day', c.signup_date, MIN(o.order_date)) AS days_to_first_order
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.signup_date
ORDER BY c.customer_id
LIMIT 6;

-- @q add_interval
SELECT
  order_id,
  order_date,
  order_date + INTERVAL 30 DAY      AS return_deadline,
  order_date + INTERVAL 1 MONTH     AS one_month_later,
  last_day(order_date)              AS end_of_month
FROM orders
WHERE order_id IN (1001, 1050, 1340);

-- @q timestamp_filter_wrong
SELECT COUNT(*) AS sessions
FROM sessions
WHERE started_at BETWEEN '2025-11-27' AND '2025-11-28';

-- @q timestamp_filter_right
SELECT COUNT(*) AS sessions
FROM sessions
WHERE started_at >= '2025-11-27' AND started_at < '2025-11-29';

-- @q format
SELECT
  order_date,
  strftime(order_date, '%b %d, %Y')  AS pretty,
  strftime(order_date, '%Y-%m')      AS year_month,
  strftime(order_date, '%A')         AS weekday
FROM orders
WHERE order_id = 1340;

-- @q strings
SELECT
  email,
  LENGTH(email)                       AS length,
  UPPER(first_name)                   AS upper_name,
  SUBSTRING(email, 1, 5)              AS first_five,
  POSITION('@' IN email)              AS at_position,
  SPLIT_PART(email, '@', 1)           AS local_part,
  SPLIT_PART(email, '@', 2)           AS domain,
  REPLACE(email, '@example.com', '')  AS without_domain
FROM customers
WHERE customer_id IN (1, 2);

-- @q concat
SELECT
  first_name || ' ' || last_name                AS with_pipes,
  CONCAT(first_name, ' ', last_name)            AS with_concat,
  CONCAT_WS(', ', city, state)                  AS location,
  first_name || ' from ' || city                AS pipes_with_null
FROM customers
WHERE customer_id IN (1, 51);

-- @q regex
SELECT
  name,
  regexp_matches(name, '\d')                        AS has_digit,
  regexp_extract(name, '(\d+)', 1)                  AS first_number,
  regexp_replace(name, '\s*\(.*\)', '')             AS without_parentheses
FROM products
WHERE name SIMILAR TO '.*[0-9].*';

-- @q messy
WITH signups_raw(id, email, city, age, referral) AS (
  VALUES
    (1, '  Ava.Smith@Example.com ', 'austin',      '34',  'Email'),
    (2, 'liam.jones@example.com',   'AUSTIN ',     '41',  ''),
    (3, 'ava.smith@example.com',    'Austin',      'n/a', 'email '),
    (4, NULL,                       '',            '29',  'Social'),
    (5, 'noah@example.com',         'Dallas',      ' 52', NULL)
)
SELECT * FROM signups_raw;

-- @q cleaned
WITH signups_raw(id, email, city, age, referral) AS (
  VALUES
    (1, '  Ava.Smith@Example.com ', 'austin',      '34',  'Email'),
    (2, 'liam.jones@example.com',   'AUSTIN ',     '41',  ''),
    (3, 'ava.smith@example.com',    'Austin',      'n/a', 'email '),
    (4, NULL,                       '',            '29',  'Social'),
    (5, 'noah@example.com',         'Dallas',      ' 52', NULL)
)
SELECT
  id,
  LOWER(TRIM(email))                              AS email,
  NULLIF(UPPER(LEFT(TRIM(city), 1)) || LOWER(SUBSTRING(TRIM(city), 2)), '') AS city,
  TRY_CAST(TRIM(age) AS INTEGER)                  AS age,
  COALESCE(LOWER(NULLIF(TRIM(referral), '')), 'unknown') AS referral
FROM signups_raw;

-- @q dedupe
WITH signups_raw(id, email) AS (
  VALUES (1, '  Ava.Smith@Example.com '), (2, 'liam.jones@example.com'), (3, 'ava.smith@example.com'), (5, 'noah@example.com')
),
cleaned AS (
  SELECT id, LOWER(TRIM(email)) AS email FROM signups_raw
)
SELECT email, COUNT(*) AS signups, MIN(id) AS first_id
FROM cleaned
GROUP BY email
HAVING COUNT(*) > 1;

-- @q dup_customers
SELECT LOWER(email) AS email, COUNT(*) AS customers, STRING_AGG(customer_id::VARCHAR, ', ') AS ids
FROM customers
WHERE email IS NOT NULL
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;

-- @q cast_fail !error
SELECT CAST('n/a' AS INTEGER) AS age;

-- @q nullif_div
SELECT
  channel,
  COUNT(*) FILTER (WHERE status = 'returned')  AS returned,
  COUNT(*) FILTER (WHERE status = 'cancelled' AND order_date >= '2025-12-20') AS late_dec_cancels,
  ROUND(COUNT(*) FILTER (WHERE status = 'returned')
    / NULLIF(COUNT(*) FILTER (WHERE status = 'cancelled' AND order_date >= '2025-12-20'), 0), 2) AS returns_per_late_cancel
FROM orders
GROUP BY channel
ORDER BY channel;

-- @q null_audit
SELECT
  COUNT(*)                     AS rows,
  COUNT(*) - COUNT(email)      AS missing_email,
  COUNT(*) - COUNT(city)       AS missing_city,
  COUNT(*) - COUNT(state)      AS missing_state,
  COUNT(DISTINCT LOWER(email)) AS distinct_emails
FROM customers;

-- @q orphan_check
SELECT o.order_id, o.order_date, o.status
FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM order_items i WHERE i.order_id = o.order_id);

-- @q ex1
SELECT
  date_trunc('week', started_at)::DATE AS week,
  COUNT(*)                             AS sessions,
  COUNT(*) FILTER (WHERE device = 'mobile') AS mobile
FROM sessions
GROUP BY week
ORDER BY week;

-- @q ex2
SELECT SPLIT_PART(LOWER(email), '@', 2) AS domain, COUNT(*) AS customers
FROM customers
WHERE email IS NOT NULL
GROUP BY domain;

-- @q ex3
SELECT
  customer_id,
  first_name,
  signup_date,
  date_diff('day', signup_date, DATE '2025-12-31') AS days_as_customer
FROM customers
WHERE signup_date >= DATE '2025-12-31' - INTERVAL 60 DAY
ORDER BY signup_date;
