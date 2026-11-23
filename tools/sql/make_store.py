"""Generate the store database used by the SQL series.

Writes public/sql/store.sql: CREATE TABLE + INSERT statements that run
unchanged in DuckDB (browser and Python). Deterministic (fixed seed).

Tables
  customers(customer_id, first_name, last_name, email, city, state, signup_date, segment)
  products(product_id, name, category, price)
  orders(order_id, customer_id, order_date, status, channel)
  order_items(order_id, product_id, quantity, unit_price)
  employees(employee_id, name, title, manager_id, hired_on)
  sessions(session_id, customer_id, started_at, device, source)
  events(session_id, event_time, event_type, product_id)
  experiment(session_id, variant)
"""
import random, datetime as dt, os, math

R = random.Random(2027)
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "sql", "store.sql")

FIRST = "Ava Liam Noah Emma Olivia Mason Sophia Ethan Isabella Lucas Mia Aiden Amelia Elijah Harper James Evelyn Logan Abigail Benjamin Ella Henry Aria Jackson Chloe Sebastian Layla Daniel Zoe Matthew Nora Samuel Riley David Lily Joseph Hannah Carter Grace Owen Priya Arjun Wei Mei Diego Sofia Omar Fatima Kenji Yuki".split()
LAST = "Smith Johnson Williams Brown Jones Garcia Miller Davis Rodriguez Martinez Hernandez Lopez Gonzalez Wilson Anderson Thomas Taylor Moore Jackson Martin Lee Perez Thompson White Harris Sanchez Clark Ramirez Lewis Robinson Walker Young Allen King Wright Scott Patel Nguyen Kim Chen".split()
CITIES = [("Austin", "TX"), ("Dallas", "TX"), ("Houston", "TX"), ("Seattle", "WA"), ("Portland", "OR"), ("Denver", "CO"), ("Chicago", "IL"), ("Boston", "MA"), ("New York", "NY"), ("Miami", "FL"), ("Atlanta", "GA"), ("Phoenix", "AZ"), ("San Jose", "CA"), ("Los Angeles", "CA"), ("Bentonville", "AR")]
CITY_W = [6, 5, 5, 6, 4, 4, 6, 4, 8, 4, 4, 4, 4, 7, 3]

PRODUCTS = [
    ("Trail Running Shoes", "Footwear", 89.99), ("Everyday Sneakers", "Footwear", 59.99), ("Rain Boots", "Footwear", 44.50), ("Wool Socks (3-pack)", "Footwear", 14.99),
    ("Insulated Water Bottle", "Outdoor", 24.99), ("Daypack 20L", "Outdoor", 64.00), ("Camping Lantern", "Outdoor", 29.95), ("Two-Person Tent", "Outdoor", 179.00), ("Sleeping Bag", "Outdoor", 119.00),
    ("Wireless Earbuds", "Electronics", 79.00), ("Phone Charger", "Electronics", 19.99), ("Bluetooth Speaker", "Electronics", 49.99), ("Smart Watch", "Electronics", 199.00), ("USB-C Cable", "Electronics", 9.99),
    ("Coffee Beans 1lb", "Grocery", 12.49), ("Green Tea (50 bags)", "Grocery", 6.99), ("Dark Chocolate Bar", "Grocery", 3.49), ("Trail Mix", "Grocery", 7.99),
    ("Yoga Mat", "Fitness", 34.99), ("Resistance Bands", "Fitness", 19.50), ("Dumbbell Set", "Fitness", 89.00), ("Foam Roller", "Fitness", 24.00),
]

def q(v):
    if v is None:
        return "NULL"
    if isinstance(v, (int,)) and not isinstance(v, bool):
        return str(v)
    if isinstance(v, float):
        return f"{v:.2f}"
    if isinstance(v, (dt.date, dt.datetime)):
        return f"'{v.isoformat(sep=' ') if isinstance(v, dt.datetime) else v.isoformat()}'"
    return "'" + str(v).replace("'", "''") + "'"

def inserts(table, rows, chunk=200):
    out = []
    for i in range(0, len(rows), chunk):
        vals = ",\n".join("(" + ", ".join(q(x) for x in r) + ")" for r in rows[i : i + chunk])
        out.append(f"INSERT INTO {table} VALUES\n{vals};")
    return "\n".join(out)

