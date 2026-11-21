import { useEffect, useRef, useState } from "react";
import Door from "@/components/Door";
import gsap from "gsap";

import { useSection } from "context/section";
import neutralImg from "../public/character/neutral.webp";
import waveImg from "../public/character/wave.webp";
import thinkingImg from "../public/character/thinking.webp";
import typingImg from "../public/character/typing.webp";
import pointingImg from "../public/character/pointing.webp";
import presentingImg from "../public/character/presenting.webp";
import celebratingImg from "../public/character/celebrating.webp";
import walkingImg from "../public/character/walking.webp";
import confidentImg from "../public/character/confident.webp";

const SRC = {
  neutral: neutralImg.src,
  wave: waveImg.src,
  thinking: thinkingImg.src,
  typing: typingImg.src,
  pointing: pointingImg.src,
  presenting: presentingImg.src,
  celebrating: celebratingImg.src,
  walking: walkingImg.src,
  confident: confidentImg.src,
};

/**
 * A mini Arjun who lives at the edges of the screen once the hero is out of
 * view. He arrives through a door, strikes a pose that fits the section you're
 * reading, and takes short strolls. To get somewhere new (another section, the
 * other side of the screen) he walks into a door and comes out of another one
 * where he needs to be. Hover and he waves; click and he celebrates and takes
 * you back to the top.
 */

type Pose =
  | "neutral"
  | "wave"
  | "thinking"
  | "typing"
  | "pointing"
  | "presenting"
  | "celebrating"
  | "walking"
  | "confident";

// natural width/height of each cut-out, so every pose renders at the same scale
const POSES: Record<Pose, [number, number]> = {
  neutral: [151, 441],
  wave: [180, 442],
  thinking: [133, 440],
  typing: [212, 444],
  pointing: [281, 445],
  presenting: [252, 444],
  celebrating: [239, 444],
  walking: [256, 441],
  confident: [150, 447],
};
// poses drawn facing right; flipped when he's on the right edge so he faces the page
const FACES_RIGHT: Pose[] = ["pointing", "presenting", "walking", "typing"];

const SECTION_POSE: Record<string, { pose: Pose; say: string }> = {
  "who am i?": { pose: "confident", say: "That's my story" },
  projects: { pose: "presenting", say: "Hover a card, it tilts!" },
  blog: { pose: "typing", say: "I write about ML and LLMs" },
  contact: { pose: "pointing", say: "Say hi! I read every email" },
};
const IDLE = { pose: "thinking" as Pose, say: "Click me to go back up" };

const HEIGHT_DESKTOP = 150;
const HEIGHT_PHONE = 104;

