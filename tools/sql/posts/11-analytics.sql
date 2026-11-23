-- @q events_peek
SELECT session_id, event_time, event_type, product_id
FROM events
WHERE session_id IN (2, 3)
ORDER BY session_id, event_time;

-- @q funnel
WITH steps AS (
  SELECT
    COUNT(DISTINCT session_id)                                                AS sessions,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'view_product')     AS viewed,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'add_to_cart')      AS carted,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'checkout')         AS checked_out,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'purchase')         AS purchased
  FROM events
)
SELECT *, ROUND(100.0 * purchased / viewed, 1) AS overall_conversion_pct
FROM steps;

-- @q funnel_long
WITH counts AS (
  SELECT event_type, COUNT(DISTINCT session_id) AS sessions
  FROM events
  GROUP BY event_type
),
ordered AS (
  SELECT
    CASE event_type WHEN 'view_product' THEN 1 WHEN 'add_to_cart' THEN 2
                    WHEN 'checkout' THEN 3 ELSE 4 END AS step,
    event_type, sessions
  FROM counts
)
SELECT
  step, event_type, sessions,
  ROUND(100.0 * sessions / FIRST_VALUE(sessions) OVER (ORDER BY step), 1) AS pct_of_top,
  ROUND(100.0 * sessions / LAG(sessions) OVER (ORDER BY step), 1)         AS pct_of_previous
FROM ordered
ORDER BY step;

-- @q funnel_device
SELECT
  s.device,
  COUNT(DISTINCT e.session_id)                                            AS sessions,
  COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_type = 'add_to_cart') AS carted,
  COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_type = 'purchase')    AS purchased,
  ROUND(100.0 * COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_type = 'purchase')
              / COUNT(DISTINCT e.session_id), 1)                          AS conversion_pct
FROM events e
JOIN sessions s ON s.session_id = e.session_id
GROUP BY s.device
ORDER BY conversion_pct DESC;

-- @q funnel_strict
WITH firsts AS (
  SELECT
    session_id,
    MIN(event_time) FILTER (WHERE event_type = 'view_product') AS t_view,
    MIN(event_time) FILTER (WHERE event_type = 'add_to_cart')  AS t_cart,
    MIN(event_time) FILTER (WHERE event_type = 'checkout')     AS t_checkout,
    MIN(event_time) FILTER (WHERE event_type = 'purchase')     AS t_purchase
  FROM events
  GROUP BY session_id
)
SELECT
  COUNT(t_view)                                      AS viewed,
  COUNT(*) FILTER (WHERE t_cart > t_view)            AS then_carted,
  COUNT(*) FILTER (WHERE t_checkout > t_cart AND t_cart > t_view) AS then_checked_out,
  COUNT(*) FILTER (WHERE t_purchase > t_checkout AND t_checkout > t_cart AND t_cart > t_view) AS then_purchased,
  ROUND(MEDIAN(EXTRACT(EPOCH FROM t_purchase - t_view) / 60), 1) AS median_minutes_view_to_purchase
FROM firsts;

-- @q cohort_first
SELECT
  customer_id,
  MIN(order_date)                          AS first_order,
  CAST(date_trunc('month', MIN(order_date)) AS DATE) AS cohort_month
FROM orders
GROUP BY customer_id
ORDER BY customer_id
LIMIT 5;

-- @q cohorts
WITH firsts AS (
  SELECT customer_id, date_trunc('month', MIN(order_date)) AS cohort
  FROM orders
  GROUP BY customer_id
),
activity AS (
  SELECT DISTINCT
    o.customer_id,
    f.cohort,
    date_diff('month', f.cohort, date_trunc('month', o.order_date)) AS month_number
  FROM orders o
  JOIN firsts f USING (customer_id)
)
SELECT
  CAST(cohort AS DATE) AS cohort,
  month_number,
  COUNT(*) AS active_customers
FROM activity
WHERE cohort >= DATE '2025-07-01'
GROUP BY cohort, month_number
ORDER BY cohort, month_number
LIMIT 12;

-- @q retention
WITH firsts AS (
  SELECT customer_id, date_trunc('month', MIN(order_date)) AS cohort
  FROM orders
  GROUP BY customer_id
),
activity AS (
  SELECT DISTINCT o.customer_id, f.cohort,
         date_diff('month', f.cohort, date_trunc('month', o.order_date)) AS m
  FROM orders o JOIN firsts f USING (customer_id)
)
SELECT
  strftime(cohort, '%Y-%m')                                       AS cohort,
  COUNT(*) FILTER (WHERE m = 0)                                   AS customers,
  CASE WHEN cohort + INTERVAL 1 MONTH <= DATE '2025-12-01' -- month 1 has happened
       THEN ROUND(100.0 * COUNT(*) FILTER (WHERE m = 1) / COUNT(*) FILTER (WHERE m = 0)) END AS m1_pct,
  CASE WHEN cohort + INTERVAL 2 MONTH <= DATE '2025-12-01' -- month 2 has happened
       THEN ROUND(100.0 * COUNT(*) FILTER (WHERE m = 2) / COUNT(*) FILTER (WHERE m = 0)) END AS m2_pct,
  CASE WHEN cohort + INTERVAL 3 MONTH <= DATE '2025-12-01' -- month 3 has happened
       THEN ROUND(100.0 * COUNT(*) FILTER (WHERE m = 3) / COUNT(*) FILTER (WHERE m = 0)) END AS m3_pct
