/**
 * Linear regression explainer.
 *
 * `draw(ctx, t)` paints the whole frame for time t (seconds) on a 1080 x 1080
 * canvas. It is a pure function of t, so the same code drives the video render
 * (frame by frame) and the playable version on the blog (requestAnimationFrame).
 */

export const SIZE = 1080;
export const DURATION = 46;

export const COLORS = {
  bg: "#F9FAFB",
  ink: "#0F172A",
  muted: "#64748B",
  grid: "#E2E8F0",
  teal: "#007A7A",
  green: "#05CE91",
  miss: "#E4572E",
};

const FONT = '"Jost", "Helvetica Neue", Arial, sans-serif';

// House size (sq ft) vs price ($k). Fixed so every render is identical.
export const POINTS: [number, number][] = [
  [850, 205], [1000, 228], [1100, 275], [1250, 248], [1350, 296], [1450, 310], [1550, 289],
  [1650, 342], [1800, 330], [1900, 372], [2050, 365], [2150, 410], [2300, 398], [2450, 446],
];

export const X_RANGE: [number, number] = [700, 2700];
export const Y_RANGE: [number, number] = [150, 500];
const PLOT = { left: 170, right: 990, top: 300, bottom: 840 };

export const px = (x: number) =>
  PLOT.left + ((x - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0])) * (PLOT.right - PLOT.left);
export const py = (y: number) =>
  PLOT.bottom - ((y - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0])) * (PLOT.bottom - PLOT.top);
export const fromPx = (X: number, Y: number): [number, number] => [
  X_RANGE[0] + ((X - PLOT.left) / (PLOT.right - PLOT.left)) * (X_RANGE[1] - X_RANGE[0]),
  Y_RANGE[0] + ((PLOT.bottom - Y) / (PLOT.bottom - PLOT.top)) * (Y_RANGE[1] - Y_RANGE[0]),
];
export const PLOT_BOX = PLOT;

export type Line = { b0: number; b1: number };

export function leastSquares(points: [number, number][]): Line {
  const n = points.length;
  const mx = points.reduce((s, p) => s + p[0], 0) / n;
  const my = points.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const [x, y] of points) {
    sxy += (x - mx) * (y - my);
    sxx += (x - mx) ** 2;
  }
  const b1 = sxx ? sxy / sxx : 0;
  return { b0: my - b1 * mx, b1 };
}

export const sse = (points: [number, number][], l: Line) =>
  points.reduce((s, [x, y]) => s + (y - (l.b0 + l.b1 * x)) ** 2, 0);

// Real gradient descent on standardized x, starting from a deliberately bad line.
const GD_STEPS = 110;
const GD_PATH: Line[] = (() => {
  const n = POINTS.length;
  const mx = POINTS.reduce((s, p) => s + p[0], 0) / n;
  const sx = Math.sqrt(POINTS.reduce((s, p) => s + (p[0] - mx) ** 2, 0) / n);
  let a = 260; // intercept at the mean x
  let b = -40; // slope per standard deviation: tilted the wrong way
  const path: Line[] = [];
  const lr = 0.028;
  for (let i = 0; i <= GD_STEPS; i++) {
    path.push({ b1: b / sx, b0: a - (b * mx) / sx });
    let ga = 0;
    let gb = 0;
    for (const [x, y] of POINTS) {
      const z = (x - mx) / sx;
      const err = a + b * z - y;
      ga += err;
      gb += err * z;
    }
    a -= (lr * 2 * ga) / n;
    b -= (lr * 2 * gb) / n;
  }
  return path;
})();
export const BEST = leastSquares(POINTS);
const START = GD_PATH[0];

// ---------- timing helpers ----------
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const prog = (t: number, start: number, end: number) => clamp((t - start) / (end - start));
const easeOut = (p: number) => 1 - (1 - p) ** 3;
const easeInOut = (p: number) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
const backOut = (p: number) => {
  const c = 1.9;
  return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2;
};
/** 0→1 fade in over [a, a+d], 1→0 fade out over [b-d, b] */
const window_ = (t: number, a: number, b: number, d = 0.4) =>
  Math.min(easeOut(prog(t, a, a + d)), 1 - easeOut(prog(t, b - d, b)));

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

function lineAt(t: number): Line {
  if (t < 18.5) return START;
  const p = prog(t, 18.5, 28);
  const f = p * GD_STEPS;
  const i = Math.min(GD_STEPS - 1, Math.floor(f));
  const k = f - i;
  const a = GD_PATH[i];
  const b = GD_PATH[Math.min(GD_STEPS, i + 1)];
  return { b0: lerp(a.b0, b.b0, k), b1: lerp(a.b1, b.b1, k) };
}

