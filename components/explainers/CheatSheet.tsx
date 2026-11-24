import { highlight } from "@/components/sql/SqlBlock";

/**
 * One-page cheat sheet for an explainer post: a grid of cards (syntax, mini tables,
 * flows, rules of thumb, gotchas). The same markup is screenshotted into a PNG by
 * tools/cheatsheet/shoot.py, so it must look right at a fixed 1400px width too.
 */

export type SheetCard = {
  h: string;
  /** columns this card spans in the 3-column layout */
  span?: 1 | 2 | 3;
  tone?: "tip" | "warn";
  text?: string;
  code?: string;
  lang?: "sql" | "py" | "plain";
  /** two-column definition list: [term, meaning] */
  rows?: [string, string][];
  bullets?: string[];
  /** a small table: first row is the header */
  table?: (string | number | null)[][];
  /** a left-to-right flow of steps */
  flow?: string[];
  /** a formula or rule shown large */
  big?: string;
};

export type Sheet = {
  id: string;
  title: string;
  subtitle: string;
  series: string;
  cards: SheetCard[];
};

const MONO = "'JetBrains Mono','SFMono-Regular',Menlo,Consolas,monospace";

const Code: React.FC<{ code: string; lang?: SheetCard["lang"] }> = ({ code, lang = "sql" }) => (
  <pre className="sq-code cs-code" style={{ fontFamily: MONO }}>
    {lang === "sql" ? <code dangerouslySetInnerHTML={{ __html: highlight(code) }} /> : <code>{code}</code>}
  </pre>
);

const Card: React.FC<{ c: SheetCard }> = ({ c }) => (
  <section className={`cs-card cs-span-${c.span ?? 1} ${c.tone ? `cs-${c.tone}` : ""}`}>
    <h3 className="cs-h">{c.h}</h3>
    {c.big && <div className="cs-big" style={{ fontFamily: MONO }}>{c.big}</div>}
    {c.text && <p className="cs-text">{c.text}</p>}
    {c.flow && (
      <div className="cs-flow">
        {c.flow.map((f, i) => (
          <span key={i} className="cs-flow-item">
            <span className="cs-chip" style={{ fontFamily: MONO }}>{f}</span>
            {i < c.flow!.length - 1 && <span className="cs-arrow">→</span>}
          </span>
        ))}
      </div>
    )}
    {c.code && <Code code={c.code} lang={c.lang} />}
    {c.rows && (
      <dl className="cs-rows">
        {c.rows.map(([a, b], i) => (
          <div key={i} className="cs-row">
            <dt style={{ fontFamily: MONO }}>{a}</dt>
            <dd>{b}</dd>
          </div>
        ))}
      </dl>
    )}
    {c.table && (
      <table className="cs-table">
        <thead>
          <tr>
            {c.table[0].map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {c.table.slice(1).map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j} className={v === null ? "cs-null" : ""}>
                  {v === null ? "NULL" : v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )}
    {c.bullets && (
      <ul className="cs-bullets">
        {c.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    )}
  </section>
);

/** The full sheet. `standalone` drops the download bar (used for the PNG). */
export const CheatSheet: React.FC<{ sheet: Sheet; standalone?: boolean }> = ({ sheet, standalone }) => (
  <div id="cheat-sheet" className="cs-wrap not-prose relative left-1/2 -translate-x-1/2 w-[min(1150px,calc(100vw-2rem))]">
    {!standalone && (
      <div className="cs-bar">
        <span>Everything in this post on one page.</span>
        <a className="cs-dl" href={`/cheatsheets/${sheet.id}.png`} download={`${sheet.id}-cheatsheet.png`}>
          Download PNG
        </a>
      </div>
    )}
    <div className="cs-sheet" data-cheatsheet={sheet.id}>
      <header className="cs-head">
        <div>
          <div className="cs-series">{sheet.series}</div>
          <div className="cs-title">{sheet.title}</div>
          <div className="cs-sub">{sheet.subtitle}</div>
        </div>
        <div className="cs-site">arjunchidambaram.github.io</div>
      </header>
      <div className="cs-grid">
        {sheet.cards.map((c, i) => (
          <Card key={i} c={c} />
        ))}
      </div>
    </div>
  </div>
);

/** Small link under the post title that jumps to the sheet. */
export const CheatSheetLink: React.FC<{ id: string }> = ({ id }) => (
  <div className="my-3 flex flex-wrap gap-2 text-sm not-prose">
    <a href="#cheat-sheet" className="cs-pill">
      Cheat sheet
    </a>
    <a href={`/cheatsheets/${id}.png`} download={`${id}-cheatsheet.png`} className="cs-pill cs-pill-quiet">
      Download PNG
    </a>
  </div>
);
