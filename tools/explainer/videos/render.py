# usage: python3 render.py NAME OUT.mp4
import asyncio, subprocess, os, sys
from playwright.async_api import async_playwright
NAME, OUT = sys.argv[1], sys.argv[2]; FPS=30
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        pg=await b.new_page(viewport={"width":1920,"height":1080})
        await pg.goto(f"file:///home/claude/videos/{NAME}.html")
        w,h=await pg.evaluate("SIZE"); await pg.set_viewport_size({"width":w,"height":h})
        await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(500)
        n=int(await pg.evaluate("DURATION")*FPS)
        tmp=OUT.replace(".mp4",".partial.mp4")
        ff=subprocess.Popen(["ffmpeg","-y","-loglevel","error","-f","image2pipe","-framerate",str(FPS),"-c:v","mjpeg","-i","-",
            "-c:v","libx264","-crf","18","-preset","veryfast","-pix_fmt","yuv420p","-movflags","+faststart",tmp],stdin=subprocess.PIPE)
        for i in range(n):
            await pg.evaluate(f"setTime({i/FPS})")
            ff.stdin.write(await pg.screenshot(type="jpeg",quality=92))
        ff.stdin.close(); rc=ff.wait()
        if rc==0: os.replace(tmp,OUT)
        print(NAME,"frames",n,"rc",rc); await b.close()
asyncio.run(main())
