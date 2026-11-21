import { forwardRef } from "react";

/**
 * A little door the character walks through. The panel is hinged on the left
 * and swings open in 3D (animate `.door-panel` rotationY to -100, or +100 when hinged on the right).
 * Behind it is warm light, so an open door glows.
 */
type Props = {
  width: number;
  height: number;
  className?: string;
  style?: React.CSSProperties;
  /** which side the hinges are on; the panel swings open on that side */
  hinge?: "left" | "right";
};

const Door = forwardRef<HTMLDivElement, Props>(({ width, height, className = "", style, hinge = "left" }, ref) => {
  const frame = Math.max(4, Math.round(width * 0.07));
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`door pointer-events-none ${className}`}
      style={{ width, height, perspective: width * 6, ...style }}
    >
      {/* light spilling out of the doorway */}
      <div
        className="door-glow absolute -inset-x-6 bottom-0 top-1/3 rounded-full opacity-0 blur-xl"
        style={{ background: "radial-gradient(closest-side, rgba(253, 200, 110, 0.55), rgba(253, 200, 110, 0))" }}
      />
      {/* frame and lit interior */}
      <div
        className="absolute inset-0 rounded-t-xl"
        style={{
          border: `${frame}px solid #1E293B`,
          borderBottom: "none",
          background: "linear-gradient(180deg, #FFF3C9 0%, #FDCB75 100%)",
        }}
      />
      {/* the door itself */}
      <div
        className="door-panel absolute rounded-t-lg"
        style={{
          left: frame,
          right: frame,
          top: frame,
          bottom: 0,
          transformOrigin: hinge === "left" ? "0% 50%" : "100% 50%",
          background: "linear-gradient(90deg, #00807F 0%, #007A7A 60%, #006666 100%)",
          boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.12)",
        }}
      >
        <div className="absolute rounded-sm border-2 border-black/15" style={{ left: "16%", right: "16%", top: "9%", height: "36%" }} />
        <div className="absolute rounded-sm border-2 border-black/15" style={{ left: "16%", right: "16%", top: "52%", height: "38%" }} />
        <div className="absolute rounded-full bg-amber-300 shadow" style={{ [hinge === "left" ? "right" : "left"]: "12%", top: "50%", width: width * 0.09, height: width * 0.09 }} />
      </div>
      {/* doorstep shadow */}
      <div className="absolute -bottom-1 left-1/2 h-2 w-[120%] -translate-x-1/2 rounded-[50%] bg-black/20 blur-sm" />
    </div>
  );
});

Door.displayName = "Door";

export default Door;
