import type { NextPage } from "next";
import Head from "next/head";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SocialLinks from "@/components/SocialLinks";
import { siteConfig } from "config/site.config";

const Portfolio: NextPage = () => {
  return (
    <>
      <Head>
        <title>Portfolio - {siteConfig.personalInfo.brandName}</title>
        <meta name="description" content="My professional portfolio and achievements" />
      </Head>
      
      <div className="bg-bglight dark:bg-bgdark min-h-screen">
        <div className="selection:bg-marrsgreen selection:text-bglight dark:selection:bg-carrigreen dark:selection:text-bgdark">
          <Header />
          
          <main className="pt-20 px-4 sm:px-8">
            <div className="max-w-6xl mx-auto">
              <section className="py-16">
                <h1 className="text-4xl md:text-6xl font-bold text-textdark dark:text-textlight mb-8">
                  Portfolio
                </h1>
                
                <div className="prose dark:prose-dark max-w-none">
                  <p className="text-lg text-textdark/80 dark:text-textlight/80 mb-12">
                    Welcome to my portfolio! Here you'll find a curated collection of my best work,
                    achievements, and professional experiences.
                  </p>
                  
                  {/* Skills Section */}
                  <div className="mb-16">
                    <h2 className="text-2xl font-bold text-textdark dark:text-textlight mb-6">
                      Technical Skills
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['JavaScript', 'TypeScript', 'React', 'Next.js', 'Python', 'Machine Learning', 'Data Science', 'Node.js'].map((skill) => (
                        <div key={skill} className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <span className="font-medium text-textdark dark:text-textlight">{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Experience Section */}
                  <div className="mb-16">
                    <h2 className="text-2xl font-bold text-textdark dark:text-textlight mb-6">
                      Professional Experience
                    </h2>
                    <div className="space-y-8">
                      <div className="border-l-4 border-marrsgreen dark:border-carrigreen pl-6">
                        <h3 className="text-xl font-semibold text-textdark dark:text-textlight">
                          Staff Data Scientist
                        </h3>
                        <p className="text-marrsgreen dark:text-carrigreen font-medium mb-2">
                          Current Position
                        </p>
                        <p className="text-textdark/70 dark:text-textlight/70">
                          Leading data science initiatives and machine learning projects to drive business insights and innovation.
                        </p>
                      </div>
                      
                      <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-6">
                        <h3 className="text-xl font-semibold text-textdark dark:text-textlight">
                          Senior Data Scientist
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                          Previous Role
                        </p>
                        <p className="text-textdark/70 dark:text-textlight/70">
                          Developed and deployed machine learning models for various business applications.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Achievements Section */}
                  <div>
                    <h2 className="text-2xl font-bold text-textdark dark:text-textlight mb-6">
                      Key Achievements
                    </h2>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <span className="text-marrsgreen dark:text-carrigreen mr-2">✓</span>
                        <span className="text-textdark dark:text-textlight">
                          Led a team that improved model accuracy by 25% using advanced ML techniques
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-marrsgreen dark:text-carrigreen mr-2">✓</span>
                        <span className="text-textdark dark:text-textlight">
                          Published research papers in top-tier conferences
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-marrsgreen dark:text-carrigreen mr-2">✓</span>
                        <span className="text-textdark dark:text-textlight">
                          Mentored junior data scientists and contributed to team growth
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </main>
          
          <SocialLinks page="portfolio" />
          <Footer />
        </div>
      </div>
    </>
  );
};

export default Portfolio;
