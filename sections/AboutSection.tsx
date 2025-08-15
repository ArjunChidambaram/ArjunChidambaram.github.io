import { useEffect, useRef } from "react";
import Image from "next/image";
import { RoughNotation, RoughNotationGroup } from "react-rough-notation";
import { useTheme } from "next-themes";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

import { useSection } from "context/section";
import useOnScreen from "hooks/useOnScreen";
import useScrollActive from "hooks/useScrollActive";
import { siteConfig } from "config/site.config";

import AboutBgSvg from "@/components/AboutBgSvg";
import EduGroup from "@/components/EduGroup";

const AboutSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isSecOnScreen = useOnScreen(sectionRef);

  useEffect(() => {
    const q = gsap.utils.selector(sectionRef);

    gsap.registerPlugin(ScrollTrigger);

    // profile-picture
    gsap.fromTo(
      q(".profile-picture"),
      {
        x: -200,
        opacity: 0,
      },
      {
        x: 0,
        opacity: 1,
        scrollTrigger: {
          trigger: q(".profile-picture"),
          start: "20% bottom",
        },
      }
    );

    const fromAnimation = {
      y: 100,
      opacity: 0,
    };

    const toAnimation = (triggerTarget: string) => ({
      y: 0,
      opacity: 1,
      scrollTrigger: {
        trigger: q(`.${triggerTarget}`),
        start: "top bottom",
      },
    });

    // about-intro
    gsap.fromTo(q(".about-intro"), fromAnimation, toAnimation("about-intro"));

    // edu-bg
    gsap.fromTo(q(".edu-bg"), fromAnimation, toAnimation("edu-bg"));

    // bg svg parallax effect
    gsap.fromTo(
      q(".bg-svg"),
      { y: -80 },
      {
        scrollTrigger: {
          trigger: q(".bg-svg"),
          scrub: true,
        },
        y: 65,
        duration: 3,
      }
    );

    // image bg svg parallax effect
    gsap.fromTo(
      q(".img-svg"),
      { y: -30 },
      {
        scrollTrigger: {
          trigger: q(".img-svg"),
          start: "80% 75%",
          scrub: true,
        },
        y: 30,
      }
    );
  }, []);

  const { theme } = useTheme();

  const eduRef = useRef<HTMLDivElement>(null);

  // Set active link for about section
  const aboutSection = useScrollActive(sectionRef);
  const { onSectionChange } = useSection();
  useEffect(() => {
    aboutSection ? onSectionChange!("who am i?") : onSectionChange!("");
  }, [aboutSection, onSectionChange]);

  return (
    <div
      ref={sectionRef}
      className="about-panel bg-white dark:bg-[#1B2731] relative"
    >
      <section id="whoami" className="section">
        <RoughNotationGroup>
          <div className="text-center mb-8">
            <RoughNotation
              type="underline"
              color={`${
                theme === "light" ? "rgb(0, 122, 122)" : "rgb(5 206 145)"
              }`}
              strokeWidth={2}
              order={1}
              show={isSecOnScreen}
            >
              <h2 className="section-heading">{siteConfig.aboutSection.title}</h2>
            </RoughNotation>
          </div>
          
          {/* Main content */}
          <div className="w-full px-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch h-full w-full">
              {/* Column 1: My Journey */}
              <div className="flex flex-col items-center lg:items-start justify-between h-full mt-0">
                {/* Illustration (removed to bring 'My Journey' to top) */}
                {/* Journey Content */}
                <div className="lg:pr-4">
                  <h3 className="text-2xl font-bold mb-4">{siteConfig.aboutSection.myJourney.title}</h3>
                  <div className="space-y-4 mb-8">
                    {siteConfig.aboutSection.myJourney.paragraphs.map((paragraph, index) => (
                      <p key={index} className={index === 0 ? "about-intro" : ""}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 2: Experience */}
              <div className="flex flex-col justify-between h-full">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-4">Experience</h3>
                  <div className="space-y-6">
                    {siteConfig.aboutSection.experience.map((exp, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="text-xl font-semibold">{exp.title}</h4>
                        <p className="text-blue-600 dark:text-blue-400">{exp.company}</p>
                        <p className="text-gray-600 dark:text-gray-400">{exp.period}</p>
                        <p className="mt-2">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 3: Education */}
              <div className="flex flex-col justify-between h-full">
                <div ref={eduRef}>
                  <h3 className="text-2xl font-bold mb-4">Education</h3>
                  <div className="space-y-6">
                    {siteConfig.aboutSection.education.map((edu, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="text-xl font-semibold">{edu.degree}</h4>
                        <p className="text-blue-600 dark:text-blue-400">{edu.school}</p>
                        <p className="text-gray-600 dark:text-gray-400">{edu.period}</p>
                        <p className="mt-2">{edu.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Technologies Section moved below the grid */}
          <div className="w-full flex flex-col items-center mt-8">
            <h3 className="text-2xl font-bold mb-4">Technologies I Work With</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {siteConfig.aboutSection.skills.map((skill, index) => (
                <span key={index} className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </RoughNotationGroup>
      </section>

      <AboutBgSvg />
    </div>
  );
};

export default AboutSection;
