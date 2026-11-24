import { SITE_URL } from "config/site.config";
import Image from "next/image";
import Script from "next/script";
import { GetStaticPaths, GetStaticProps } from "next";
import { useTheme } from "next-themes";

import BlogHeader from "@/components/blog/BlogHeader";
import SkipToMain from "@/components/SkipToMain";
import SocialLinks from "@/components/SocialLinks";
import AppHead, { Meta } from "@/components/AppHead";
import Footer from "@/components/Footer";
import markdownToHtml from "utils/markdownToHtml";
import { getAllPosts, getPostBySlug } from "utils/api";
import PostBody from "@/components/blog/PostBody";
import Tag from "@/components/blog/Tag";
import DateTime from "@/components/DateTime";
import HeadCategory from "@/components/blog/HeadCategory";
import LinearRegressionStory from "@/components/explainers/LinearRegressionStory";
import LogisticRegressionStory from "@/components/explainers/LogisticRegressionStory";
import DecisionTreeStory from "@/components/explainers/DecisionTreeStory";
import RandomForestStory from "@/components/explainers/RandomForestStory";
import SVMStory from "@/components/explainers/SVMStory";
import ProbabilityStory from "@/components/explainers/ProbabilityStory";
import LLNStory from "@/components/explainers/LLNStory";
import CLTStory from "@/components/explainers/CLTStory";
import ABTestStory from "@/components/explainers/ABTestStory";
import BootstrapStory from "@/components/explainers/BootstrapStory";
import Sql01Story from "@/components/sql/Sql01Story";
import Sql02Story from "@/components/sql/Sql02Story";
import Sql03Story from "@/components/sql/Sql03Story";
import Sql04Story from "@/components/sql/Sql04Story";
import Sql05Story from "@/components/sql/Sql05Story";
import Sql06Story from "@/components/sql/Sql06Story";
import Sql07Story from "@/components/sql/Sql07Story";
import Sql08Story from "@/components/sql/Sql08Story";
import Sql09Story from "@/components/sql/Sql09Story";
import Sql10Story from "@/components/sql/Sql10Story";
import Sql11Story from "@/components/sql/Sql11Story";
import Sql12Story from "@/components/sql/Sql12Story";
import Sql13Story from "@/components/sql/Sql13Story";
import { CheatSheet, CheatSheetLink } from "@/components/explainers/CheatSheet";
import { CHEATSHEETS } from "lib/cheatsheets";

// Animated explainers, keyed by the `explainer` field in a post's frontmatter.
const EXPLAINERS: Record<string, { node: JSX.Element }> = {
  "linear-regression": { node: <LinearRegressionStory /> },
  "logistic-regression": { node: <LogisticRegressionStory /> },
  "decision-tree": { node: <DecisionTreeStory /> },
  "random-forest": { node: <RandomForestStory /> },
  svm: { node: <SVMStory /> },
  probability: { node: <ProbabilityStory /> },
  "law-of-large-numbers": { node: <LLNStory /> },
  "central-limit-theorem": { node: <CLTStory /> },
  "ab-testing": { node: <ABTestStory /> },
  bootstrap: { node: <BootstrapStory /> },
  "sql-01": { node: <Sql01Story /> },
  "sql-02": { node: <Sql02Story /> },
  "sql-03": { node: <Sql03Story /> },
  "sql-04": { node: <Sql04Story /> },
  "sql-05": { node: <Sql05Story /> },
  "sql-06": { node: <Sql06Story /> },
  "sql-07": { node: <Sql07Story /> },
  "sql-08": { node: <Sql08Story /> },
  "sql-09": { node: <Sql09Story /> },
  "sql-10": { node: <Sql10Story /> },
  "sql-11": { node: <Sql11Story /> },
  "sql-12": { node: <Sql12Story /> },
  "sql-13": { node: <Sql13Story /> },
};

export interface MdxMeta extends Meta {
  title: string;
  datetime: string;
  excerpt: string;
  slug: string;
  category: string;
  coverImage?: string;
  tags?: string[];
  content: string;
  coverImageWidth?: string;
  coverImageHeight?: string;
  featured: boolean;
  explainer?: string;
  language: "English" | "Myanmar";
}

