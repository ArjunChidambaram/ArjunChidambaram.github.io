import { useCallback, useEffect, useRef, useState } from "react";

import {
  COLORS,
  POINTS,
  PLOT_BOX,
  SIZE,
  drawAxes,
  drawLine,
  drawPoints,
  drawResiduals,
  fromPx,
  leastSquares,
  px,
  py,
  sse,
  X_RANGE,
  Y_RANGE,
} from "lib/explainers/linearRegression";

/**
 * Drag the points (or click to add one) and the least-squares line refits live.
 */
const LinearRegressionPlayground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<[number, number][]>(() => POINTS.map((p) => [...p] as [number, number]));
  const [showSquares, setShowSquares] = useState(true);
  const dragging = useRef<number | null>(null);

  const line = points.length >= 2 ? leastSquares(points) : null;

  const paint = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, SIZE, SIZE);
    drawAxes(ctx);
    if (line) {
      drawResiduals(ctx, points, line, 1, showSquares ? 1 : 0);
      drawLine(ctx, line, COLORS.green, 7);
    }
    drawPoints(ctx, points);
  }, [points, line, showSquares]);

  useEffect(() => {
    paint();
    document.fonts?.ready.then(paint);
  }, [paint]);

  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * SIZE, ((e.clientY - r.top) / r.height) * SIZE] as const;
  };
  const inPlot = (X: number, Y: number) =>
    X >= PLOT_BOX.left && X <= PLOT_BOX.right && Y >= PLOT_BOX.top && Y <= PLOT_BOX.bottom;
  const clampData = ([x, y]: [number, number]): [number, number] => [
    Math.min(X_RANGE[1] - 50, Math.max(X_RANGE[0] + 50, x)),
    Math.min(Y_RANGE[1] - 5, Math.max(Y_RANGE[0] + 5, y)),
  ];

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const [X, Y] = toCanvas(e);
    const hit = points.findIndex(([x, y]) => Math.hypot(px(x) - X, py(y) - Y) < 30);
    if (hit >= 0) {
      dragging.current = hit;
      e.currentTarget.setPointerCapture(e.pointerId);
    } else if (inPlot(X, Y) && points.length < 40) {
      setPoints([...points, clampData(fromPx(X, Y))]);
    }
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const [X, Y] = toCanvas(e);
    if (dragging.current === null) {
      const over = points.some(([x, y]) => Math.hypot(px(x) - X, py(y) - Y) < 30);
      e.currentTarget.style.cursor = over ? "grab" : inPlot(X, Y) ? "crosshair" : "default";
      return;
    }
    e.currentTarget.style.cursor = "grabbing";
    const i = dragging.current;
    setPoints((ps) => ps.map((p, j) => (j === i ? clampData(fromPx(X, Y)) : p)));
  };
  const onUp = () => {
    dragging.current = null;
  };

  return (
    <figure className="not-prose my-8 mx-auto w-full max-w-[640px]">
      <figcaption className="mb-3">
        <span className="block text-lg font-semibold">Try it yourself</span>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Drag a point, or click empty space to add one. The green line is always the least-squares fit.
        </span>
      </figcaption>
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="block w-full h-auto rounded-lg shadow-md touch-none select-none"
        role="img"
        aria-label="Interactive scatter plot with a least-squares line that refits as you move the points"
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {line && (
          <span className="tabular-nums">
            price = <strong>{Math.round(line.b0)}</strong> + <strong>{line.b1.toFixed(3)}</strong> × size
          </span>
        )}
        {line && (
          <span className="tabular-nums" style={{ color: COLORS.miss }}>
            Total squared error: <strong>{Math.round(sse(points, line)).toLocaleString("en-US")}</strong>
          </span>
        )}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showSquares} onChange={(e) => setShowSquares(e.target.checked)} className="accent-[#007A7A]" />
          Show squared errors
        </label>
        <button
          type="button"
          onClick={() => setPoints(POINTS.map((p) => [...p] as [number, number]))}
          className="rounded border border-marrsgreen dark:border-carrigreen px-3 py-1 font-medium text-marrsgreen dark:text-carrigreen"
        >
          Reset
        </button>
      </div>
    </figure>
  );
};

export default LinearRegressionPlayground;
