import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";

import AppHead from "@/components/AppHead";
import Loader from "@/components/Loader";
import SkipToMain from "@/components/SkipToMain";
import Header from "@/components/Header";
import SocialLinks from "@/components/SocialLinks";
import HeroSection from "@/sections/HeroSection";
import AboutSection from "@/sections/AboutSection";
import WorkSection from "@/sections/WorkSection";
import BlogSection from "@/sections/BlogSection";
import ContactSection from "@/sections/ContactSection";
import Footer from "@/components/Footer";
import FloatingBuddy from "@/components/FloatingBuddy";

import { getAllPosts } from "utils/api";
import { MdxMeta } from "../pages/blog/posts/[slug]";
import { siteConfig, SITE_URL } from "config/site.config";

type Props = {
  blogPosts: MdxMeta[];
};

export const meta = {
  description: siteConfig.siteMetadata.description,
  author: siteConfig.personalInfo.fullName,
  type: "website",
  ogImage: `${SITE_URL}${siteConfig.images.ogImage}`,
  siteName: siteConfig.siteMetadata.siteName,
  imageAlt: siteConfig.siteMetadata.imageAlt,
};

const Home: NextPage<Props> = ({ blogPosts }) => {
  return (
    <>
      <AppHead
        title={siteConfig.siteMetadata.title}
        url={`${SITE_URL}/`}
        meta={meta}
      />
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: siteConfig.personalInfo.fullName,
              alternateName: siteConfig.personalInfo.shortName,
              jobTitle: siteConfig.personalInfo.jobTitle,
              worksFor: { "@type": "Organization", name: "Walmart" },
              address: { "@type": "PostalAddress", addressLocality: "San Jose", addressRegion: "CA", addressCountry: "US" },
              alumniOf: ["Lehigh University", "PSG College of Technology"].map((name) => ({ "@type": "CollegeOrUniversity", name })),
              knowsAbout: ["A/B testing", "Causal inference", "Experimentation", "Machine learning", "LLM agents"],
              url: `${SITE_URL}/`,
              sameAs: [siteConfig.socialLinks.linkedin.url, siteConfig.socialLinks.github.url],
            }),
          }}
        />
      </Head>
      <Loader>{siteConfig.personalInfo.brandName}.Subbiah</Loader>
      <div className="bg-bglight dark:bg-bgdark overflow-hidden">
        <div className="selection:bg-marrsgreen selection:text-bglight dark:selection:bg-carrigreen dark:selection:text-bgdark">
          <SkipToMain />
          <Header />
          <main id="main">
            <HeroSection />
            <AboutSection />
            <WorkSection />
            <BlogSection posts={blogPosts} />
            <ContactSection />
          </main>
          <SocialLinks page="index" />
          <FloatingBuddy />
          <Footer />
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const blogPosts = getAllPosts([
    "coverImage",
    "coverImageAlt",
    "slug",
    "title",
    "excerpt",
    "datetime",
    "featured",
    "category",
  ]);

  return {
    props: {
      blogPosts,
    },
  };
};

export default Home;
