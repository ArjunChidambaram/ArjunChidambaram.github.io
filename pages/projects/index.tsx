import type { NextPage } from "next";
import Head from "next/head";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SocialLinks from "@/components/SocialLinks";
import { siteConfig } from "config/site.config";

const Projects: NextPage = () => {
  return (
    <>
      <Head>
        <title>Projects - {siteConfig.personalInfo.brandName}</title>
        <meta name="description" content="Check out my latest projects and work" />
      </Head>
      
      <div className="bg-bglight dark:bg-bgdark min-h-screen">
        <div className="selection:bg-marrsgreen selection:text-bglight dark:selection:bg-carrigreen dark:selection:text-bgdark">
          <Header />
          
          <main className="pt-20 px-4 sm:px-8">
            <div className="max-w-6xl mx-auto">
              <section className="py-16">
                <h1 className="text-4xl md:text-6xl font-bold text-textdark dark:text-textlight mb-8">
                  My Projects
                </h1>
                
                <div className="prose dark:prose-dark max-w-none">
                  <p className="text-lg text-textdark/80 dark:text-textlight/80 mb-8">
                    Here are some of the projects I've been working on. Each project represents
                    a unique challenge and learning opportunity in my journey as a developer.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Example Project Cards */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <h3 className="text-xl font-semibold mb-3 text-textdark dark:text-textlight">
                        Project One
                      </h3>
                      <p className="text-textdark/70 dark:text-textlight/70 mb-4">
                        A brief description of this amazing project and what it accomplishes.
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-marrsgreen/10 dark:bg-carrigreen/10 text-marrsgreen dark:text-carrigreen rounded-full text-sm">
                          React
                        </span>
                        <span className="px-3 py-1 bg-marrsgreen/10 dark:bg-carrigreen/10 text-marrsgreen dark:text-carrigreen rounded-full text-sm">
                          TypeScript
                        </span>
                      </div>
                      <a 
                        href="#" 
                        className="text-marrsgreen dark:text-carrigreen hover:underline font-medium"
                      >
                        View Project →
                      </a>
                    </div>
                    
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <h3 className="text-xl font-semibold mb-3 text-textdark dark:text-textlight">
                        Project Two
                      </h3>
                      <p className="text-textdark/70 dark:text-textlight/70 mb-4">
                        Another interesting project with different technologies and challenges.
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-marrsgreen/10 dark:bg-carrigreen/10 text-marrsgreen dark:text-carrigreen rounded-full text-sm">
                          Next.js
                        </span>
                        <span className="px-3 py-1 bg-marrsgreen/10 dark:bg-carrigreen/10 text-marrsgreen dark:text-carrigreen rounded-full text-sm">
                          Tailwind
                        </span>
                      </div>
                      <a 
                        href="#" 
                        className="text-marrsgreen dark:text-carrigreen hover:underline font-medium"
                      >
                        View Project →
                      </a>
                    </div>
                    
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <h3 className="text-xl font-semibold mb-3 text-textdark dark:text-textlight">
                        Project Three
                      </h3>
                      <p className="text-textdark/70 dark:text-textlight/70 mb-4">
                        A third project showcasing different skills and technologies.
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-marrsgreen/10 dark:bg-carrigreen/10 text-marrsgreen dark:text-carrigreen rounded-full text-sm">
                          Python
                        </span>
                        <span className="px-3 py-1 bg-marrsgreen/10 dark:bg-carrigreen/10 text-marrsgreen dark:text-carrigreen rounded-full text-sm">
                          Machine Learning
                        </span>
                      </div>
                      <a 
                        href="#" 
                        className="text-marrsgreen dark:text-carrigreen hover:underline font-medium"
                      >
                        View Project →
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </main>
          
          <SocialLinks page="projects" />
          <Footer />
        </div>
      </div>
    </>
  );
};

export default Projects;
