/**
 * Lazily starts DuckDB-WASM in the reader's browser (only when they first
 * run a query), loads the store database, and runs queries.
 *
 * The WASM bundle (~8 MB) comes from jsDelivr; the store data comes from
 * this site (/sql/store.sql).
 */
import type { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

export type Cell = string | number | boolean | null;
export type QueryResult = { columns: string[]; rows: Cell[][]; total: number; ms: number };

let ready: Promise<{ db: AsyncDuckDB; conn: AsyncDuckDBConnection }> | null = null;

async function start() {
  const duckdb = await import("@duckdb/duckdb-wasm");
  const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
  const workerUrl = URL.createObjectURL(new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" }));
  const worker = new Worker(workerUrl);
  const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);
  await db.open({ query: { castBigIntToDouble: true, castDecimalToDouble: true } });
  const conn = await db.connect();
  const sql = await (await fetch("/sql/store.sql")).text();
  await conn.query(sql);
  return { db, conn };
}

export const loadDuck = () => (ready ??= start().catch((e) => ((ready = null), Promise.reject(e))));

const pad = (n: number) => String(n).padStart(2, "0");
function fmt(v: unknown, type: string): Cell {
  if (v === null || v === undefined) return null;
  if (typeof v === "bigint") return Number(v);
  if (/^Date/.test(type)) {
    const d = new Date(Number(v));
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
  if (/^Timestamp/.test(type)) {
    const d = new Date(Number(v));
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  }
  if (typeof v === "number") return Math.round(v * 1e6) / 1e6;
  if (typeof v === "string" || typeof v === "boolean") return v;
  if (typeof v === "object" && v && "toJSON" in v) return JSON.stringify((v as { toJSON: () => unknown }).toJSON());
  return String(v);
}

/** Runs SQL in a transaction that is always rolled back, so readers can't break the shared tables. */
export async function runQuery(sql: string, maxRows = 200): Promise<QueryResult> {
  const { conn } = await loadDuck();
  const t0 = performance.now();
  await conn.query("BEGIN TRANSACTION");
  try {
    const table = await conn.query(sql);
    const fields = table.schema.fields;
    const cols = fields.map((f) => f.name);
    const types = fields.map((f) => String(f.type));
    const rows: Cell[][] = [];
    const n = table.numRows;
    const vecs = cols.map((_, j) => table.getChildAt(j));
    for (let i = 0; i < Math.min(n, maxRows); i++) rows.push(vecs.map((vec, j) => fmt(vec ? vec.get(i) : null, types[j])));
    return { columns: cols, rows, total: n, ms: performance.now() - t0 };
  } finally {
    await conn.query("ROLLBACK").catch(() => undefined);
  }
}