# ---------- customers ----------
customers = []
used = set()
for cid in range(1, 151):
    while True:
        f, l = R.choice(FIRST), R.choice(LAST)
        if (f, l) not in used:
            used.add((f, l)); break
    city, state = R.choices(CITIES, CITY_W)[0]
    if R.random() < 0.05:
        city = None  # missing city (for NULL lessons); state kept
    email = f"{f.lower()}.{l.lower()}@example.com" if R.random() > 0.04 else None
    signup = dt.date(2024, 1, 1) + dt.timedelta(days=R.randrange(0, 700))
    seg = R.choices(["consumer", "business"], [0.85, 0.15])[0]
    customers.append([cid, f, l, email, city, state, signup, seg])
# a duplicate-ish email for data-cleaning lessons
customers[41][3] = customers[12][3].upper() if customers[12][3] else customers[41][3]

# ---------- products ----------
products = [[i + 1, n, c, p] for i, (n, c, p) in enumerate(PRODUCTS)]
pop = [6, 9, 3, 7, 8, 4, 3, 1.5, 2, 6, 8, 4, 2, 9, 10, 5, 7, 6, 4, 4, 1.5, 3]

# ---------- orders + items ----------
orders, items = [], []
oid = 1000
active = [c for c in customers if R.random() > 0.12]  # ~12% never order
for c in active:
    n_orders = max(1, int(R.expovariate(1 / 3.2)))
    start = max(c[6], dt.date(2025, 1, 1))
    for _ in range(n_orders):
        if start > dt.date(2025, 12, 31):
            break
        d = start + dt.timedelta(days=R.randrange(0, max(1, (dt.date(2025, 12, 31) - start).days + 1)))
        # holiday bump
        if R.random() < 0.15:
            d = dt.date(2025, 11, R.randrange(20, 31)) if R.random() < 0.6 else dt.date(2025, 12, R.randrange(1, 24))
        oid += 1
        status = R.choices(["completed", "cancelled", "returned"], [0.88, 0.07, 0.05])[0]
        channel = R.choices(["web", "app", "store"], [0.5, 0.35, 0.15])[0]
        orders.append([oid, c[0], d, status, channel])
        k = R.choices([1, 2, 3, 4], [0.45, 0.3, 0.17, 0.08])[0]
        chosen = set()
        for _ in range(k):
            p = R.choices(products, pop)[0]
            if p[0] in chosen:
                continue
            chosen.add(p[0])
            qty = R.choices([1, 2, 3], [0.75, 0.2, 0.05])[0]
            price = p[3] if R.random() > 0.2 else round(p[3] * 0.85, 2)  # sale price
            items.append([oid, p[0], qty, price])
orders.sort(key=lambda o: (o[2], o[0]))
# renumber order ids chronologically
remap = {o[0]: 1001 + i for i, o in enumerate(orders)}
for o in orders:
    o[0] = remap[o[0]]
for it in items:
    it[0] = remap[it[0]]
items.sort()
# a couple of orders with no items (data quality lesson)
orders.append([1001 + len(orders), R.choice(active)[0], dt.date(2025, 12, 30), "cancelled", "web"])

# ---------- employees (hierarchy) ----------
employees = [
    [1, "Dana Whitfield", "CEO", None, dt.date(2015, 3, 1)],
    [2, "Marcus Chen", "VP Operations", 1, dt.date(2016, 6, 15)],
    [3, "Priya Raman", "VP Technology", 1, dt.date(2017, 1, 9)],
    [4, "Luis Ortega", "Store Manager", 2, dt.date(2018, 4, 2)],
    [5, "Grace Kim", "Logistics Lead", 2, dt.date(2019, 8, 19)],
    [6, "Sam Okafor", "Data Science Manager", 3, dt.date(2019, 2, 11)],
    [7, "Elena Petrova", "Engineering Manager", 3, dt.date(2018, 11, 5)],
    [8, "Tom Becker", "Sales Associate", 4, dt.date(2021, 5, 24)],
    [9, "Aisha Bello", "Sales Associate", 4, dt.date(2022, 9, 12)],
    [10, "Ravi Shah", "Data Scientist", 6, dt.date(2021, 7, 1)],
    [11, "Hannah Weiss", "Data Analyst", 6, dt.date(2023, 1, 16)],
    [12, "Jin Park", "Software Engineer", 7, dt.date(2020, 3, 30)],
    [13, "Olivia Brooks", "Software Engineer", 7, dt.date(2022, 10, 3)],
    [14, "Mateo Silva", "Warehouse Associate", 5, dt.date(2023, 6, 6)],
    [15, "Nina Rossi", "Junior Data Analyst", 11, dt.date(2025, 2, 3)],
]

