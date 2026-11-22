import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import waveImg from "../public/character/wave.webp";
import celebratingImg from "../public/character/celebrating.webp";

/**
 * Landing-page character: Arjun waving hello. He stays in one place; little
 * motion lines pulse by his hand, and clicking him switches to the
 * celebrating pose for a moment.
 */

type Pose = "wave" | "celebrating";
const SRC: Record<Pose, string> = { wave: waveImg.src, celebrating: celebratingImg.src };
const RATIO: Record<Pose, number> = { wave: 180 / 442, celebrating: 239 / 444 };

type Props = { delay?: number };

const HeroCharacter: React.FC<Props> = ({ delay = 1.3 }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const charRef = useRef<HTMLButtonElement>(null);
  const marksRef = useRef<SVGSVGElement>(null);
  const [pose, setPose] = useState<Pose>("wave");
  const [h, setH] = useState(420);
  const tl = useRef<gsap.core.Timeline>();
  const sway = useRef<gsap.core.Tween>();

  const W = h * 0.8; // stage width
  const finalLeft = (W - h * RATIO.wave) / 2; // centred

  useEffect(() => {
    const phone = window.matchMedia("(max-width: 640px)").matches;
    setH(phone ? 300 : 420);
  }, []);

  useEffect(() => {
    const ch = charRef.current;
    const box = boxRef.current;
    if (!ch || !box) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startSway = () => {
      const marks = marksRef.current;
      sway.current?.kill();
      if (marks) gsap.fromTo(marks, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, yoyo: true, repeat: -1, repeatDelay: 0.6, transformOrigin: "100% 100%" });
    };

    const enter = (wait: number) => {
      tl.current?.kill();
      sway.current?.kill();
      if (marksRef.current) gsap.killTweensOf(marksRef.current);
      setPose("wave");
      gsap.set(ch, { x: finalLeft, rotation: 0 });

      if (reduce) {
        gsap.set(ch, { opacity: 1, y: 0, scale: 1 });
        return;
      }

      // fades in where he stands
      tl.current = gsap
        .timeline({ delay: wait })
        .fromTo(ch, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.out" })
        .call(startSway);
    };



    enter(delay);

    // hide when the hero scrolls away; pop up again on return
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
      tl.current?.kill();
      sway.current?.kill();
    };
  }, [h, W, finalLeft, delay]);

  const celebrate = () => {
    if (pose !== "wave") return;
    setPose("celebrating");
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
