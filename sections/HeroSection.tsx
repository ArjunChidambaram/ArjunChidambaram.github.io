import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

import LinkButton from "../components/LinkButton";
import { siteConfig } from "config/site.config";

import Character from "@/components/Character";

// Types out each role, pauses, deletes it, then moves to the next.
const useTypewriter = (words: readonly string[]) => {
  const [text, setText] = useState("");
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setText(words[0]);
      return;
    }
    let word = 0;
    let char = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const current = words[word];
      char += deleting ? -1 : 1;
      setText(current.slice(0, char));
      let delay = deleting ? 35 : 70;
      if (!deleting && char === current.length) {
        deleting = true;
        delay = 1600;
      } else if (deleting && char === 0) {
        deleting = false;
        word = (word + 1) % words.length;
        delay = 350;
      }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 1800);
    return () => clearTimeout(timer);
  }, [words]);
  return text;
};

// Kept in its own component so its rapid re-renders don't touch the hero animations.
const TypedRoles: React.FC = () => {
  const typed = useTypewriter(siteConfig.heroSection.roles);
  return (
    <span aria-hidden="true">
      {typed}
      <span className="ml-0.5 inline-block w-[2px] h-6 align-middle bg-marrsgreen dark:bg-carrigreen animate-pulse" />
    </span>
  );
};

const HeroSection: React.FC = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const q = gsap.utils.selector(sectionRef);
    gsap.registerPlugin(ScrollTrigger);

    // bg text parallax effect
    gsap.to(q(".bg-text"), {
      scrollTrigger: {
        trigger: q(".bg-text"),
        scrub: true,
      },
      y: 350,
    });

    // text animation after initial load
    let tl = gsap.timeline({ defaults: { stagger: 0.2, duration: 0.3 } });
    tl.fromTo(q(".text-animation"), { y: 100 }, { y: 0, delay: 1 });

    // character drops in after the loader, then starts floating
    gsap.fromTo(
      q(".character-wrap"),
      { opacity: 0, y: -60, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 1.1, delay: 1.3, ease: "back.out(1.6)" }
    );
    gsap.fromTo(q(".hero-fade"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, delay: 1.6, stagger: 0.15 });

    // the shadow shrinks as he rises and grows as he sinks
    gsap.to(q(".hero-blob"), { rotation: 360, duration: 40, repeat: -1, ease: "none" });

    // illustration floating effect
    let imgTl = gsap.timeline({ repeat: -1 });
    imgTl
      .to(q(".image-animation"), 3, {
        y: "-=14",
        x: "+=6",
        rotation: "-=1",
        ease: "power1.easeInOut",
      })
      .to(q(".image-animation"), 2, {
        y: "+=14",
        x: "-=6",
        rotation: "-=1",
        ease: "power1.easeInOut",
      })
      .to(q(".image-animation"), 3, {
        y: "-=10",
        rotation: "+=1",
        ease: "power1.easeInOut",
      })
      .to(q(".image-animation"), 3, {
        y: "+=10",
        rotation: "+=1",
        ease: "power1.easeInOut",
      });

  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative mt-16 sm:mt-8 pt-8 lg:pt-0 px-4 sm:px-8 md:px-20 max-w-5xl sm:pb-24 min-h-[769px] mx-auto sm:flex sm:flex-col sm:justify-center sm:items-center lg:flex-row-reverse"
    >
      <span
        aria-hidden="true"
        className="bg-text absolute -top-36 rotate-12 text-gray-100 dark:text-[#1f2e3a] text-9xl scale-150 tracking-wide font-bold select-none pointer-events-none text-center z-0"
      >
        {siteConfig.heroSection.backgroundText}
      </span>

      {/* Temporarily hidden hero images - files preserved */}
      <div className="character-wrap relative z-10 select-none mt-0 xs:mt-6 sm:mt-14 lg:mt-0 mx-auto lg:basis-1/3 flex justify-center">
        {/* soft blob behind him, like the character sheet */}
        <div
          aria-hidden="true"
          className="hero-blob absolute top-16 left-1/2 -translate-x-1/2 h-72 w-72 md:h-[23rem] md:w-[23rem] rounded-[42%_58%_55%_45%/48%_42%_58%_52%]"
          style={{ backgroundColor: "rgba(0, 122, 122, 0.13)" }}
        />
        <div className="image-animation relative">
          <Character width={300} priority className="mx-auto" />
        </div>
      </div>

      <div className="lg:basis-2/3 z-10 relative">
        <span className="text-marrsgreen lg:text-lg font-medium dark:text-carrigreen">
          {siteConfig.heroSection.greeting}
        </span>
        <div className="overflow-hidden">
          <h1 className="text-animation text-4xl md:text-5xl lg:text-7xl md:my-2 font-semibold my-1">
            {siteConfig.personalInfo.fullName}
          </h1>
        </div>
        <div className="overflow-hidden">
          <span className="text-animation text-2xl md:text-3xl lg:text-5xl block md:my-3 text-marrsgreen dark:text-carrigreen font-medium">
            {siteConfig.personalInfo.jobTitle}
          </span>
        </div>
        <p className="hero-fade mt-1 mb-3 text-lg md:text-xl font-medium text-gray-700 dark:text-gray-200 h-8" aria-label={siteConfig.heroSection.roles.join(", ")}>
          <TypedRoles />
        </p>
        <div className="hero-fade mt-2 my-4 md:mb-8 max-w-2xl">
          {siteConfig.heroSection.heroDescription.map((paragraph, index) => (
            <p key={index} className="mb-1">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="hero-fade flex flex-wrap items-center gap-4">
          <LinkButton href={`mailto:${siteConfig.personalInfo.email}`}>
            {siteConfig.heroSection.ctaText}
          </LinkButton>
          <a
            href="#projects"
            className="link-outline font-medium text-marrsgreen dark:text-carrigreen underline underline-offset-4 decoration-2 hover:decoration-4"
          >
            {siteConfig.heroSection.secondaryCtaText}
          </a>
        </div>
      </div>
      <a
        href="#whoami"
        className="group absolute link-outline animate-bounce hidden md:bottom-14 lg:bottom-16 left-1/2 transform -translate-x-1/2 md:flex items-center flex-col"
      >
        <span className="group-hover:text-marrsgreen dark:group-hover:text-carrigreen">
          {siteConfig.heroSection.scrollText}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          className="dark:fill-bglight group-hover:fill-marrsgreen dark:group-hover:fill-carrigreen"
        >
          <path d="M11.975 22H12c3.859 0 7-3.14 7-7V9c0-3.841-3.127-6.974-6.981-7h-.06C8.119 2.022 5 5.157 5 9v6c0 3.86 3.129 7 6.975 7zM7 9a5.007 5.007 0 0 1 4.985-5C14.75 4.006 17 6.249 17 9v6c0 2.757-2.243 5-5 5h-.025C9.186 20 7 17.804 7 15V9z"></path>
          <path d="M11 6h2v6h-2z"></path>
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          className="dark:fill-bglight group-hover:fill-marrsgreen dark:group-hover:fill-carrigreen"
        >
          <path d="M16.293 9.293 12 13.586 7.707 9.293l-1.414 1.414L12 16.414l5.707-5.707z"></path>
        </svg>
      </a>
    </section>
  );
};

export default HeroSection;
