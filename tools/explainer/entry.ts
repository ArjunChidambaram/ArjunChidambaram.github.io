import { draw, SIZE, DURATION } from "../../lib/explainers/linearRegression";
const c = document.getElementById("c") as HTMLCanvasElement;
c.width = SIZE; c.height = SIZE;
const ctx = c.getContext("2d")!;
(window as any).renderAt = (t: number) => draw(ctx, t);
(window as any).DURATION = DURATION;