FROM activity
GROUP BY cohort
ORDER BY cohort;

-- @q repeat_gap
WITH gaps AS (
  SELECT
    customer_id,
    order_date - LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS days_since_previous
  FROM orders
  WHERE status <> 'cancelled'
)
SELECT
  COUNT(DISTINCT customer_id)                                    AS customers,
  COUNT(DISTINCT customer_id) FILTER (WHERE days_since_previous IS NOT NULL) AS repeat_customers,
  MEDIAN(days_since_previous)                                    AS median_days_between_orders,
  QUANTILE_CONT(days_since_previous, 0.9)                        AS p90_days
FROM gaps;

-- @q active
SELECT
  CAST(started_at AS DATE)                                       AS day,
  COUNT(DISTINCT customer_id)                                    AS active_customers,
  ROUND(AVG(COUNT(DISTINCT customer_id)) OVER (
    ORDER BY CAST(started_at AS DATE) ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 1) AS avg_7d
FROM sessions
WHERE customer_id IS NOT NULL
GROUP BY CAST(started_at AS DATE)
ORDER BY day
LIMIT 10;

-- @q wau
SELECT
  d.day,
  COUNT(DISTINCT s.customer_id) AS active_last_7_days
FROM (SELECT DISTINCT CAST(started_at AS DATE) AS day FROM sessions) d
JOIN sessions s
  ON CAST(s.started_at AS DATE) BETWEEN d.day - 6 AND d.day
WHERE s.customer_id IS NOT NULL
  AND d.day >= DATE '2025-11-07'
GROUP BY d.day
ORDER BY d.day
LIMIT 7;

-- @q sessionize_flags
WITH ev AS (
  SELECT s.customer_id, e.event_time, e.event_type
  FROM events e
  JOIN sessions s ON s.session_id = e.session_id
  WHERE s.customer_id = 127
)
SELECT
  event_time,
  event_type,
  event_time - LAG(event_time) OVER (ORDER BY event_time) AS gap,
  CASE WHEN LAG(event_time) OVER (ORDER BY event_time) IS NULL
         OR event_time - LAG(event_time) OVER (ORDER BY event_time) > INTERVAL 30 MINUTE
       THEN 1 ELSE 0 END AS new_session
FROM ev
ORDER BY event_time
LIMIT 10;

-- @q sessionize
WITH ev AS (
  SELECT s.customer_id, e.event_time, e.event_type
  FROM events e
  JOIN sessions s ON s.session_id = e.session_id
  WHERE s.customer_id IS NOT NULL
),
flagged AS (
  SELECT *,
    CASE WHEN event_time - LAG(event_time) OVER w > INTERVAL 30 MINUTE
              OR LAG(event_time) OVER w IS NULL
         THEN 1 ELSE 0 END AS new_session
  FROM ev
  WINDOW w AS (PARTITION BY customer_id ORDER BY event_time)
),
numbered AS (
  SELECT *,
    SUM(new_session) OVER (PARTITION BY customer_id ORDER BY event_time) AS session_number
  FROM flagged
)
SELECT
  customer_id, session_number,
  MIN(event_time) AS started,
  MAX(event_time) AS ended,
  COUNT(*)        AS events,
  BOOL_OR(event_type = 'purchase') AS purchased
FROM numbered
WHERE customer_id = 127
GROUP BY customer_id, session_number
ORDER BY session_number
LIMIT 8;

-- @q ab_rates
WITH per_session AS (
  SELECT
    x.session_id,
    x.variant,
    COALESCE(BOOL_OR(e.event_type = 'purchase'), false) AS converted
  FROM experiment x
  LEFT JOIN events e ON e.session_id = x.session_id
  GROUP BY x.session_id, x.variant
)
SELECT
  variant,
  COUNT(*)                                  AS sessions,
  COUNT(*) FILTER (WHERE converted)         AS conversions,
  ROUND(100.0 * AVG(converted::INT), 2)     AS conversion_pct
FROM per_session
GROUP BY variant
ORDER BY variant;

-- @q ab_test
WITH per_session AS (
  SELECT x.session_id, x.variant,
         COALESCE(BOOL_OR(e.event_type = 'purchase'), false)::INT AS converted
  FROM experiment x
  LEFT JOIN events e ON e.session_id = x.session_id
  GROUP BY x.session_id, x.variant
),
g AS (
  SELECT
    COUNT(*) FILTER (WHERE variant = 'A')          AS n_a,
    COUNT(*) FILTER (WHERE variant = 'B')          AS n_b,
    AVG(converted) FILTER (WHERE variant = 'A')    AS p_a,
    AVG(converted) FILTER (WHERE variant = 'B')    AS p_b,
    AVG(converted)                                 AS p_pool
  FROM per_session
)
SELECT
  ROUND(100 * p_a, 2)                                            AS a_pct,
  ROUND(100 * p_b, 2)                                            AS b_pct,
  ROUND(100 * (p_b - p_a), 2)                                    AS lift_pts,
  ROUND((p_b - p_a) / SQRT(p_pool * (1 - p_pool) * (1.0 / n_a + 1.0 / n_b)), 2) AS z,
  ROUND(100 * (p_b - p_a - 1.96 * SQRT(p_a * (1 - p_a) / n_a + p_b * (1 - p_b) / n_b)), 2) AS ci_low_pts,
  ROUND(100 * (p_b - p_a + 1.96 * SQRT(p_a * (1 - p_a) / n_a + p_b * (1 - p_b) / n_b)), 2) AS ci_high_pts
FROM g;

-- @q srm
SELECT
  variant,
  COUNT(*) AS sessions,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS pct_of_traffic
FROM experiment
GROUP BY variant
ORDER BY variant;

-- @q rfm
WITH per_customer AS (
  SELECT
    o.customer_id,
    DATE '2026-01-01' - MAX(o.order_date)     AS recency_days,
    COUNT(DISTINCT o.order_id)                AS frequency,
    SUM(oi.quantity * oi.unit_price)          AS monetary
  FROM orders o
  JOIN order_items oi USING (order_id)
  WHERE o.status <> 'cancelled'
  GROUP BY o.customer_id
),
scored AS (
  SELECT *,
    NTILE(3) OVER (ORDER BY recency_days DESC) AS r,
    NTILE(3) OVER (ORDER BY frequency)         AS f,
    NTILE(3) OVER (ORDER BY monetary)          AS m
  FROM per_customer
)
SELECT
  CASE
    WHEN r = 3 AND f = 3 THEN 'champions'
    WHEN r = 3           THEN 'recent'
    WHEN r = 1 AND f >= 2 THEN 'at risk'
    WHEN r = 1           THEN 'lapsed'
    ELSE 'steady'
  END AS rfm_segment,
  COUNT(*)                     AS customers,
  ROUND(AVG(recency_days))     AS avg_recency_days,
  ROUND(AVG(frequency), 1)     AS avg_orders,
  ROUND(AVG(monetary))         AS avg_spend
FROM scored
GROUP BY rfm_segment
ORDER BY avg_spend DESC;

-- @q ex1
SELECT
  s.source,
  COUNT(DISTINCT e.session_id) AS sessions,
  ROUND(100.0 * COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_type = 'add_to_cart') / COUNT(DISTINCT e.session_id), 1) AS cart_pct,
  ROUND(100.0 * COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_type = 'purchase') / COUNT(DISTINCT e.session_id), 1) AS purchase_pct
