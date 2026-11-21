import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import Door from "@/components/Door";
import waveImg from "../public/character/wave.webp";
import walkingImg from "../public/character/walking.webp";
import celebratingImg from "../public/character/celebrating.webp";

/**
 * Landing-page character. A door appears, he walks out of it, turns and
 * waves. When the hero scrolls out of view he's gone (the floating mini
 * version takes over); scroll back and he comes out of the door again.
 */

type Pose = "wave" | "walking" | "celebrating";
const SRC: Record<Pose, string> = { wave: waveImg.src, walking: walkingImg.src, celebrating: celebratingImg.src };
const RATIO: Record<Pose, number> = { wave: 180 / 442, walking: 256 / 441, celebrating: 239 / 444 };

type Props = { delay?: number };

const HeroCharacter: React.FC<Props> = ({ delay = 1.3 }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const charRef = useRef<HTMLButtonElement>(null);
  const doorRef = useRef<HTMLDivElement>(null);
  const marksRef = useRef<SVGSVGElement>(null);
  const [pose, setPose] = useState<Pose>("walking");
  const [h, setH] = useState(420);
  const tl = useRef<gsap.core.Timeline>();
  const sway = useRef<gsap.core.Tween>();

  const W = h * 0.9; // stage width
  const doorW = h * 0.3;
  const doorH = h * 1.1;
  const doorLeft = W - doorW; // door on the right, so it opens away from the text
  const finalLeft = h * 0.14; // where his waving pose stands (left edge)

  useEffect(() => {
    const phone = window.matchMedia("(max-width: 640px)").matches;
    setH(phone ? 300 : 420);
  }, []);

  useEffect(() => {
    const ch = charRef.current;
    const door = doorRef.current;
    const box = boxRef.current;
    if (!ch || !door || !box) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const panel = door.querySelector(".door-panel");
    const glow = door.querySelector(".door-glow");
    const startSway = () => {
      const marks = marksRef.current;
      sway.current?.kill();
      sway.current = gsap.to(ch, { rotation: 2.5, duration: 1.4, yoyo: true, repeat: -1, ease: "sine.inOut", transformOrigin: "50% 100%" });
      if (marks) gsap.fromTo(marks, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, yoyo: true, repeat: -1, repeatDelay: 0.6, transformOrigin: "100% 100%" });
    };

    const enter = (wait: number) => {
      tl.current?.kill();
      sway.current?.kill();
      if (marksRef.current) gsap.killTweensOf(marksRef.current);
      gsap.set(ch, { rotation: 0, opacity: 0, x: doorLeft + doorW * 0.5 - h * RATIO.walking * 0.5 });
      gsap.set(door, { opacity: 0, scale: 0.7, transformOrigin: "50% 100%" });
      gsap.set(panel, { rotationY: 0 });
      gsap.set(glow, { opacity: 0 });
      setPose("walking");

      if (reduce) {
        setPose("wave");
        gsap.set(ch, { opacity: 1, x: finalLeft });
        return;
      }

      const t = gsap.timeline({ delay: wait });
      t.to(door, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" })
        .to(panel, { rotationY: 100, duration: 0.5, ease: "power2.out" })
        .to(glow, { opacity: 1, duration: 0.3 }, "<")
        // he steps out of the light and walks to his spot
        .to(ch, { opacity: 1, duration: 0.25 })
        .to(ch, { x: finalLeft, duration: 1.2, ease: "none" }, "<")
        .to(ch, { y: -6, duration: 0.2, yoyo: true, repeat: 5, ease: "sine.out" }, "<")
        .call(() => setPose("wave"))
        .fromTo(ch, { scale: 0.96 }, { scale: 1, duration: 0.3, ease: "back.out(3)", transformOrigin: "50% 100%" })
        // the door closes behind him and disappears
        .to(panel, { rotationY: 0, duration: 0.35, ease: "power2.in" }, "+=0.2")
        .to(glow, { opacity: 0, duration: 0.2 }, "<")
        .to(door, { opacity: 0, scale: 0.7, duration: 0.3, ease: "power2.in" })
        .call(startSway);
      tl.current = t;
    };

    const blob = box.querySelector(".hero-blob");
    const spin = reduce ? null : gsap.to(blob, { rotation: 360, duration: 40, repeat: -1, ease: "none" });

    enter(delay);

    // leave when the hero scrolls away; come back through the door on return
    let away = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio < 0.15 && !away) {
          away = true;
          tl.current?.kill();
          sway.current?.kill();
          gsap.set(ch, { opacity: 0 });
        } else if (e.intersectionRatio > 0.6 && away) {
          away = false;
          enter(0.3);
        }
      },
      { threshold: [0, 0.15, 0.6, 1] }
    );
    io.observe(box);
    return () => {
      io.disconnect();
      spin?.kill();
      tl.current?.kill();
      sway.current?.kill();
    };
  }, [h, W, doorW, doorLeft, finalLeft, delay]);

  const celebrate = () => {
    if (pose !== "wave") return;
    setPose("celebrating");
    gsap.fromTo(charRef.current, { y: 0 }, { y: -24, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" });
    setTimeout(() => setPose("wave"), 1400);
  };

  const charW = h * RATIO[pose];

  return (
    <div ref={boxRef} className="relative mx-auto" style={{ width: W, height: h + 10 }}>
      {/* soft blob behind his spot, like the character sheet */}
      <div
        aria-hidden="true"
        className="hero-blob absolute rounded-[42%_58%_55%_45%/48%_42%_58%_52%]"
        style={{
          width: h * 0.8,
          height: h * 0.8,
          left: finalLeft + (h * RATIO.wave) / 2 - h * 0.4,
          top: h * 0.12,
          backgroundColor: "rgba(0, 122, 122, 0.13)",
        }}
      />
      <Door ref={doorRef} width={doorW} height={doorH} hinge="right" className="absolute bottom-0 opacity-0" style={{ left: doorLeft }} />
      <button
        ref={charRef}
        type="button"
        onClick={celebrate}
        aria-label="Arjun waving hello"
        className="absolute bottom-0 left-0 opacity-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-marrsgreen"
        style={{ height: h, width: charW }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SRC[pose]}
          alt="Illustration of Arjun Chidambaram Subbiah"
          draggable={false}
          className="h-full w-full select-none"
          // the walking pose faces right; he walks left out of the door
          style={{ transform: pose === "walking" ? "scaleX(-1)" : undefined }}
        />
        {pose === "wave" && (
          <svg
            ref={marksRef}
            aria-hidden="true"
            viewBox="0 0 40 40"
            className="absolute"
            style={{ width: h * 0.12, height: h * 0.12, left: -h * 0.08, top: -h * 0.02 }}
          >
            <g stroke="#1C9A9A" strokeWidth="3.5" strokeLinecap="round">
              <line x1="22" y1="4" x2="25" y2="14" />
              <line x1="8" y1="12" x2="17" y2="19" />
              <line x1="4" y1="28" x2="14" y2="29" />
            </g>
          </svg>
        )}
        <span aria-hidden="true" className="absolute -bottom-1 left-1/2 -z-10 h-3 w-[120%] -translate-x-1/2 rounded-[50%] bg-black/15 blur-sm" />
      </button>
      {/* preload poses */}
      <div className="hidden" aria-hidden="true">
        {Object.values(SRC).map((s) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={s} src={s} alt="" />
        ))}
      </div>
    </div>
  );
};

export default HeroCharacter;
