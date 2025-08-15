import type { NextPage } from "next";
import Head from "next/head";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SocialLinks from "@/components/SocialLinks";
import { siteConfig } from "config/site.config";

const About: NextPage = () => {
  return (
    <>
      <Head>
        <title>About Me - {siteConfig.personalInfo.brandName}</title>
        <meta name="description" content={`Learn more about ${siteConfig.personalInfo.fullName}, ${siteConfig.personalInfo.jobTitle} with ${siteConfig.personalInfo.experience} of experience in ${siteConfig.personalInfo.expertise}`} />
      </Head>
      
      <div className="bg-bglight dark:bg-bgdark min-h-screen">
        <div className="selection:bg-marrsgreen selection:text-bglight dark:selection:bg-carrigreen dark:selection:text-bgdark">
          <Header />
          
          <main className="pt-20 px-4 sm:px-8">
            <div className="max-w-4xl mx-auto">
              <section className="py-16">
                <h1 className="text-4xl md:text-6xl font-bold text-textdark dark:text-textlight mb-8">
                  About Me
                </h1>
                
                <div className="prose dark:prose-dark max-w-none">
                  <div className="grid md:grid-cols-2 gap-12 items-start">
                    <div>
                      {siteConfig.aboutSection.myJourney.paragraphs.map((paragraph, index) => (
                        <p key={index} className="text-lg text-textdark/80 dark:text-textlight/80 mb-6 first:text-xl">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold text-textdark dark:text-textlight mb-3">
                          Technologies I Work With
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {siteConfig.aboutSection.skills.map((skill, index) => (
                            <span key={index} className="px-3 py-1 text-sm bg-marrsgreen/10 dark:bg-carrigreen/10 text-marrsgreen dark:text-carrigreen rounded-full border border-marrsgreen/20 dark:border-carrigreen/20">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Experience Section */}
                  <div className="mt-16">
                    <h3 className="text-2xl font-bold text-textdark dark:text-textlight mb-8">
                      Professional Experience
                    </h3>
                    <div className="space-y-8">
                      {siteConfig.aboutSection.experience.map((exp, index) => (
                        <div key={index} className="border-l-4 border-marrsgreen dark:border-carrigreen pl-6 py-4">
                          <h4 className="text-xl font-semibold text-textdark dark:text-textlight">
                            {exp.title}
                          </h4>
                          <p className="text-marrsgreen dark:text-carrigreen font-medium">
                            {exp.company}
                          </p>
                          <p className="text-textdark/60 dark:text-textlight/60 text-sm mb-2">
                            {exp.period}
                          </p>
                          <p className="text-textdark/80 dark:text-textlight/80">
                            {exp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Education Section */}
                  <div className="mt-16">
                    <h3 className="text-2xl font-bold text-textdark dark:text-textlight mb-8">
                      Education
                    </h3>
                    <div className="space-y-8">
                      {siteConfig.aboutSection.education.map((edu, index) => (
                        <div key={index} className="border-l-4 border-marrsgreen dark:border-carrigreen pl-6 py-4">
                          <h4 className="text-xl font-semibold text-textdark dark:text-textlight">
                            {edu.degree}
                          </h4>
                          <p className="text-marrsgreen dark:text-carrigreen font-medium">
                            {edu.school}
                          </p>
                          <p className="text-textdark/60 dark:text-textlight/60 text-sm mb-2">
                            {edu.period}
                          </p>
                          <p className="text-textdark/80 dark:text-textlight/80">
                            {edu.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </main>
          
          <SocialLinks page="about" />
          <Footer />
        </div>
      </div>
    </>
  );
};

export default About;