FROM events e
JOIN sessions s USING (session_id)
GROUP BY s.source
ORDER BY purchase_pct DESC;

-- @q ex2
WITH firsts AS (
  SELECT customer_id, date_trunc('month', MIN(order_date)) AS cohort
  FROM orders GROUP BY customer_id
),
activity AS (
  SELECT DISTINCT o.customer_id, f.cohort,
         date_diff('month', f.cohort, date_trunc('month', o.order_date)) AS m
  FROM orders o JOIN firsts f USING (customer_id)
)
SELECT
  c.segment,
  COUNT(*) FILTER (WHERE a.m = 0) AS customers,
  ROUND(100.0 * COUNT(*) FILTER (WHERE a.m = 1) / COUNT(*) FILTER (WHERE a.m = 0), 1) AS m1_retention_pct
FROM activity a
JOIN customers c USING (customer_id)
WHERE a.cohort < DATE '2025-12-01'
GROUP BY c.segment;

-- @q ex3
WITH per_session AS (
  SELECT x.session_id, x.variant, s.device,
         COALESCE(BOOL_OR(e.event_type = 'purchase'), false)::INT AS converted
  FROM experiment x
  JOIN sessions s ON s.session_id = x.session_id
  LEFT JOIN events e ON e.session_id = x.session_id
  GROUP BY x.session_id, x.variant, s.device
)
SELECT
  device,
  ROUND(100 * AVG(converted) FILTER (WHERE variant = 'A'), 2) AS a_pct,
  ROUND(100 * AVG(converted) FILTER (WHERE variant = 'B'), 2) AS b_pct,
  COUNT(*) AS sessions
FROM per_session
GROUP BY device
ORDER BY device;
