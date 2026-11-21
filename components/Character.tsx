import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";

import portrait from "../public/character/portrait.webp";

/**
 * Portrait of Arjun whose eyes follow the pointer.
 *
 * The image has blank eye-whites; the irises are drawn here, clipped to each
 * eye opening so the lids cover them naturally. He blinks every few seconds
 * and his head tilts a little toward the pointer.
 *
 * Coordinates are in the portrait's pixel space (951 x 1242).
 */

const W = 951;
const H = 1242;
type Eye = { l: number[]; r: number[]; cu: number[]; cl: number[]; c: number[]; ir: number };
const EYES: Eye[] = [
  { l: [390, 377], r: [484, 363], cu: [435, 326], cl: [433, 384], c: [434, 361], ir: 20 },
  { l: [558, 354], r: [634, 340], cu: [596, 299], cl: [598, 351], c: [587, 337], ir: 19 },
];
const LID = "#F2A863";

const openingPath = (e: Eye) =>
  `M${e.l[0]},${e.l[1]} Q${e.cu[0]},${e.cu[1]} ${e.r[0]},${e.r[1]} Q${e.cl[0]},${e.cl[1]} ${e.l[0]},${e.l[1]}Z`;
const upperLidPath = (e: Eye) => `M${e.l[0]},${e.l[1]} Q${e.cu[0]},${e.cu[1]} ${e.r[0]},${e.r[1]}`;

type Props = { width: number; priority?: boolean; className?: string };

const Character: React.FC<Props> = ({ width, priority = false, className = "" }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    if (!svg || !wrap) return;
    const q = gsap.utils.selector(svg);
    const irises = q(".iris");
    const lids = q(".lid");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // lids start fully open (scaled to nothing at the top of the eye)
    gsap.set(lids, { scaleY: 0, transformOrigin: "50% 0%" });

    let blinkTimer: ReturnType<typeof setTimeout>;
    const blink = () => {
      gsap.to(lids, { scaleY: 1, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.in" });
      // sometimes a double blink
      if (Math.random() < 0.25) gsap.to(lids, { scaleY: 1, duration: 0.07, yoyo: true, repeat: 1, delay: 0.22 });
      blinkTimer = setTimeout(blink, 2500 + Math.random() * 3500);
    };
    if (!reduce) blinkTimer = setTimeout(blink, 1800);

    const look = (clientX: number, clientY: number) => {
      const box = svg.getBoundingClientRect();
      if (!box.width) return;
      const s = box.width / W;
      EYES.forEach((eye, i) => {
        const dx = clientX - (box.left + eye.c[0] * s);
        const dy = clientY - (box.top + eye.c[1] * s);
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, dist / 260);
        gsap.to(irises[i], {
          x: (dx / dist) * 20 * reach,
          y: (dy / dist) * 8 * reach,
          duration: reduce ? 0 : 0.25,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
      if (!reduce) {
        // head turns slightly toward the pointer
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height * 0.3;
        const nx = Math.max(-1, Math.min(1, (clientX - cx) / window.innerWidth));
        const ny = Math.max(-1, Math.min(1, (clientY - cy) / window.innerHeight));
        gsap.to(wrap, { rotation: nx * 4, x: nx * 10, y: ny * 6, duration: 0.6, ease: "power2.out", overwrite: "auto" });
      }
    };

    const onMove = (e: PointerEvent) => look(e.clientX, e.clientY);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      clearTimeout(blinkTimer);
    };
  }, []);

  return (
    <div ref={wrapRef} className={`relative ${className}`} style={{ width, height: (width * H) / W }}>
      <Image
        src={portrait}
        width={width}
        height={Math.round((width * H) / W)}
        priority={priority}
        alt="Illustrated portrait of Arjun Chidambaram Subbiah"
        draggable={false}
        className="select-none"
      />
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true">
        <defs>
          <radialGradient id="iris-paint" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#C77A35" />
            <stop offset="55%" stopColor="#7A3F17" />
            <stop offset="100%" stopColor="#3B1A08" />
          </radialGradient>
          <linearGradient id="lid-shadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5A2E12" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#5A2E12" stopOpacity="0" />
          </linearGradient>
          {EYES.map((e, i) => (
            <clipPath key={i} id={`opening-${i}`}>
              <path d={openingPath(e)} />
            </clipPath>
          ))}
        </defs>
        {EYES.map((e, i) => (
          <g key={i} clipPath={`url(#opening-${i})`}>
            <g className="iris">
              <circle cx={e.c[0]} cy={e.c[1]} r={e.ir} fill="url(#iris-paint)" />
              <circle cx={e.c[0]} cy={e.c[1]} r={e.ir} fill="none" stroke="#2A1206" strokeWidth={2.5} />
              <circle cx={e.c[0]} cy={e.c[1]} r={e.ir * 0.45} fill="#120602" />
              <circle cx={e.c[0] + e.ir * 0.18} cy={e.c[1] - e.ir * 0.42} r={e.ir * 0.22} fill="#fff" />
            </g>
            {/* soft shadow under the upper lid keeps the eye from looking pasted on */}
            <rect x={e.l[0]} y={Math.min(e.l[1], e.r[1]) - 40} width={e.r[0] - e.l[0]} height={34} fill="url(#lid-shadow)" />
            <path d={upperLidPath(e)} fill="none" stroke="#5A2E12" strokeOpacity={0.35} strokeWidth={6} />
            {/* eyelid for blinking: skin-coloured, slides down from the top */}
            <rect
              className="lid"
              x={e.l[0] - 4}
              y={Math.min(e.cu[1], e.l[1], e.r[1]) + 10}
              width={e.r[0] - e.l[0] + 8}
              height={Math.max(e.l[1], e.r[1], e.cl[1]) - Math.min(e.cu[1], e.l[1], e.r[1])}
              fill={LID}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};

export default Character;
