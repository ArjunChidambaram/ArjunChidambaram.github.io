import { useEffect, useRef } from "react";
import { RoughNotation } from "react-rough-notation";
import { useTheme } from "next-themes";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

import { useSection } from "context/section";
import useOnScreen from "hooks/useOnScreen";
import useScrollActive from "hooks/useScrollActive";
import { siteConfig } from "config/site.config";

const { workSection } = siteConfig;

const WorkSection: React.FC = () => {
  const { theme } = useTheme();
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(headingRef);

  // highlight "Projects" in the side navigation while this section is in view
  const active = useScrollActive(sectionRef);
  const { onSectionChange } = useSection();
  useEffect(() => {
    active && onSectionChange!("projects");
  }, [active, onSectionChange]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const q = gsap.utils.selector(sectionRef);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // numbers count up from zero when the stat row scrolls into view
    q(".stat-value").forEach((el: Element) => {
      const target = Number(el.getAttribute("data-value"));
      const decimals = Number(el.getAttribute("data-decimals") || 0);
      const counter = { v: reduce ? target : 0 };
      const render = () => {
        el.textContent = counter.v.toFixed(decimals);
      };
      render();
      if (reduce) return;
      gsap.to(counter, {
        v: target,
        duration: 1.8,
        ease: "power2.out",
        onUpdate: render,
        scrollTrigger: { trigger: el, start: "top 90%" },
      });
    });

    if (reduce) return;

    gsap.fromTo(
      q(".stat"),
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.12,
        duration: 0.6,
        scrollTrigger: { trigger: q(".stat")[0], start: "top 90%" },
      }
    );

    // project cards fan in, alternating from left and right
    q(".work-card").forEach((card: Element, i: number) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 70, x: i % 2 ? 40 : -40, rotate: i % 2 ? 2 : -2 },
        {
          opacity: 1,
          y: 0,
          x: 0,
          rotate: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 92%" },
        }
      );
    });
  }, []);

  // gentle 3D tilt that follows the pointer
  const tilt = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-4px)`;
  };
  const untilt = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "";
  };

  return (
    <div ref={sectionRef} className="bg-bglight dark:bg-bgdark">
      <section id="projects" className="section">
        <div className="text-center" ref={headingRef}>
          <RoughNotation
            type="underline"
            color={`${theme === "light" ? "rgb(0, 122, 122)" : "rgb(5 206 145)"}`}
            strokeWidth={2}
            order={1}
            show={isOnScreen}
          >
            <h2 className="section-heading">{workSection.title}</h2>
          </RoughNotation>
          <p className="mx-auto mt-2 mb-10 max-w-2xl">{workSection.description}</p>
        </div>

        <dl className="mb-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {workSection.stats.map((s) => (
            <div
              key={s.label}
              className="stat rounded-lg border-2 border-marrsgreen/20 dark:border-carrigreen/20 bg-white dark:bg-carddark p-5 text-center"
            >
              <dd className="text-3xl md:text-4xl font-bold text-marrsgreen dark:text-carrigreen tabular-nums">
                <span
                  className="stat-value"
                  data-value={s.value}
                  data-decimals={"decimals" in s ? s.decimals : 0}
                >
                  {s.value}
                </span>
                {s.suffix}
              </dd>
              <dt className="mt-1 text-sm text-gray-600 dark:text-gray-300">{s.label}</dt>
            </div>
          ))}
        </dl>

        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workSection.projects.map((p) => (
            <li
              key={p.title}
              onMouseMove={tilt}
              onMouseLeave={untilt}
              className="work-card group relative flex flex-col rounded-lg bg-white dark:bg-carddark p-6 shadow-md hover:shadow-xl transition-[box-shadow,transform] duration-200 ease-out will-change-transform"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 rounded-t-lg bg-marrsgreen dark:bg-carrigreen transition-transform duration-300 group-hover:scale-x-100"
              />
              <div className="mb-4 flex items-center justify-between">
                <span
                  aria-hidden="true"
                  className="text-4xl inline-block transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-12"
                >
                  {p.emoji}
                </span>
                <span className="rounded-full bg-cardlight dark:bg-bgdark px-3 py-1 text-xs font-medium text-marrsdark dark:text-carrilight">
                  {p.tag}
                </span>
              </div>
              <h3 className="text-lg font-semibold leading-snug">{p.title}</h3>
              <p className="mt-2 flex-1 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">{p.body}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {p.tech.map((t) => (
                  <li key={t} className="text-xs text-gray-500 dark:text-gray-400">
                    #{t.replace(/\s+/g, "")}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default WorkSection;