type Props = {
  post: MdxMeta;
};

const BlogLayout: React.FC<Props> = ({ post }) => {
  const { theme } = useTheme();
  const postUrl = `${SITE_URL}/blog/posts/${post.slug}`;
  return (
    <>
      {/* Facebook Plugin for comment & share */}
      <div id="fb-root"></div>
      <Script
        async
        defer
        crossOrigin="anonymous"
        src="https://connect.facebook.net/en_GB/sdk.js#xfbml=1&version=v13.0&appId=3098460656840262&autoLogAppEvents=1"
        nonce="BwXXZ73U"
      />

      <AppHead
        title={`${post.title} - Arjun Chidambaram Subbiah`}
        url={`${SITE_URL}/blog/posts/${post.slug}`}
        meta={post}
      />
      <div className="bg-bglight dark:bg-bgdark">
        <div className="selection:bg-marrsgreen selection:text-bglight dark:selection:bg-carrigreen dark:selection:text-bgdark">
          <SkipToMain />
          <BlogHeader />
          <SocialLinks />
          <main id="main" className="blog-main">
            <article className="blog-section">
              <h1 className="font-semibold md:font-bold text-3xl md:text-4xl">
                {post.title}
              </h1>
              <div className="mt-2 mb-1 italic text-marrsdark dark:text-carrigreen">
                <DateTime datetime={post.datetime} />
              </div>
              <HeadCategory category={post.category} />
              {post.tags && (
                <div className="my-2">
                  {post.tags.map((tag: string) => (
                    <Tag tag={tag} key={tag} />
                  ))}
                </div>
              )}
              {post.explainer && CHEATSHEETS[post.explainer] && <CheatSheetLink id={post.explainer} />}
              {post.coverImage && (
                <div className="bg-cardlight dark:bg-carddark">
                  <Image
                    src={post.coverImage}
                    alt={post.coverImageAlt || "Picture"}
                    sizes="100vw"
                    style={{ width: "100%", height: "auto" }}
                    priority
                    width={Number(post.coverImageWidth) || 1200}
                    height={Number(post.coverImageHeight) || 700}
                  />
                </div>
              )}
              {post.explainer && EXPLAINERS[post.explainer]?.node}
              {post.explainer && CHEATSHEETS[post.explainer] && (
                <>
                  <h2 className="mt-12 text-2xl font-semibold">Cheat sheet</h2>
                  <CheatSheet sheet={CHEATSHEETS[post.explainer]} />
                </>
              )}
              <PostBody content={post.content} />

              {/* <hr /> */}

              {/* Facebook Comment Plugin */}
              {/* <div
                className="fb-comments my-4"
                data-colorscheme="dark"
                data-href={postUrl}
                data-width="100%"
                data-numposts="5"
              ></div> */}

              {/* Facebook Share Button */}
              <div
                className="fb-share-button my-4"
                data-href={postUrl}
                data-layout="button"
                data-size="large"
              >
                <a
                  rel="noopener noreferrer"
                  target="_blank"
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    postUrl
                  )}&amp;src=sdkpreparse`}
                  className="fb-xfbml-parse-ignore"
                >
                  Share
                </a>
              </div>
            </article>
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const post = getPostBySlug(params!.slug as string, [
    "title",
    "datetime",
    "description",
    "slug",
    "author",
    "content",
    "explainer",
    "ogImage",
    "ogImageAlt",
    "coverImage",
    "coverImageWidth",
    "coverImageHeight",
    "category",
    "tags",
    "type",
  ]);
  const content = await markdownToHtml((post.content as string) || "");

  return {
    props: {
      post: {
        ...post,
        content,
      },
    },
  };
};

export const getStaticPaths: GetStaticPaths = () => {
  const posts = getAllPosts(["slug"]);

  return {
    paths: posts.map((post) => {
      return {
        params: {
          slug: post.slug,
        },
      };
    }),
    fallback: false,
  };
};

export default BlogLayout;
