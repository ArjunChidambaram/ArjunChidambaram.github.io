# usage: python3 frames.py NAME t1 t2 ...   -> /tmp/NAME_<t>.png ; prints errors
import asyncio, sys
from playwright.async_api import async_playwright
async def main(name, ts):
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        pg=await b.new_page(viewport={"width":1920,"height":1080})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:300]))
        await pg.goto(f"file:///home/claude/videos/{name}.html")
        w,h=await pg.evaluate("SIZE"); await pg.set_viewport_size({"width":w,"height":h})
        await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(400)
        for t in ts:
            await pg.evaluate(f"setTime({t})"); await pg.screenshot(path=f"/tmp/{name}_{t}.png")
        print(errs); await b.close()
asyncio.run(main(sys.argv[1],[float(x) for x in sys.argv[2:]]))
