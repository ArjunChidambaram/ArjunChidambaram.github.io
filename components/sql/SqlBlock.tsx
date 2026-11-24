import { useEffect, useRef, useState } from "react";

import type { Cell } from "lib/sql/duck";

/**
 * A runnable SQL example. Shows the query (highlighted) and its result,
 * precomputed at build time so the page works instantly. "Edit" turns the
 * query into an editor; "Run" starts DuckDB in the browser and runs it.
 */

export type Saved = { sql: string; columns?: string[]; rows?: Cell[][]; total?: number; error?: string };

const KW =
  /\b(SELECT|FROM|WHERE|AND|OR|NOT|IN|IS|NULL|AS|ON|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|CROSS|NATURAL|USING|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|DISTINCT|CASE|WHEN|THEN|ELSE|END|WITH|RECURSIVE|UNION|ALL|INTERSECT|EXCEPT|OVER|PARTITION|ROWS|RANGE|BETWEEN|UNBOUNDED|PRECEDING|FOLLOWING|CURRENT|ROW|ASC|DESC|NULLS|FIRST|LAST|LIKE|ILIKE|EXISTS|ANY|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|VIEW|INDEX|DROP|ALTER|ADD|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|CHECK|DEFAULT|BEGIN|COMMIT|ROLLBACK|TRANSACTION|EXPLAIN|ANALYZE|CAST|INTERVAL|FILTER|WINDOW|QUALIFY|TRUE|FALSE|LATERAL|PIVOT|UNPIVOT|ROLLUP|CUBE|GROUPING|SETS|TEMP|IF|REPLACE)\b/gi;

export function highlight(sql: string) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const parts = sql.split(/('(?:[^']|'')*'|--[^\n]*)/g);
  return parts
    .map((p, i) => {
      if (i % 2 === 1) return p.startsWith("--") ? `<span class="sq-c">${esc(p)}</span>` : `<span class="sq-s">${esc(p)}</span>`;
      return esc(p)
        .replace(KW, (m) => `<span class="sq-k">${m}</span>`)
        .replace(/\b(\d+(?:\.\d+)?)\b/g, `<span class="sq-n">$1</span>`)
        .replace(/\b([a-z_]+)(?=\()/gi, `<span class="sq-f">$1</span>`);
    })
    .join("");
}

const fmtCell = (v: Cell) =>
  v === null ? (
    <span className="italic text-gray-400">NULL</span>
  ) : typeof v === "number" ? (
    String(Number(v.toFixed(4)))
  ) : typeof v === "string" && v.includes("\n") ? (
    // query plans and other multi-line text keep their layout
    <span className="block whitespace-pre font-mono text-[12px] leading-[1.25]">{v}</span>
  ) : (
    String(v)
  );

