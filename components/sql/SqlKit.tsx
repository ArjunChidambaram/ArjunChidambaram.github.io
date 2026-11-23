import { useState } from "react";
import Link from "next/link";

import { SQL_SERIES } from "lib/sql/series";
import { SqlBlock, type Saved } from "@/components/sql/SqlBlock";

/** Shared pieces for the SQL series articles. */

export const SCHEMA: { table: string; cols: string; about: string }[] = [
  { table: "customers", cols: "customer_id, first_name, last_name, email, city, state, signup_date, segment", about: "150 customers" },
  { table: "products", cols: "product_id, name, category, price", about: "22 products" },
  { table: "orders", cols: "order_id, customer_id, order_date, status, channel", about: "420 orders in 2025" },
  { table: "order_items", cols: "order_id, product_id, quantity, unit_price", about: "765 order lines" },
  { table: "employees", cols: "employee_id, name, title, manager_id, hired_on", about: "15 staff" },
  { table: "sessions", cols: "session_id, customer_id, started_at, device, source", about: "1,897 website visits, Nov 2025" },
  { table: "events", cols: "session_id, event_time, event_type, product_id", about: "4,184 clicks in those visits" },
  { table: "experiment", cols: "session_id, variant", about: "A/B test assignment per visit" },
];

export const SchemaRef: React.FC<{ only?: string[] }> = ({ only }) => (
  <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
    <table className="w-full text-[14px]">
      <thead className="bg-gray-50 dark:bg-carddark text-left">
        <tr>
          <th className="px-3 py-2 font-medium">Table</th>
          <th className="px-3 py-2 font-medium">Columns</th>
          <th className="px-3 py-2 font-medium">Holds</th>
        </tr>
      </thead>
      <tbody>
        {SCHEMA.filter((s) => !only || only.includes(s.table)).map((s) => (
          <tr key={s.table} className="border-t border-gray-100 dark:border-gray-700 align-top">
            <td className="px-3 py-1.5 font-mono font-semibold">{s.table}</td>
            <td className="px-3 py-1.5 font-mono text-[13px] text-gray-700 dark:text-gray-300">{s.cols}</td>
            <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{s.about}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const SeriesNav: React.FC<{ current: number }> = ({ current }) => (
  <nav aria-label="SQL series" className="my-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark p-4">
    <div className="font-semibold mb-2">The SQL series</div>
    <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[15px]">
      {SQL_SERIES.map((p) => (
        <li key={p.n} className="flex gap-2">
          <span className="tabular-nums text-gray-500 w-5 text-right">{p.n}.</span>
          {p.n === current ? (
            <strong>{p.title}</strong>
          ) : p.live ? (
            <Link className="link" href={`/blog/posts/${p.slug}/`}>
              {p.title}
            </Link>
          ) : (
            <span className="text-gray-500">{p.title}</span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

/** A practice question with a hidden answer. */
export const Exercise: React.FC<{ n: number; q: React.ReactNode; answer: Saved; hint?: React.ReactNode }> = ({ n, q, answer, hint }) => {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  return (
    <div className="my-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4">
      <div className="text-[16px]">
        <strong>Exercise {n}.</strong> {q}
      </div>
      <div className="mt-2 flex gap-4 text-sm">
        {hint && (
          <button type="button" className="link" onClick={() => setShowHint(!showHint)}>
            {showHint ? "Hide hint" : "Hint"}
          </button>
        )}
        <button type="button" className="link" onClick={() => setOpen(!open)}>
          {open ? "Hide answer" : "Show answer"}
        </button>
      </div>
      {showHint && hint && <p className="mt-2 text-[15px] text-gray-600 dark:text-gray-400">{hint}</p>}
      {open && <SqlBlock q={answer} title="One answer" />}
    </div>
  );
};

/** A highlighted note about how SQL engines differ. */
export const Dialect: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title = "Dialect differences" }) => (
  <aside className="my-6 rounded-lg border-l-4 border-sky-500 bg-sky-50 dark:bg-[#10202e] px-4 py-3 text-[15px] leading-relaxed">
    <div className="font-semibold mb-1">{title}</div>
    {children}
  </aside>
);

/** A highlighted common-mistake note. */
export const Gotcha: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title = "Common mistake" }) => (
  <aside className="my-6 rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-[#2a2210] px-4 py-3 text-[15px] leading-relaxed">
    <div className="font-semibold mb-1">{title}</div>
    {children}
  </aside>
);

/** Inline code. */
export const C: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[0.9em] font-mono">{children}</code>
);

/** A compact animated table for scrolly charts: rows can be kept, dropped or unknown; columns can be hidden. */
export type MiniRow = (string | number | null)[];
export const MiniTable: React.FC<{
  cols: string[];
  rows: MiniRow[];
  show?: boolean[];
  state?: ("keep" | "drop" | "unknown" | "gone" | null)[];
  sql?: string;
  extra?: { head: string; vals: (string | null)[] } | null;
}> = ({ cols, rows, show, state, sql, extra = null }) => (
  <div>
    {sql && <pre style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }} className="m-0 mb-3 rounded-lg bg-[#0f172a] text-gray-100 text-[14px] leading-relaxed p-3 whitespace-pre-wrap">{sql}</pre>}
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark">
      <table className="w-full text-[14px]">
        <thead className="bg-gray-50 dark:bg-[#1f2a36] text-left">
          <tr>
            {cols.map((c, j) => (
              <th key={c} className="px-2.5 py-1.5 font-medium transition-all duration-500" style={{ opacity: show && !show[j] ? 0 : 1, display: show && !show[j] ? "none" : undefined }}>
                {c}
              </th>
            ))}
            {extra && <th className="px-2.5 py-1.5 font-medium text-center">{extra.head}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const st = state?.[i] ?? null;
            if (st === "gone") return null;
            const bg = st === "keep" ? "rgba(5,206,145,0.18)" : st === "drop" ? "rgba(226,72,61,0.10)" : st === "unknown" ? "rgba(212,160,23,0.22)" : undefined;
            return (
              <tr key={i} className="border-t border-gray-100 dark:border-gray-700 transition-colors duration-500" style={{ background: bg, opacity: st === "drop" ? 0.45 : 1 }}>
                {r.map((v, j) =>
                  show && !show[j] ? null : (
                    <td key={j} className="px-2.5 py-1">
                      {v === null ? <span className="italic text-gray-400">NULL</span> : v}
                    </td>
                  )
                )}
                {extra && <td className="px-2.5 py-1 text-center font-mono text-[13px]">{extra.vals[i] ?? ""}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