const FloatingBuddy: React.FC = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const [height, setHeight] = useState(HEIGHT_DESKTOP);
  const [walking, setWalking] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [override, setOverride] = useState<Pose | null>(null);
  const [bubble, setBubble] = useState<string | null>(null);
  const { currentSection } = useSection();
  const bubbleTimer = useRef<ReturnType<typeof setTimeout>>();
  const driftRef = useRef<gsap.core.Tween>();
  const pausedRef = useRef(false);
  const sideRef = useRef<"left" | "right">("right");
  const doorRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const spotRef = useRef<{ x: number; y: number } | null>(null);
  const presentRef = useRef(false);
  const api = useRef<{ arrive: () => void; leave: () => void; relocate: () => void }>();
  const [present, setPresent] = useState(false);
  const [hinge, setHinge] = useState<"left" | "right">("right");

  const sectionInfo = SECTION_POSE[currentSection ?? ""] ?? IDLE;
  const pose: Pose = override ?? (walking ? "walking" : sectionInfo.pose);
  const doorW = height * 0.42;
  const doorH = height * 1.12;
  const [natW, natH] = POSES[pose];
  const width = (natW / natH) * height;
  // standing still on the right edge, turn toward the page
  const flip = walking ? facingLeft : FACES_RIGHT.includes(pose) && sideRef.current === "right";

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    const door = doorRef.current;
    if (!el || !door) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const h = window.innerWidth < 640 ? HEIGHT_PHONE : HEIGHT_DESKTOP;
    setHeight(h);
    const cw = h * 0.6; // widest pose, roughly
    const dw = h * 0.42;
    const dh = h * 1.12;
    const panel = door.querySelector(".door-panel");
    const glow = door.querySelector(".door-glow");
    const PACE = 110; // px per second

    const pickSpot = (side: "left" | "right") => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 12;
      const rightMargin = vw >= 768 ? 72 : margin; // clear of the social icons
      // leave room for the door on the outer side
      const minX = side === "left" ? margin + dw + 8 : 0;
      const maxRight = vw - cw - rightMargin - dw - 8;
      const gutter = Math.max(cw + dw + margin * 2, (vw - 1100) / 2);
      const room = Math.max(0, gutter - cw - dw - margin * 2);
      const x = side === "left" ? minX + Math.random() * room : maxRight - Math.random() * room;
      const top = 90;
      const bottom = vh - h - (vw < 768 ? 100 : 24);
      return { x, y: top + Math.random() * Math.max(0, bottom - top) };
    };

    // the door always sits on the outer side, so he walks in toward the page
    const doorFor = (spot: { x: number; y: number }, side: "left" | "right") => ({
      x: side === "left" ? spot.x - dw - 8 : spot.x + cw + 8,
      y: spot.y + h - dh,
    });
    const openTo = (side: "left" | "right") => (side === "left" ? -100 : 100);

    const showDoor = (t: gsap.core.Timeline, pos: { x: number; y: number }, side: "left" | "right") => {
      t.call(() => setHinge(side))
        .set(door, { x: pos.x, y: pos.y, opacity: 0, scale: 0.7, transformOrigin: "50% 100%" })
        .set(panel, { rotationY: 0, transformOrigin: side === "left" ? "0% 50%" : "100% 50%" })
        .to(door, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" })
        .to(panel, { rotationY: openTo(side), duration: 0.4, ease: "power2.out" })
        .to(glow, { opacity: 1, duration: 0.25 }, "<");
    };
    const hideDoor = (t: gsap.core.Timeline) => {
      t.to(panel, { rotationY: 0, duration: 0.3, ease: "power2.in" })
        .to(glow, { opacity: 0, duration: 0.2 }, "<")
        .to(door, { opacity: 0, scale: 0.7, duration: 0.25, ease: "power2.in" });
    };

    const arriveTl = (t: gsap.core.Timeline, side: "left" | "right") => {
      const spot = pickSpot(side);
      const d = doorFor(spot, side);
      const startX = d.x + dw / 2 - cw / 2;
      t.set(el, { x: startX, y: spot.y, opacity: 0 });
      showDoor(t, d, side);
      t.call(() => {
        setFacingLeft(side === "right");
        setWalking(true);
      })
        .to(el, { opacity: 1, duration: 0.25 })
        .to(el, { x: spot.x, duration: Math.max(0.6, Math.abs(spot.x - startX) / PACE), ease: "none" }, "<")
        .call(() => setWalking(false));
      hideDoor(t);
      t.call(() => {
        spotRef.current = spot;
      });
    };

    const leaveTl = (t: gsap.core.Timeline) => {
      const spot = spotRef.current;
      if (!spot) return;
      const side = sideRef.current;
      const d = doorFor(spot, side);
      showDoor(t, d, side);
      const into = d.x + dw / 2 - cw / 2;
      t.call(() => {
        setFacingLeft(side === "left");
        setWalking(true);
      })
        .to(el, { x: into, duration: Math.max(0.6, Math.abs(into - spot.x) / PACE), ease: "none" })
        .to(el, { opacity: 0, duration: 0.25 }, "-=0.25")
        .call(() => setWalking(false));
      hideDoor(t);
      t.call(() => {
        spotRef.current = null;
      });
    };

    const run = (build: (t: gsap.core.Timeline) => void) => {
      busyRef.current = true;
      driftRef.current?.kill();
      const t = gsap.timeline({
        onComplete: () => {
          busyRef.current = false;
        },
      });
      build(t);
      return t;
    };

    const arrive = () => {
      presentRef.current = true;
      setPresent(true);
      if (reduce) {
        const s = pickSpot(sideRef.current);
        spotRef.current = s;
        gsap.set(el, { x: s.x, y: s.y, opacity: 1 });
        return;
      }
      run((t) => arriveTl(t, sideRef.current));
    };
    const leave = () => {
      presentRef.current = false;
      if (reduce || !spotRef.current) {
        gsap.set(el, { opacity: 0 });
        spotRef.current = null;
        setPresent(false);
        return;
      }
      run((t) => {
        leaveTl(t);
        t.call(() => setPresent(false));
      });
    };
    // through one door, out of another (sometimes on the other side of the screen)
    const relocate = () => {
      if (busyRef.current || !spotRef.current || reduce) return;
      run((t) => {
        leaveTl(t);
        t.call(() => {
          if (Math.random() < 0.5) sideRef.current = sideRef.current === "left" ? "right" : "left";
        });
        t.add(() => {
          const t2 = gsap.timeline({
            onComplete: () => {
              busyRef.current = false;
            },
          });
          arriveTl(t2, sideRef.current);
          driftRef.current = t2 as unknown as gsap.core.Tween;
        });
      });
    };
    api.current = { arrive, leave, relocate };

    // short strolls on the same side between door trips
    const stroll = () => {
      if (!busyRef.current && !pausedRef.current && spotRef.current && !reduce) {
        const from = spotRef.current;
        const to = pickSpot(sideRef.current);
        setFacingLeft(to.x < from.x);
        setWalking(true);
        driftRef.current = gsap.to(el, {
          x: to.x,
          y: to.y,
          duration: Math.max(1, Math.hypot(to.x - from.x, to.y - from.y) / PACE),
          ease: "none",
          onComplete: () => {
            spotRef.current = to;
            setWalking(false);
          },
        });
      }
      strollTimer = setTimeout(stroll, 7000 + Math.random() * 4000);
    };
    let strollTimer = setTimeout(stroll, 8000);

    const onResize = () => {
      if (!spotRef.current) return;
      const s = pickSpot(sideRef.current);
      spotRef.current = s;
      gsap.set(el, { x: s.x, y: s.y });
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(strollTimer);
      driftRef.current?.kill();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // come and go with the hero
  useEffect(() => {
    if (visible && !presentRef.current) api.current?.arrive();
    if (!visible && presentRef.current) api.current?.leave();
  }, [visible]);

  // new section: take a door to a new spot
  const firstSection = useRef(true);
  useEffect(() => {
    if (firstSection.current) {
      firstSection.current = false;
      return;
    }
    if (presentRef.current && !pausedRef.current) api.current?.relocate();
  }, [currentSection]);

  // step bounce while walking, slow breathing while standing
  useEffect(() => {
    const body = bodyRef.current;
    if (!body || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.killTweensOf(body, "y,scaleY");
    gsap.set(body, { y: 0, scaleY: 1 });
    const t = walking
      ? gsap.to(body, { y: -6, duration: 0.22, yoyo: true, repeat: -1, ease: "sine.out" })
      : gsap.to(body, { scaleY: 1.015, duration: 1.8, yoyo: true, repeat: -1, ease: "sine.inOut", transformOrigin: "50% 100%" });
    return () => {
      t.kill();
    };
  }, [walking]);

  const say = (msg: string, ms = 2800) => {
    setBubble(msg);
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), ms);
  };

  useEffect(() => {
    if (visible && SECTION_POSE[currentSection ?? ""]) say(SECTION_POSE[currentSection ?? ""].say);
  }, [currentSection, visible]);

  const hover = () => {
    pausedRef.current = true;
    if (!busyRef.current) {
      driftRef.current?.pause();
      setWalking(false);
    }
    setOverride("wave");
    clearTimeout(bubbleTimer.current);
    setBubble(sectionInfo.say === IDLE.say ? "Hi! Click me to go back up" : sectionInfo.say);
  };
  const unhover = () => {
    pausedRef.current = false;
    setOverride(null);
    if (!busyRef.current && driftRef.current && driftRef.current.progress() < 1) {
      driftRef.current.resume();
      setWalking(true);
    }
    bubbleTimer.current = setTimeout(() => setBubble(null), 600);
  };
  const celebrate = () => {
    setOverride("celebrating");
    say("Back to the top!", 1600);
    gsap.fromTo(bodyRef.current, { y: 0 }, { y: -30, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" });
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setOverride(null), 1600);
  };

  return (
    <>
    <Door ref={doorRef} width={doorW} height={doorH} hinge={hinge} className="fixed left-0 top-0 z-30 opacity-0" />
    <div
      ref={wrapRef}
      className={`fixed left-0 top-0 z-40 opacity-0 ${present ? "" : "pointer-events-none"}`}
      style={{ height }}
    >
      {bubble && (
        <span
          role="status"
          className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-bgdark dark:bg-bglight px-3 py-1 text-sm text-textlight dark:text-bgdark shadow-lg"
        >
          {bubble}
          <span className="absolute left-1/2 -bottom-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-bgdark dark:bg-bglight" />
        </span>
      )}
      <button
        ref={bodyRef}
        type="button"
        onClick={celebrate}
        onMouseEnter={hover}
        onMouseLeave={unhover}
        onFocus={hover}
        onBlur={unhover}
        aria-label="Back to top"
        title="Back to top"
        className="relative block cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marrsgreen"
        style={{ height, width }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SRC[pose]}
          alt=""
          draggable={false}
          className="h-full w-full select-none"
          style={{ transform: flip ? "scaleX(-1)" : undefined }}
        />
        <span aria-hidden="true" className="absolute -bottom-1 left-1/2 h-2 w-3/4 -translate-x-1/2 rounded-[50%] bg-black/15 blur-sm" />
      </button>
      {/* preload every pose so switching never flashes */}
      <div className="hidden" aria-hidden="true">
        {Object.keys(POSES).map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p} src={SRC[p as Pose]} alt="" />
        ))}
      </div>
    </div>
    </>
  );
};

export default FloatingBuddy;