export const ResultTable: React.FC<{ columns: string[]; rows: Cell[][]; total: number; max?: number; highlightCol?: string }> = ({ columns, rows, total, max = 12, highlightCol }) => {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, max);
  const numeric = columns.map((_, j) => rows.length > 0 && rows.every((r) => r[j] === null || typeof r[j] === "number"));
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-[14px] tabular-nums">
          <thead>
            <tr className="text-left bg-gray-50 dark:bg-[#1f2a36]">
              {columns.map((c, j) => (
                <th key={j} className={`px-3 py-1.5 font-medium whitespace-nowrap ${numeric[j] ? "text-right" : ""}`} style={c === highlightCol ? { color: "#047857" } : undefined}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                {r.map((v, j) => (
                  <td key={j} className={`px-3 py-1 whitespace-nowrap ${numeric[j] ? "text-right" : ""}`}>
                    {fmtCell(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-1.5 text-[12px] text-gray-500 border-t border-gray-100 dark:border-gray-700 flex gap-3">
        <span>
          {total.toLocaleString("en-US")} row{total === 1 ? "" : "s"}
          {total > rows.length ? ` (first ${rows.length} shown)` : ""}
        </span>
        {rows.length > max && (
          <button type="button" className="link" onClick={() => setAll(!all)}>
            {all ? "Show fewer" : `Show ${rows.length}`}
          </button>
        )}
      </div>
    </div>
  );
};

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', monospace";

type Live = { columns: string[]; rows: Cell[][]; total: number; ms: number } | { error: string } | null;

export const SqlBlock: React.FC<{ q: Saved; title?: string; max?: number; hideResult?: boolean; highlightCol?: string }> = ({ q, title, max, hideResult = false, highlightCol }) => {
  const [code, setCode] = useState(q.sql);
  const [editing, setEditing] = useState(false);
  const [live, setLive] = useState<Live>(null);
  const [busy, setBusy] = useState<"" | "loading" | "running">("");
  const [showRes, setShowRes] = useState(!hideResult);
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && ta.current) {
      ta.current.style.height = "auto";
      ta.current.style.height = ta.current.scrollHeight + 4 + "px";
    }
  }, [editing, code]);

  const run = async () => {
    setShowRes(true);
    setBusy("loading");
    try {
      const { loadDuck, runQuery } = await import("lib/sql/duck");
      await loadDuck();
      setBusy("running");
      setLive(await runQuery(code));
    } catch (e) {
      setLive({ error: String((e as Error)?.message ?? e).split("\n")[0] });
    } finally {
      setBusy("");
    }
  };
  const changed = code !== q.sql;

  return (
    <figure className="my-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark overflow-hidden not-prose">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 dark:border-gray-700 text-[13px]">
        <span className="font-medium text-gray-600 dark:text-gray-300">{title ?? "SQL"}</span>
        <span className="ml-auto flex gap-2">
          {changed && (
            <button type="button" className="text-gray-500 hover:underline" onClick={() => (setCode(q.sql), setLive(null))}>
              Reset
            </button>
          )}
          <button type="button" className="text-gray-600 dark:text-gray-300 hover:underline" onClick={() => setEditing(!editing)}>
            {editing ? "Done" : "Edit"}
          </button>
          <button
            type="button"
            onClick={run}
            disabled={!!busy}
            className="rounded bg-marrsgreen dark:bg-carrigreen px-2.5 py-0.5 font-medium text-white dark:text-bgdark disabled:opacity-60"
          >
            {busy === "loading" ? "Starting DuckDB…" : busy === "running" ? "Running…" : "Run ▸"}
          </button>
        </span>
      </div>
      {editing ? (
        <textarea
          ref={ta}
          value={code}
          spellCheck={false}
          aria-label="SQL query"
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              run();
            }
          }}
          className="block w-full resize-none bg-[#0f172a] text-gray-100 text-[14px] leading-relaxed p-3 outline-none"
          style={{ fontFamily: MONO }}
        />
      ) : (
        <pre className="sq-code m-0 overflow-x-auto bg-[#0f172a] text-gray-100 text-[14px] leading-relaxed p-3 cursor-text" style={{ fontFamily: MONO }} onClick={() => setEditing(true)}>
          <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
        </pre>
      )}
      {showRes && (
        <div className="text-gray-900 dark:text-gray-100">
          {live && "error" in live ? (
            <div className="px-3 py-2 text-[14px] text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap">{live.error}</div>
          ) : live ? (
            <>
              <div className="px-3 pt-1.5 text-[12px] text-gray-500">Ran in your browser in {Math.max(1, Math.round(live.ms))} ms</div>
              <ResultTable columns={live.columns} rows={live.rows} total={live.total} max={max} highlightCol={highlightCol} />
            </>
          ) : q.error ? (
            <div className="px-3 py-2 text-[14px] text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap">{q.error}</div>
          ) : q.columns && q.columns.length ? (
            <ResultTable columns={q.columns} rows={q.rows ?? []} total={q.total ?? 0} max={max} highlightCol={highlightCol} />
          ) : (
            <div className="px-3 py-2 text-[13px] text-gray-500">OK (no rows returned)</div>
          )}
        </div>
      )}
      {!showRes && (
        <button type="button" className="block w-full px-3 py-1.5 text-left text-[13px] text-gray-500 hover:underline" onClick={() => setShowRes(true)}>
          Show the result
        </button>
      )}
    </figure>
  );
};

/** A blank editor with the schema listed, for free experimentation. */
export const SqlPlayground: React.FC<{ start?: string }> = ({ start = "SELECT *\nFROM customers\nLIMIT 5;" }) => (
  <SqlBlock q={{ sql: start, columns: [], rows: [], total: 0 }} title="Playground: any query you like" hideResult />
);

/** A read-only, highlighted SQL listing (for statements the live editor can't run, like BEGIN/COMMIT). */
export const SqlCode: React.FC<{ sql: string; title?: string }> = ({ sql, title = "SQL (not runnable here)" }) => (
  <figure className="my-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-carddark overflow-hidden not-prose">
    <figcaption className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700 text-[13px] text-gray-500 dark:text-gray-400">{title}</figcaption>
    <pre className="sq-code m-0 overflow-x-auto bg-[#0f172a] text-gray-100 text-[14px] leading-relaxed p-3" style={{ fontFamily: MONO }}>
      <code dangerouslySetInnerHTML={{ __html: highlight(sql) }} />
    </pre>
  </figure>
);
