import { useEffect, useRef, useState } from "react";
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
 * A mini Arjun who walks around the edges of the screen once the hero is out
 * of view. He walks between spots, then strikes a pose that fits the section
 * you're reading (presenting your work, typing in the blog, pointing at the
 * contact form). Hover and he waves; click and he celebrates and takes you
 * back to the top.
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

  const sectionInfo = SECTION_POSE[currentSection ?? ""] ?? IDLE;
  const pose: Pose = override ?? (walking ? "walking" : sectionInfo.pose);
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
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const h = window.innerWidth < 640 ? HEIGHT_PHONE : HEIGHT_DESKTOP;
    setHeight(h);
    const boxW = h * 0.6; // widest pose, roughly

    const pickSpot = (allowSwitch = true) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 12;
      const rightMargin = vw >= 768 ? 72 : margin; // clear of the social icons
      if (allowSwitch && Math.random() < 0.2) sideRef.current = sideRef.current === "left" ? "right" : "left";
      const gutter = Math.max(boxW + margin * 2, (vw - 1100) / 2);
      const room = Math.max(0, gutter - boxW - margin * 2);
      const x =
        sideRef.current === "left"
          ? margin + Math.random() * room
          : vw - boxW - rightMargin - Math.random() * room;
      const top = 90;
      const bottom = vh - h - (vw < 768 ? 100 : 24);
      return { x, y: top + Math.random() * Math.max(0, bottom - top) };
    };

    const start = pickSpot(false);
    gsap.set(el, { x: start.x, y: start.y });
    if (reduce) return;

    let current = start;
    const wander = () => {
      if (pausedRef.current) {
        gsap.delayedCall(1, wander);
        return;
      }
      const next = pickSpot();
      const dist = Math.hypot(next.x - current.x, next.y - current.y);
      setFacingLeft(next.x < current.x);
      setWalking(true);
      driftRef.current = gsap.to(el, {
        x: next.x,
        y: next.y,
        duration: Math.max(1.5, dist / 90), // a steady walking pace
        ease: "none",
        onComplete: () => {
          current = next;
          setWalking(false);
          gsap.delayedCall(3 + Math.random() * 3, wander);
        },
      });
    };
    gsap.delayedCall(2, wander);

    const onResize = () => {
      const s = pickSpot(false);
      current = s;
      gsap.set(el, { x: s.x, y: s.y });
    };
    window.addEventListener("resize", onResize);
    return () => {
      driftRef.current?.kill();
      gsap.killTweensOf(wander);
      window.removeEventListener("resize", onResize);
    };
  }, []);

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
    driftRef.current?.pause();
    setWalking(false);
    setOverride("wave");
    clearTimeout(bubbleTimer.current);
    setBubble(sectionInfo.say === IDLE.say ? "Hi! Click me to go back up" : sectionInfo.say);
  };
  const unhover = () => {
    pausedRef.current = false;
    setOverride(null);
    if (driftRef.current?.progress() !== 1) {
      driftRef.current?.resume();
      if (driftRef.current?.isActive()) setWalking(true);
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
    <div
      ref={wrapRef}
      className={`fixed left-0 top-0 z-40 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
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
  );
};

export default FloatingBuddy;
