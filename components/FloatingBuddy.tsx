import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import Character from "@/components/Character";
import { useSection } from "context/section";

/**
 * A mini version of the character that drifts around the screen once the
 * hero is out of view. He keeps to the edges so he doesn't sit on top of the
 * text, comments on the section you're reading, and takes you back to the
 * top when clicked.
 */

const SIZE_DESKTOP = 84; // px wide
const SIZE_PHONE = 60;
const MESSAGES: Record<string, string> = {
  "who am i?": "That's my story 👋",
  projects: "Hover a card, it tilts!",
  blog: "I write about ML and LLMs",
  contact: "Say hi! I read every email ✉️",
};
const DEFAULT_MESSAGE = "Click me to float back up";

const FloatingBuddy: React.FC = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const [size, setSize] = useState(SIZE_DESKTOP);
  const [bubble, setBubble] = useState<string | null>(null);
  const { currentSection } = useSection();
  const bubbleTimer = useRef<ReturnType<typeof setTimeout>>();
  const driftRef = useRef<gsap.core.Tween>();
  const bobRef = useRef<gsap.core.Tween>();
  const pausedRef = useRef(false);

  // appear once the hero has scrolled away
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // wander between random spots along the edges of the screen
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SIZE = window.innerWidth < 640 ? SIZE_PHONE : SIZE_DESKTOP;
    setSize(SIZE);
    const h = (SIZE * 1374) / 1177;

    let side: "left" | "right" = "right";
    const pickSpot = (allowSwitch = true) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 16;
      // keep clear of the GitHub/LinkedIn rail on the right edge (desktop only)
      const rightMargin = vw >= 768 ? 72 : margin;
      const top = 90; // below the header
      const bottom = vh - h - (vw < 768 ? 110 : 30); // above the mobile nav bar
      // mostly drift along one side; now and then float across to the other
      if (allowSwitch && Math.random() < 0.2) side = side === "left" ? "right" : "left";
      const gutter = Math.max(SIZE + margin * 2, (vw - 1100) / 2);
      const x =
        side === "left"
          ? margin + Math.random() * Math.max(0, gutter - SIZE - margin * 2)
          : vw - SIZE - rightMargin - Math.random() * Math.max(0, gutter - SIZE - margin - rightMargin);
      const y = top + Math.random() * Math.max(0, bottom - top);
      return { x, y };
    };

    const start = pickSpot(false);
    gsap.set(el, { x: start.x, y: start.y });
    if (reduce) return;

    const wander = () => {
      if (pausedRef.current) {
        gsap.delayedCall(1, wander);
        return;
      }
      const next = pickSpot();
      driftRef.current = gsap.to(el, {
        x: next.x,
        y: next.y,
        duration: 5 + Math.random() * 4,
        ease: "sine.inOut",
        onComplete: () => {
          gsap.delayedCall(1 + Math.random() * 2, wander);
        },
      });
    };
    wander();

    // gentle bob and sway on the body, independent of the drift
    const bob = (bobRef.current = gsap.to(bodyRef.current, {
      y: -10,
      rotation: 3,
      duration: 1.6,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    }));

    const onResize = () => {
      const s = pickSpot(false);
      gsap.set(el, { x: s.x, y: s.y });
    };
    window.addEventListener("resize", onResize);
    return () => {
      driftRef.current?.kill();
      bob.kill();
      gsap.killTweensOf(wander);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // say something when you reach a new section
  useEffect(() => {
    if (!visible) return;
    const msg = MESSAGES[currentSection ?? ""];
    if (!msg) return;
    setBubble(msg);
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 2800);
  }, [currentSection, visible]);

  const hover = () => {
    // hold still so he's easy to click
    pausedRef.current = true;
    driftRef.current?.pause();
    bobRef.current?.pause();
    clearTimeout(bubbleTimer.current);
    setBubble(MESSAGES[currentSection ?? ""] ?? DEFAULT_MESSAGE);
    gsap.fromTo(bodyRef.current, { rotation: -10 }, { rotation: 10, duration: 0.12, repeat: 3, yoyo: true });
  };
  const unhover = () => {
    pausedRef.current = false;
    driftRef.current?.resume();
    bobRef.current?.resume();
    bubbleTimer.current = setTimeout(() => setBubble(null), 600);
  };
  const flyHome = () => {
    gsap.to(bodyRef.current, { y: -40, scale: 1.15, duration: 0.25, yoyo: true, repeat: 1 });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      ref={wrapRef}
      className={`fixed left-0 top-0 z-40 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ width: size }}
    >
      {bubble && (
        <span
          role="status"
          className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-bgdark dark:bg-bglight px-3 py-1 text-sm text-textlight dark:text-bgdark shadow-lg"
        >
          {bubble}
          <span className="absolute left-1/2 -bottom-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-bgdark dark:bg-bglight" />
        </span>
      )}
      <button
        ref={bodyRef}
        type="button"
        onClick={flyHome}
        onMouseEnter={hover}
        onMouseLeave={unhover}
        onFocus={hover}
        onBlur={unhover}
        aria-label="Back to top"
        title="Back to top"
        className="block cursor-pointer rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marrsgreen"
      >
        <Character width={size} />
        <span aria-hidden="true" className="mx-auto -mt-2 block h-2 w-12 rounded-[50%] bg-black/15 blur-sm" />
      </button>
    </div>
  );
};

export default FloatingBuddy;
