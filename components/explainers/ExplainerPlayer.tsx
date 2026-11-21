import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  draw: (ctx: CanvasRenderingContext2D, t: number) => void;
  duration: number;
  size: number;
  label: string;
  /** frame to show when the reader prefers reduced motion */
  stillAt?: number;
};

/**
 * Plays a canvas animation that is a pure function of time.
 * Starts when scrolled into view; play/pause, scrub and replay.
 */
const ExplainerPlayer: React.FC<Props> = ({ draw, duration, size, label, stillAt }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const tRef = useRef(0);
  const raf = useRef<number>();
  const startedOnce = useRef(false);

  const paint = useCallback(
    (time: number) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) draw(ctx, time);
    },
    [draw]
  );

  // repaint when fonts arrive so the first frame isn't in a fallback font
  useEffect(() => {
    paint(tRef.current);
    document.fonts?.ready.then(() => paint(tRef.current));
  }, [paint]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const loop = (now: number) => {
      tRef.current = Math.min(duration, tRef.current + (now - last) / 1000);
      last = now;
      paint(tRef.current);
      setT(tRef.current);
      if (tRef.current >= duration) {
        setPlaying(false);
        return;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing, duration, paint]);

  // autoplay the first time it scrolls into view
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      tRef.current = stillAt ?? duration;
      setT(tRef.current);
      paint(tRef.current);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedOnce.current) {
          startedOnce.current = true;
          setPlaying(true);
        } else if (!entry.isIntersecting) {
          setPlaying(false);
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [duration, paint, stillAt]);

  const toggle = () => {
    if (!playing && tRef.current >= duration) tRef.current = 0;
    setPlaying((p) => !p);
  };
  const seek = (v: number) => {
    tRef.current = v;
    setT(v);
    paint(v);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const ended = t >= duration;

  return (
    <figure ref={wrapRef} className="not-prose my-8 mx-auto w-full max-w-[640px]">
      <div className="relative overflow-hidden rounded-lg shadow-md bg-[#F9FAFB]">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          onClick={toggle}
          className="block w-full h-auto cursor-pointer"
          role="img"
          aria-label={label}
        />
        {!playing && (
          <button
            type="button"
            onClick={toggle}
            aria-label={ended ? "Replay animation" : "Play animation"}
            className="absolute inset-0 m-auto h-16 w-16 rounded-full bg-marrsgreen/90 text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          >
            {ended ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={toggle}
          className="w-16 rounded border border-marrsgreen dark:border-carrigreen px-2 py-1 font-medium text-marrsgreen dark:text-carrigreen"
        >
          {playing ? "Pause" : ended ? "Replay" : "Play"}
        </button>
        <input
          type="range"
          min={0}
          max={duration}
          step={0.05}
          value={t}
          onChange={(e) => {
            setPlaying(false);
            seek(Number(e.target.value));
          }}
          aria-label="Scrub through the animation"
          className="flex-1 accent-[#007A7A]"
        />
        <span className="tabular-nums text-gray-600 dark:text-gray-300">
          {fmt(t)} / {fmt(duration)}
        </span>
      </div>
    </figure>
  );
};

export default ExplainerPlayer;