# ---------- sessions, events, experiment ----------
sessions, events, exp = [], [], []
sid = 0
base = dt.datetime(2025, 11, 1)
DEVICES, SOURCES = ["mobile", "desktop", "tablet"], ["search", "email", "social", "direct", "ads"]
for day in range(28):  # Nov 1 – Nov 28, 2025
    for _ in range(R.randrange(55, 85)):
        sid += 1
        cust = R.choice(customers)[0] if R.random() < 0.6 else None
        start = base + dt.timedelta(days=day, seconds=R.randrange(6 * 3600, 23 * 3600))
        dev = R.choices(DEVICES, [0.58, 0.35, 0.07])[0]
        src = R.choices(SOURCES, [0.35, 0.15, 0.15, 0.25, 0.10])[0]
        sessions.append([sid, cust, start, dev, src])
        variant = "B" if R.random() < 0.5 else "A"
        exp.append([sid, variant])
        t = start
        prod = R.choices(products, pop)[0][0]
        # funnel with variant B improving checkout -> purchase
        steps = ["view_product"]
        if R.random() < 0.42:
            steps.append("add_to_cart")
            if R.random() < 0.55:
                steps.append("checkout")
                if R.random() < (0.62 if variant == "A" else 0.72):
                    steps.append("purchase")
        for k, e in enumerate(steps):
            t = t + dt.timedelta(seconds=R.randrange(20, 400))
            events.append([sid, t, e, prod])
            if e == "view_product" and R.random() < 0.35:  # extra product views
                t = t + dt.timedelta(seconds=R.randrange(20, 200))
                events.append([sid, t, "view_product", R.choices(products, pop)[0][0]])
events.sort(key=lambda e: (e[1], e[0]))

schema = """-- Store database for the SQL series on arjunchidambaram.github.io (synthetic data)
CREATE TABLE customers (customer_id INTEGER PRIMARY KEY, first_name VARCHAR, last_name VARCHAR, email VARCHAR, city VARCHAR, state VARCHAR, signup_date DATE, segment VARCHAR);
CREATE TABLE products (product_id INTEGER PRIMARY KEY, name VARCHAR, category VARCHAR, price DECIMAL(8,2));
CREATE TABLE orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER, order_date DATE, status VARCHAR, channel VARCHAR);
CREATE TABLE order_items (order_id INTEGER, product_id INTEGER, quantity INTEGER, unit_price DECIMAL(8,2));
CREATE TABLE employees (employee_id INTEGER PRIMARY KEY, name VARCHAR, title VARCHAR, manager_id INTEGER, hired_on DATE);
CREATE TABLE sessions (session_id INTEGER PRIMARY KEY, customer_id INTEGER, started_at TIMESTAMP, device VARCHAR, source VARCHAR);
CREATE TABLE events (session_id INTEGER, event_time TIMESTAMP, event_type VARCHAR, product_id INTEGER);
CREATE TABLE experiment (session_id INTEGER, variant VARCHAR);
"""
body = "\n".join([
    inserts("customers", customers), inserts("products", products), inserts("orders", orders),
    inserts("order_items", items), inserts("employees", employees), inserts("sessions", sessions),
    inserts("events", events, 300), inserts("experiment", exp, 400),
])
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w") as f:
    f.write(schema + body + "\n")
print("customers", len(customers), "orders", len(orders), "items", len(items), "sessions", len(sessions), "events", len(events), "bytes", os.path.getsize(OUT))
