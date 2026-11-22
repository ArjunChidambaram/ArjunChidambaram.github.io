import { useEffect, useRef, useState } from "react";

import { useSection } from "context/section";
import neutralImg from "../public/character/neutral.webp";
import waveImg from "../public/character/wave.webp";
import thinkingImg from "../public/character/thinking.webp";
import typingImg from "../public/character/typing.webp";
import pointingImg from "../public/character/pointing.webp";
import presentingImg from "../public/character/presenting.webp";
import celebratingImg from "../public/character/celebrating.webp";
import confidentImg from "../public/character/confident.webp";

/**
 * Mini Arjun in a fixed corner of the screen. He never moves; only his pose
 * changes to suit the section you're reading. Hover and he waves; click and
 * he celebrates and takes you back to the top.
 */

type Pose = "neutral" | "wave" | "thinking" | "typing" | "pointing" | "presenting" | "celebrating" | "confident";

const SRC: Record<Pose, string> = {
  neutral: neutralImg.src,
  wave: waveImg.src,
  thinking: thinkingImg.src,
  typing: typingImg.src,
  pointing: pointingImg.src,
  presenting: presentingImg.src,
  celebrating: celebratingImg.src,
  confident: confidentImg.src,
};

// natural width/height of each cut-out, so every pose renders at the same scale
const SIZE: Record<Pose, [number, number]> = {
  neutral: [151, 441],
  wave: [180, 442],
  thinking: [133, 440],
  typing: [212, 444],
  pointing: [281, 445],
  presenting: [252, 444],
  celebrating: [239, 444],
  confident: [150, 447],
};
// poses drawn facing right; mirrored so he faces into the page from the right corner
const FACES_RIGHT: Pose[] = ["pointing", "presenting", "typing"];

const SECTION_POSE: Record<string, { pose: Pose; say: string }> = {
  "who am i?": { pose: "confident", say: "That's my story" },
  projects: { pose: "presenting", say: "Hover a card, it tilts!" },
  blog: { pose: "typing", say: "I write about ML and LLMs" },
  contact: { pose: "pointing", say: "Say hi! I read every email" },
};
const DEFAULT = { pose: "thinking" as Pose, say: "Click me to go back up" };

const FloatingBuddy: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [override, setOverride] = useState<Pose | null>(null);
  const [bubble, setBubble] = useState<string | null>(null);
  const [height, setHeight] = useState(150);
  const { currentSection } = useSection();
  const bubbleTimer = useRef<ReturnType<typeof setTimeout>>();

  const info = SECTION_POSE[currentSection ?? ""] ?? DEFAULT;
  const pose = override ?? info.pose;

  useEffect(() => {
    const onResize = () => setHeight(window.innerWidth < 640 ? 100 : 150);
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.75);
    onResize();
    onScroll();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const say = (msg: string, ms = 2800) => {
    setBubble(msg);
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), ms);
  };

  // a quick word when you reach a new section
  useEffect(() => {
    const s = SECTION_POSE[currentSection ?? ""];
    if (visible && s) say(s.say);
  }, [currentSection, visible]);

  const hover = () => {
    clearTimeout(bubbleTimer.current);
    setOverride("wave");
    setBubble(info === DEFAULT ? "Hi! Click me to go back up" : info.say);
  };
  const unhover = () => {
    setOverride(null);
    bubbleTimer.current = setTimeout(() => setBubble(null), 600);
  };
  const celebrate = () => {
    setOverride("celebrating");
    say("Back to the top!", 1600);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setOverride(null), 1600);
  };

  return (
    <div
      className={`fixed z-40 bottom-24 right-3 md:bottom-6 md:right-20 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!visible}
    >
      {bubble && (
        <span
          role="status"
          className="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-full bg-bgdark dark:bg-bglight px-3 py-1 text-sm text-textlight dark:text-bgdark shadow-lg"
        >
          {bubble}
        </span>
      )}
      <button
        type="button"
        onClick={celebrate}
        onMouseEnter={hover}
        onMouseLeave={unhover}
        onFocus={hover}
        onBlur={unhover}
        aria-label="Back to top"
        title="Back to top"
        className="relative focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marrsgreen"
        style={{ height, width: height * 0.65 }}
      >
        {/* every pose is stacked in the same spot; only the current one is shown */}
        {(Object.keys(SRC) as Pose[]).map((p) => {
          const [w, h] = SIZE[p];
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p}
              src={SRC[p]}
              alt=""
              draggable={false}
              className="absolute bottom-0 left-1/2 select-none transition-opacity duration-200"
              style={{
                height,
                width: (w / h) * height,
                transform: `translateX(-50%)${FACES_RIGHT.includes(p) ? " scaleX(-1)" : ""}`,
                opacity: p === pose ? 1 : 0,
              }}
            />
          );
        })}
        <span aria-hidden="true" className="absolute -bottom-1 left-1/2 h-2 w-3/4 -translate-x-1/2 rounded-[50%] bg-black/15 blur-sm" />
      </button>
    </div>
  );
};

export default FloatingBuddy;
