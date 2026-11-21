import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";

import arjunCharacter from "../public/arjun-character.webp";

/**
 * The meditating character, with eyes that wake up.
 *
 * While the pointer is still he meditates (the artwork's closed eyes show).
 * When the pointer moves, open eyes fade in over the closed lids, the pupils
 * follow the pointer, and he blinks now and then. After a few idle seconds
 * he closes his eyes again.
 *
 * Eye positions are in the artwork's own pixel space (1177 x 1374).
 */

const ART_W = 1177;
const ART_H = 1374;
const EYES = [
  { cx: 562, cy: 238 },
  { cx: 658, cy: 236 },
];
const SKIN = "#FFBC99";
const LINE = "#2C0E03";
const IDLE_MS = 3500;

type Props = {
  width: number;
  priority?: boolean;
  className?: string;
  alt?: string;
};

const Character: React.FC<Props> = ({ width, priority = false, className = "", alt }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const q = gsap.utils.selector(svg);
    const open = q(".eyes-open")[0];
    const irises = q(".iris");
    const lids = q(".eye-ball");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.set(open, { opacity: 0 });
    gsap.set(lids, { transformOrigin: "50% 50%" });

    let awake = false;
    let idleTimer: ReturnType<typeof setTimeout>;
    let blinkTimer: ReturnType<typeof setTimeout>;

    const blink = () => {
      gsap.to(lids, { scaleY: 0.1, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.in" });
    };
    const scheduleBlink = () => {
      clearTimeout(blinkTimer);
      blinkTimer = setTimeout(() => {
        if (awake) {
          blink();
          scheduleBlink();
        }
      }, 2200 + Math.random() * 2800);
    };

    const wake = () => {
      clearTimeout(idleTimer);
      if (!awake) {
        awake = true;
        gsap.to(open, { opacity: 1, duration: reduce ? 0 : 0.25 });
        if (!reduce) {
          // a little surprised double-blink on waking
          gsap.fromTo(lids, { scaleY: 0.1 }, { scaleY: 1, duration: 0.18, delay: 0.05 });
          scheduleBlink();
        }
      }
      idleTimer = setTimeout(sleep, IDLE_MS);
    };
    const sleep = () => {
      awake = false;
      clearTimeout(blinkTimer);
      gsap.to(lids, { scaleY: 0.1, duration: 0.25 });
      gsap.to(open, { opacity: 0, duration: 0.35, delay: 0.15, onComplete: () => { gsap.set(lids, { scaleY: 1 }); } });
    };

    const look = (clientX: number, clientY: number) => {
      const box = svg.getBoundingClientRect();
      if (!box.width) return;
      const scale = box.width / ART_W;
      EYES.forEach((eye, i) => {
        const ex = box.left + eye.cx * scale;
        const ey = box.top + eye.cy * scale;
        const dx = clientX - ex;
        const dy = clientY - ey;
        const dist = Math.hypot(dx, dy) || 1;
        // pupils travel further the further away the pointer is, up to the eye's edge
        const reach = Math.min(1, dist / 300);
        gsap.to(irises[i], {
          x: (dx / dist) * 9 * reach,
          y: (dy / dist) * 5 * reach,
          duration: reduce ? 0 : 0.25,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
    };

    const onMove = (e: PointerEvent) => {
      wake();
      look(e.clientX, e.clientY);
    };
    // touch screens have no hover: wake on scroll/tap and glance toward the middle of the screen
    const onScroll = () => {
      if (!window.matchMedia("(hover: none)").matches) return;
      wake();
      look(window.innerWidth / 2, window.innerHeight / 2);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("scroll", onScroll);
      clearTimeout(idleTimer);
      clearTimeout(blinkTimer);
    };
  }, []);

  return (
    <div className={`relative ${className}`} style={{ width, height: (width * ART_H) / ART_W }}>
      <Image
        src={arjunCharacter}
        width={width}
        height={Math.round((width * ART_H) / ART_W)}
        priority={priority}
        alt={alt ?? ""}
        aria-hidden={alt ? undefined : true}
        draggable={false}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${ART_W} ${ART_H}`}
        className="absolute inset-0 h-full w-full pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <filter id="skin-soft" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
          {EYES.map((eye, i) => (
            <clipPath key={i} id={`eye-clip-${i}`}>
              <ellipse cx={eye.cx} cy={eye.cy} rx={23} ry={13} />
            </clipPath>
          ))}
        </defs>
        <g className="eyes-open">
          {EYES.map((eye, i) => (
            <g key={i}>
              {/* skin patch hides the closed-lid line underneath */}
              <ellipse cx={eye.cx} cy={eye.cy + 3} rx={33} ry={17} fill={SKIN} filter="url(#skin-soft)" />
              <g className="eye-ball">
                <ellipse cx={eye.cx} cy={eye.cy} rx={23} ry={13} fill="#fff" />
                <g clipPath={`url(#eye-clip-${i})`}>
                  <g className="iris">
                    <circle cx={eye.cx} cy={eye.cy + 1} r={10} fill="#5B3421" />
                    <circle cx={eye.cx} cy={eye.cy + 1} r={5.5} fill="#170803" />
                    <circle cx={eye.cx + 3} cy={eye.cy - 2.5} r={2.6} fill="#fff" />
                  </g>
                </g>
                {/* upper lid, drawn heavier like the artwork's line work */}
                <path
                  d={`M${eye.cx - 25},${eye.cy + 1} Q${eye.cx},${eye.cy - 19} ${eye.cx + 25},${eye.cy + 1}`}
                  fill="none"
                  stroke={LINE}
                  strokeWidth={5}
                  strokeLinecap="round"
                />
                <path
                  d={`M${eye.cx - 18},${eye.cy + 10} Q${eye.cx},${eye.cy + 17} ${eye.cx + 18},${eye.cy + 10}`}
                  fill="none"
                  stroke={LINE}
                  strokeOpacity={0.45}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              </g>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default Character;
