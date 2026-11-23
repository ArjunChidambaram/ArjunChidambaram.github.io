#!/bin/sh
# usage: ./build.sh logistic-math  -> logistic-math.html + logistic-math.js
set -e
cd "$(dirname "$0")"
npx esbuild "$1.ts" --bundle --format=iife --outfile="$1.js" --log-level=warning
cat > "$1.html" <<HTML
<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="katex.min.css">
<style>
@font-face{font-family:Jost;font-weight:400;src:url(jost/jost-latin-400-normal.woff2)}
@font-face{font-family:Jost;font-weight:500;src:url(jost/jost-latin-500-normal.woff2)}
@font-face{font-family:Jost;font-weight:600;src:url(jost/jost-latin-600-normal.woff2)}
html,body{margin:0;background:#000}</style></head>
<body><div id="stage"></div><script src="$1.js"></script></body></html>
HTML
