import asyncio, base64, subprocess, os, sys
from playwright.async_api import async_playwright
OUT=sys.argv[1]; FPS=30
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        pg=await b.new_page(viewport={"width":1080,"height":1080})
        await pg.goto("file:///home/claude/explainer/frame.html")
        await pg.evaluate("Promise.all(['400','500','600','italic 400','italic 500'].map(w=>document.fonts.load(w+' 40px Jost')))")
        dur=await pg.evaluate("DURATION"); n=int(dur*FPS)
        tmp=OUT.replace(".mp4",".partial.mp4")
        ff=subprocess.Popen(["ffmpeg","-y","-loglevel","error","-f","image2pipe","-framerate",str(FPS),"-c:v","mjpeg","-i","-",
            "-c:v","libx264","-crf","18","-preset","veryfast","-pix_fmt","yuv420p","-movflags","+faststart",tmp],stdin=subprocess.PIPE)
        for i in range(n):
            d=await pg.evaluate(f"(renderAt({i/FPS}), document.getElementById('c').toDataURL('image/jpeg',0.92))")
            ff.stdin.write(base64.b64decode(d.split(",",1)[1]))
        ff.stdin.close(); rc=ff.wait()
        if rc==0: os.replace(tmp,OUT)
        print("frames",n,"rc",rc)
        await b.close()
asyncio.run(main())
