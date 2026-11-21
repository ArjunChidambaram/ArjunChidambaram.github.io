# Rendering an explainer to video

Each explainer in `lib/explainers/` is a pure `draw(ctx, t)` function, so the
blog player and the video use the same code.

```bash
cd tools/explainer
npx esbuild entry.ts --bundle --format=iife --outfile=bundle.js
# put Jost .woff2 files next to frame.html (see the @font-face rules in it)
python3 render.py ~/Desktop/linear-regression.mp4   # needs playwright + ffmpeg
```

The output is 1080x1080 at 30 fps, ready for LinkedIn and Medium.
