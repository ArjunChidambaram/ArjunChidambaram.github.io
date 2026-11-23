import { useEffect, useRef, useState } from "react";

/**
 * Shared building blocks for the explainer articles: tabbed videos, the
 * scrolling story with a sticky chart, headings, paragraphs and sliders.
 */

export const fmt = (n: number, d = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export type VideoSpec = { key: string; label: string; len: string; src: string; poster: string; square?: boolean };

export const Videos: React.FC<{ videos: VideoSpec[]; note?: string }> = ({ videos, note }) => {
  const [tab, setTab] = useState(videos[0].key);
  const cur = videos.find((v) => v.key === tab) ?? videos[0];
  return (
    <section aria-labelledby="watch" className="mt-6">
      <h2 id="watch" className="sr-only">
        Watch first
      </h2>
      <div role="tablist" aria-label="Videos" className="flex gap-2 mb-3">
        {videos.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
              tab === t.key
                ? "bg-marrsgreen text-white border-marrsgreen dark:bg-carrigreen dark:text-bgdark dark:border-carrigreen"
                : "border-gray-300 dark:border-gray-600 hover:border-marrsgreen"
            }`}
          >
            {t.label} <span className="opacity-70">{t.len}</span>
          </button>
        ))}
      </div>
      <div className="rounded-lg overflow-hidden shadow-md bg-black">
        <video
          key={cur.key}
          controls
          playsInline
          preload="metadata"
          poster={cur.poster}
          className={cur.square ? "mx-auto block w-full max-w-[560px] aspect-square" : "block w-full aspect-video"}
        >
          <source src={cur.src} type="video/mp4" />
        </video>
      </div>
      {note && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{note}</p>}
    </section>
  );
};

export type Step = { key: string; body: React.ReactNode };

/** Text steps scroll past a chart that stays put; the chart redraws for the active step. */
export const Scrolly: React.FC<{ steps: Step[]; chart: (active: number) => React.ReactNode }> = ({ steps, chart }) => {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        }),
      { rootMargin: "-45% 0px -45% 0px" }
    );
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);
  return (
    <div className="relative grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-x-10">
      <div className="md:order-2 sticky top-14 md:top-24 z-10 h-fit self-start bg-bglight dark:bg-bgdark py-2 md:py-0 shadow-[0_8px_12px_-12px_rgba(0,0,0,0.25)] md:shadow-none">
        {chart(active)}
      </div>
      <div className="md:order-1 relative">
        {steps.map((s, i) => (
          <div
            key={s.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-step={i}
            className="min-h-[55vh] md:min-h-[80vh] flex items-center first:pt-4 last:pb-[20vh]"
          >
            <div
              className={`rounded-lg border p-5 text-[17px] leading-relaxed transition-all duration-300 ${
                active === i
                  ? "border-marrsgreen/50 dark:border-carrigreen/50 bg-white dark:bg-carddark shadow-md opacity-100"
                  : "border-transparent opacity-40"
              }`}
            >
              {s.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const H2: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <h2 id={id} className="mt-16 mb-4 text-2xl md:text-3xl font-semibold scroll-mt-24">
    {children}
  </h2>
);

export const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="my-4 text-[17px] leading-relaxed text-gray-800 dark:text-gray-200">{children}</p>
);

export const UL: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul className="my-4 list-disc pl-6 space-y-2 text-[17px] leading-relaxed">{children}</ul>
);

export const Slider: React.FC<{
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  color: string;
  digits?: number;
}> = ({ label, value, min, max, step, onChange, color, digits }) => (
  <label className="block mt-3">
    <span className="flex justify-between text-[15px]">
      {label}
      <span className="tabular-nums" style={{ color }}>
        {value.toFixed(digits ?? (step < 0.01 ? 4 : step < 0.1 ? 2 : 1))}
      </span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full"
      style={{ accentColor: color }}
    />
  </label>
);

export const Code: React.FC<{ children: string }> = ({ children }) => (
  <pre className="my-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-[14px] leading-relaxed text-gray-100">
    <code>{children}</code>
  </pre>
);

export const Button: React.FC<{ onClick: () => void; children: React.ReactNode; primary?: boolean }> = ({ onClick, children, primary }) => (
  <button
    type="button"
    onClick={onClick}
    className={
      primary
        ? "rounded bg-marrsgreen dark:bg-carrigreen px-3 py-1.5 text-sm font-medium text-white dark:text-bgdark"
        : "rounded border border-marrsgreen dark:border-carrigreen px-3 py-1.5 text-sm font-medium text-marrsgreen dark:text-carrigreen"
    }
  >
    {children}
  </button>
);

/** The wide container every article uses, breaking out of the narrow post column. */
export const Wide: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="not-prose relative left-1/2 -translate-x-1/2 w-[min(1150px,calc(100vw-2rem))] text-gray-900 dark:text-gray-100">
    {children}
  </div>
);
export const Narrow: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="mx-auto max-w-3xl">{children}</div>;

/** Animates a set of numbers toward targets (for smooth chart transitions). */
export function useTween<T extends Record<string, number>>(target: T, ms = 650): T {
  const [cur, setCur] = useState<T>(target);
  const from = useRef<T>(target);
  const key = Object.values(target).join(",");
  useEffect(() => {
    const start = from.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || ms === 0) {
      setCur(target);
      from.current = target;
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
      const v = {} as T;
      for (const k of Object.keys(target)) (v as Record<string, number>)[k] = start[k] + (target[k] - start[k]) * e;
      setCur(v);
      from.current = v;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key, ms]); // eslint-disable-line react-hooks/exhaustive-deps
  return cur;
}
