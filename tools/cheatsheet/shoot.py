"""Render every post's cheat sheet to public/cheatsheets/<id>.png.

Usage: serve the built site (python3 -m http.server 8765 -d out), then
    python3 tools/cheatsheet/shoot.py [http://localhost:8765] [id ...]
"""
import asyncio, pathlib, re, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
BASE = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].startswith("http") else "http://localhost:8765"
ONLY = [a for a in sys.argv[1:] if not a.startswith("http")]
OUT = ROOT / "public" / "cheatsheets"


def posts():
    for md in (ROOT / "contents").glob("*.md"):
        t = md.read_text()
        ex, slug = re.search(r'^explainer:\s*"([^"]+)"', t, re.M), re.search(r'^slug:\s*"([^"]+)"', t, re.M)
        if ex and slug and (not ONLY or ex.group(1) in ONLY):
            yield ex.group(1), slug.group(1)


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        ctx = await b.new_context(viewport={"width": 1500, "height": 1000}, device_scale_factor=2, color_scheme="light")
        pg = await ctx.new_page()
        for ex, slug in sorted(posts()):
            await pg.goto(f"{BASE}/blog/posts/{slug}/", wait_until="networkidle")
            el = await pg.query_selector(f'[data-cheatsheet="{ex}"]')
            if not el:
                continue
            await pg.evaluate("""(id) => {
                document.documentElement.classList.remove('dark');
                const el = document.querySelector(`[data-cheatsheet="${id}"]`);
                el.style.width = '1400px'; el.style.maxWidth = 'none';
                el.style.position = 'relative'; el.style.zIndex = 50;
            }""", ex)
            await pg.wait_for_timeout(300)
            await el.screenshot(path=str(OUT / f"{ex}.png"))
            print("wrote", ex)
        await b.close()


asyncio.run(main())