// ---------- captions ----------
const CAPTIONS: [number, number, string][] = [
  [4.8, 10, "Here's some data: house size vs. price."],
  [10.2, 13.2, "Start with any line. It misses every point."],
  [13.2, 16, "Each miss is called a residual."],
  [16, 18.6, "Square each miss, so big misses count more."],
  [18.6, 28.2, "Nudge the line to shrink the total. That's gradient descent."],
  [28.2, 34, "The best line has the smallest total squared error."],
  [34, 41, "Now use the line to predict a new house."],
];

// ---------- drawing ----------
function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  size: number,
  opts: { weight?: number; color?: string; align?: CanvasTextAlign; alpha?: number; italic?: boolean } = {}
) {
  ctx.save();
  ctx.globalAlpha *= opts.alpha ?? 1;
  ctx.font = `${opts.italic ? "italic " : ""}${opts.weight ?? 400} ${size}px ${FONT}`;
  ctx.fillStyle = opts.color ?? COLORS.ink;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(s, x, y);
  ctx.restore();
}

/** Draws "ŷ = β0 + β1x" with real subscripts (the font has no subscript digits). */
function equation(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  align: "left" | "center" = "left",
  alpha = 1
) {
  const parts: [string, boolean][] = [["ŷ = β", false], ["0", true], [" + β", false], ["1", true], ["x", false]];
  ctx.save();
  ctx.globalAlpha *= alpha;
  const font = (sub: boolean) => `italic 500 ${sub ? Math.round(size * 0.58) : size}px ${FONT}`;
  let width = 0;
  for (const [str, sub] of parts) {
    ctx.font = font(sub);
    width += ctx.measureText(str).width + (sub ? size * 0.04 : 0);
  }
  let cx = align === "center" ? x - width / 2 : x;
  ctx.fillStyle = COLORS.ink;
  ctx.textAlign = "left";
  for (const [str, sub] of parts) {
    ctx.font = font(sub);
    ctx.fillText(str, cx, sub ? y + size * 0.22 : y);
    cx += ctx.measureText(str).width + (sub ? size * 0.04 : 0);
  }
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawAxes(ctx: CanvasRenderingContext2D, p = 1, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 2;
  for (let y = 200; y <= 500; y += 100) {
    ctx.beginPath();
    ctx.moveTo(PLOT.left, py(y));
    ctx.lineTo(PLOT.left + (PLOT.right - PLOT.left) * p, py(y));
    ctx.stroke();
    text(ctx, `$${y}k`, PLOT.left - 16, py(y) + 8, 24, { color: COLORS.muted, align: "right", alpha: p });
  }
  for (let x = 1000; x <= 2500; x += 500) {
    text(ctx, x.toLocaleString("en-US"), px(x), PLOT.bottom + 40, 24, { color: COLORS.muted, align: "center", alpha: p });
  }
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PLOT.left, PLOT.bottom);
  ctx.lineTo(PLOT.left + (PLOT.right - PLOT.left) * p, PLOT.bottom);
  ctx.stroke();
  text(ctx, "House size (sq ft)", (PLOT.left + PLOT.right) / 2, PLOT.bottom + 82, 26, { color: COLORS.muted, align: "center", alpha: p });
  ctx.save();
  ctx.translate(58, (PLOT.top + PLOT.bottom) / 2);
  ctx.rotate(-Math.PI / 2);
  text(ctx, "Price", 0, 0, 26, { color: COLORS.muted, align: "center", alpha: p });
  ctx.restore();
  ctx.restore();
}

export function drawLine(ctx: CanvasRenderingContext2D, l: Line, color: string, width = 6, alpha = 1, reveal = 1) {
  const x0 = X_RANGE[0] + 50;
  const x1 = x0 + (X_RANGE[1] - 50 - x0) * reveal;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.rect(PLOT.left, PLOT.top - 40, PLOT.right - PLOT.left, PLOT.bottom - PLOT.top + 40);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(px(x0), py(l.b0 + l.b1 * x0));
  ctx.lineTo(px(x1), py(l.b0 + l.b1 * x1));
  ctx.stroke();
  ctx.restore();
}

