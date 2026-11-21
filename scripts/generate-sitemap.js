// Writes out/sitemap.xml from the exported HTML files. Run after `next build`.
const fs = require("fs");
const path = require("path");

const SITE_URL = "https://arjunchidambaram.github.io";
const OUT = path.join(__dirname, "..", "out");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "_next" ? [] : walk(full);
    return e.name === "index.html" ? [full] : [];
  });
}

const urls = walk(OUT)
  .map((f) => "/" + path.relative(OUT, path.dirname(f)).split(path.sep).join("/"))
  .map((u) => (u === "/" ? "/" : `${u.replace(/^\/+/, "/")}/`))
  .filter((u) => !u.startsWith("/404"))
  .sort((a, b) => a.length - b.length || a.localeCompare(b));

const today = new Date().toISOString().slice(0, 10);
const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls
    .map(
      (u) =>
        `  <url><loc>${SITE_URL}${u}</loc><lastmod>${today}</lastmod><priority>${u === "/" ? "1.0" : u.startsWith("/blog/posts/") ? "0.7" : "0.5"}</priority></url>`
    )
    .join("\n") +
  "\n</urlset>\n";

fs.writeFileSync(path.join(OUT, "sitemap.xml"), xml);
console.log(`sitemap.xml: ${urls.length} URLs`);
