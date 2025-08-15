import Image from "next/image";
import { useEffect, useRef } from "react";
import { RoughNotation } from "react-rough-notation";
import { useTheme } from "next-themes";
import ProjectCard from "@/components/ProjectCard";
import { useSection } from "context/section";
import useOnScreen from "hooks/useOnScreen";
import useScrollActive from "hooks/useScrollActive";

const ProjectSection: React.FC = () => {
  const { theme } = useTheme();

  const sectionRef = useRef<HTMLDivElement>(null);

  const elementRef = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(elementRef);

  // Set active link for project section
  const projectSection = useScrollActive(sectionRef);
  const { onSectionChange } = useSection();
  useEffect(() => {
    projectSection && onSectionChange!("projects");
  }, [onSectionChange, projectSection]);

  return (
    <section ref={sectionRef} id="projects" className="section">
      <div className="project-title text-center">
        <RoughNotation
          type="underline"
          color={`${theme === "light" ? "rgb(0, 122, 122)" : "rgb(5 206 145)"}`}
          strokeWidth={2}
          order={1}
          show={isOnScreen}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">Projects</h2>
        </RoughNotation>
      </div>
      <span className="project-desc text-center block mb-4" ref={elementRef}>
        "Talk is cheap. Show me the code"? I got you. <br />
        Here are some of my projects you shouldn't miss
      </span>
      <div className="flex flex-wrap">
        {projects.map((project, index) => (
          <ProjectCard key={project.title} index={index} project={project} />
        ))}
      </div>
      <div className="others text-center mb-16">
        Other projects can be explored in{" "}
        <a
          href="https://github.com/arjunsubbiah"
          className="font-medium underline link-outline text-marrsgreen dark:text-carrigreen whitespace-nowrap"
        >
          my github profile
        </a>
      </div>
    </section>
  );
};

const projects = [
  {
    title: "Your Project 1",
    type: "Frontend",
    image: (
      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
        Project 1
      </div>
    ),
    desc: "Add your project description here. What technologies did you use? What problem does it solve?",
    tags: ["React", "TypeScript", "TailwindCSS"],
    liveUrl: "https://your-project-url.com",
    codeUrl: "https://github.com/your-username/your-project",
    bgColor: "bg-[#9FD0E3]",
    githubApi: "https://api.github.com/repos/your-username/your-project",
  },
  {
    title: "Your Project 2",
    type: "Full Stack",
    image: (
      <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xl">
        Project 2
      </div>
    ),
    desc: "Another project description. Highlight the key features and technologies used.",
    tags: ["Next.js", "TypeScript", "Node.js"],
    liveUrl: "https://your-project-2.com",
    codeUrl: "https://github.com/your-username/your-project-2",
    bgColor: "bg-[#B4BEE0]",
    githubApi: "https://api.github.com/repos/your-username/your-project-2",
  },
];

export default ProjectSection;