export function drawResiduals(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  l: Line,
  segP: number,
  squareP: number,
  alpha = 1
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  points.forEach(([x, y], i) => {
    const X = px(x);
    const Y = py(y);
    const Yl = py(l.b0 + l.b1 * x);
    const stagger = clamp(segP * 1.6 - (i / points.length) * 0.6);
    if (squareP > 0) {
      const side = Math.abs(Yl - Y) * backOut(clamp(squareP * 1.4 - (i / points.length) * 0.4));
      const top = Math.min(Y, Yl);
      ctx.fillStyle = "rgba(228, 87, 46, 0.16)";
      ctx.strokeStyle = "rgba(228, 87, 46, 0.55)";
      ctx.lineWidth = 2;
      ctx.fillRect(X, Yl < Y ? Yl : top, side, Math.abs(Yl - Y) * (side ? 1 : 0));
      ctx.strokeRect(X, Yl < Y ? Yl : top, side, Math.abs(Yl - Y) * (side ? 1 : 0));
    }
    if (stagger > 0) {
      ctx.strokeStyle = COLORS.miss;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(X, Y);
      ctx.lineTo(X, lerp(Y, Yl, easeOut(stagger)));
      ctx.stroke();
    }
  });
  ctx.restore();
}

export function drawPoints(ctx: CanvasRenderingContext2D, points: [number, number][], t = 99, start = 0) {
  points.forEach(([x, y], i) => {
    const p = backOut(prog(t, start + i * 0.12, start + i * 0.12 + 0.45));
    if (p <= 0) return;
    ctx.save();
    ctx.fillStyle = COLORS.teal;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(px(x), py(y), 13 * p, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
}

function drawErrorMeter(ctx: CanvasRenderingContext2D, value: number, alpha: number) {
  if (alpha <= 0) return;
  const max = sse(POINTS, START);
  ctx.save();
  ctx.globalAlpha = alpha;
  const x = 640;
  const y = 236;
  text(ctx, "Total squared error", x, y, 24, { color: COLORS.muted });
  text(ctx, Math.round(value).toLocaleString("en-US"), x + 340, y, 30, { weight: 600, color: COLORS.miss, align: "right" });
  ctx.fillStyle = COLORS.grid;
  roundRect(ctx, x, y + 14, 340, 12, 6);
  ctx.fill();
  ctx.fillStyle = COLORS.miss;
  roundRect(ctx, x, y + 14, Math.max(12, 340 * Math.sqrt(value / max)), 12, 6);
  ctx.fill();
  ctx.restore();
}

function drawEquation(ctx: CanvasRenderingContext2D, l: Line, alpha: number, best: boolean) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const x = 100;
  const y = 236;
  equation(ctx, x, y - 8, 40);
  text(
    ctx,
    `price = ${Math.round(l.b0)} + ${l.b1.toFixed(3)} × size`,
    x,
    y + 30,
    24,
    { color: best ? COLORS.teal : COLORS.muted, weight: best ? 600 : 400 }
  );
  ctx.restore();
}

function drawPrediction(ctx: CanvasRenderingContext2D, t: number) {
  const p = prog(t, 34.6, 37.2);
  if (p <= 0) return;
  const fade = 1 - easeOut(prog(t, 40.6, 41.2));
  const x = 2600;
  const yhat = BEST.b0 + BEST.b1 * x;
  ctx.save();
  ctx.globalAlpha = fade;
  // marker on the x axis
  const m = backOut(prog(t, 34.6, 35.2));
  ctx.fillStyle = COLORS.green;
  ctx.beginPath();
  ctx.moveTo(px(x), PLOT.bottom - 2);
  ctx.lineTo(px(x) - 14 * m, PLOT.bottom + 22 * m);
  ctx.lineTo(px(x) + 14 * m, PLOT.bottom + 22 * m);
  ctx.closePath();
  ctx.fill();
  ctx.setLineDash([12, 10]);
  ctx.strokeStyle = COLORS.green;
  ctx.lineWidth = 4;
  const up = easeOut(prog(t, 35.2, 36.2));
  ctx.beginPath();
  ctx.moveTo(px(x), PLOT.bottom);
  ctx.lineTo(px(x), lerp(PLOT.bottom, py(yhat), up));
  ctx.stroke();
  const across = easeOut(prog(t, 36.2, 37.2));
  if (across > 0) {
    ctx.beginPath();
    ctx.moveTo(px(x), py(yhat));
    ctx.lineTo(lerp(px(x), PLOT.left, across), py(yhat));
    ctx.stroke();
  }
  ctx.setLineDash([]);
  const dot = backOut(prog(t, 36.1, 36.6));
  if (dot > 0) {
    ctx.fillStyle = COLORS.green;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(px(x), py(yhat), 16 * dot, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  const label = easeOut(prog(t, 37, 37.6));
  if (label > 0) {
    ctx.globalAlpha = fade * label;
    ctx.fillStyle = COLORS.ink;
    roundRect(ctx, px(x) - 330, py(yhat) - 112, 300, 76, 14);
    ctx.fill();
    text(ctx, "2,600 sq ft →", px(x) - 312, py(yhat) - 82, 24, { color: "#CBD5E1" });
    text(ctx, `≈ $${Math.round(yhat)}k`, px(x) - 312, py(yhat) - 48, 32, { color: "#fff", weight: 600 });
  }
  ctx.restore();
}

function drawEndCard(ctx: CanvasRenderingContext2D, t: number) {
  const p = easeOut(prog(t, 41, 42));
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha = p;
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const rise = (1 - p) * 30;
  text(ctx, "Linear regression in one line", SIZE / 2, 330 + rise, 34, { color: COLORS.muted, align: "center" });
  equation(ctx, SIZE / 2, 450 + rise, 96, "center");
  text(ctx, "Pick the line with the smallest", SIZE / 2, 560 + rise, 36, { align: "center" });
  text(ctx, "total squared error.", SIZE / 2, 608 + rise, 36, { align: "center" });
  ctx.fillStyle = COLORS.teal;
  ctx.fillRect(SIZE / 2 - 60, 680, 120, 5);
  const q = easeOut(prog(t, 42.2, 43));
  ctx.globalAlpha = q;
  text(ctx, "Arjun Chidambaram Subbiah", SIZE / 2, 790, 38, { weight: 600, align: "center" });
  text(ctx, "Data science, one concept at a time", SIZE / 2, 842, 28, { color: COLORS.teal, align: "center" });
  text(ctx, "arjunchidambaram.github.io", SIZE / 2, 960, 26, { color: COLORS.muted, align: "center" });
  ctx.restore();
}

export function draw(ctx: CanvasRenderingContext2D, t: number) {
  ctx.save();
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // header: title card first, then a small series label
  const titleP = easeOut(prog(t, 0.2, 1.2));
  const titleOut = easeInOut(prog(t, 3.8, 4.8));
  const big = lerp(1, 0, titleOut);
  if (big > 0.01) {
    ctx.save();
    ctx.globalAlpha = titleP * big;
    text(ctx, "Data science, one concept at a time", SIZE / 2, 420 - 20 * titleOut, 30, { color: COLORS.teal, align: "center", weight: 500 });
    text(ctx, "Linear Regression", SIZE / 2, 530 - 40 * titleOut + (1 - titleP) * 30, 104, { weight: 600, align: "center" });
    text(ctx, "Drawing the best straight line through data", SIZE / 2, 610 - 40 * titleOut, 36, { color: COLORS.muted, align: "center" });
    ctx.restore();
  }
  const head = easeOut(prog(t, 4.3, 5));
  if (head > 0) {
    text(ctx, "Linear Regression", 100, 118, 56, { weight: 600, alpha: head });
    ctx.save();
    ctx.globalAlpha = head;
    ctx.fillStyle = COLORS.teal;
    ctx.fillRect(100, 140, 90 * head, 6);
    ctx.restore();
  }

  // plot
  const axesP = easeOut(prog(t, 4.6, 5.6));
  if (axesP > 0) drawAxes(ctx, axesP);

  const l = lineAt(t);
  const lineIn = easeOut(prog(t, 10.2, 11));
  const isBest = t >= 28;
  const settle = easeOut(prog(t, 28, 29));
  const resAlpha = 1 - easeOut(prog(t, 33.6, 34.4));
  if (lineIn > 0) {
    drawResiduals(ctx, POINTS, l, prog(t, 11.2, 12.8), prog(t, 16, 17.6), resAlpha);
    drawLine(ctx, l, isBest ? COLORS.green : COLORS.ink, 6 + 3 * settle * (1 - prog(t, 30, 31)), 1, lineIn);
  }
  drawPoints(ctx, POINTS, t, 5.4);

  // top-right meter and top-left equation
  drawErrorMeter(ctx, sse(POINTS, l), window_(t, 16.4, 34.2, 0.6));
  drawEquation(ctx, l, window_(t, 18.4, 41, 0.6), isBest);

  drawPrediction(ctx, t);

  // caption bar
  for (const [a, b, s] of CAPTIONS) {
    const w = window_(t, a, b, 0.35);
    if (w > 0) text(ctx, s, SIZE / 2, 1000 + (1 - w) * 10, 34, { align: "center", alpha: w, weight: 500 });
  }

  drawEndCard(ctx, t);
  ctx.restore();
}
