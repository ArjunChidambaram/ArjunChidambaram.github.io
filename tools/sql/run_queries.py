"""Run every query in tools/sql/posts/*.sql against the store database and
save SQL + results to lib/sql/results/<file>.json for the articles.

Query file format:
    -- @q some_id            (a normal query)
    -- @q some_id !error     (expected to fail; the error message is stored)
    SELECT ...;
"""
import duckdb, glob, json, os, re, sys, datetime as dt, decimal

HERE = os.path.dirname(__file__)
ROOT = os.path.join(HERE, "..", "..")
STORE = open(os.path.join(ROOT, "public", "sql", "store.sql")).read()
OUTDIR = os.path.join(ROOT, "lib", "sql", "results")
MAX_ROWS = 60


def conv(v):
    if v is None:
        return None
    if isinstance(v, decimal.Decimal):
        return float(v)
    if isinstance(v, dt.datetime):
        return v.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(v, dt.date):
        return v.isoformat()
    if isinstance(v, dt.timedelta):
        return str(v)
    if isinstance(v, float):
        return round(v, 6)
    return v


def parse(path):
    blocks, cur = [], None
    for line in open(path):
        m = re.match(r"--\s*@q\s+(\w+)(\s+!error)?", line)
        if m:
            cur = {"id": m.group(1), "error": bool(m.group(2)), "lines": []}
            blocks.append(cur)
        elif cur is not None:
            cur["lines"].append(line.rstrip("\n"))
    for b in blocks:
        b["sql"] = "\n".join(b.pop("lines")).strip()
    return blocks


def main(only=None):
    os.makedirs(OUTDIR, exist_ok=True)
    for path in sorted(glob.glob(os.path.join(HERE, "posts", "*.sql"))):
        name = os.path.splitext(os.path.basename(path))[0]
        if only and only not in name:
            continue
        con = duckdb.connect()
        con.execute(STORE)
        out = {}
        for b in parse(path):
            rec = {"sql": b["sql"]}
            try:
                # run every statement; keep the result of the last one
                cur = con.execute(b["sql"])
                if cur.description is None:
                    rec.update(columns=[], rows=[], total=0)
                else:
                    cols = [d[0] for d in cur.description]
                    rows = cur.fetchall()
                    rec.update(columns=cols, rows=[[conv(v) for v in r] for r in rows[:MAX_ROWS]], total=len(rows))
                if b["error"]:
                    print(f"  !! {name}.{b['id']} was expected to fail but succeeded", file=sys.stderr)
            except Exception as e:  # noqa
                msg = str(e).split("\n")[0]
                rec["error"] = msg
                if not b["error"]:
                    print(f"  ERROR {name}.{b['id']}: {msg}", file=sys.stderr)
            out[b["id"]] = rec
        with open(os.path.join(OUTDIR, name + ".json"), "w") as f:
            json.dump(out, f, indent=0, default=str)
        print(name, len(out), "queries")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else None)
