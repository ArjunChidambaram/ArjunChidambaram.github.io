import Head from "next/head";
import { siteConfig, SITE_URL } from "config/site.config";

export interface Meta {
  description?: string;
  author?: string;
  siteName?: string;
  coverImage?: string;
  coverImageAlt?: string;
  ogImage?: string;
  ogImageAlt?: string;
  type?: string;
}

type Props = {
  title: string;
  meta?: Meta;
  url?: string;
};

const AppHead: React.FC<Props> = ({
  title,
  url = `${SITE_URL}/blog`,
  meta,
}) => {
  let author: string = siteConfig.personalInfo.fullName;
  let description: string = siteConfig.personalInfo.shortBio;
  let siteName: string = `${siteConfig.personalInfo.fullName}'s Blog`;
  let type: string = "article";
  let coverImage: string | undefined;
  let coverImageAlt: string | undefined;
  let ogImage: string | undefined;
  let ogImageAlt: string | undefined;

  if (meta) {
    author = meta.author ? meta.author : author;
    description = meta.description ? meta.description : description;
    siteName = meta.siteName ? meta.siteName : siteName;
    type = meta.type ? meta.type : type;
    coverImage = meta.coverImage && meta.coverImage;
    coverImageAlt = meta.coverImageAlt && meta.coverImageAlt;
    ogImage = meta.ogImage && meta.ogImage;
    ogImageAlt = meta.ogImageAlt && meta.ogImageAlt;
  }

  let appOgImage = `${SITE_URL}${siteConfig.images.ogImage}`;
  let appOgImageAlt = `${siteConfig.personalInfo.fullName}'s Blog`;

  if (ogImage) {
    appOgImage = ogImage;
  } else if (!ogImage && coverImage) {
    appOgImage = coverImage;
  }

  if (ogImageAlt) {
    appOgImageAlt = ogImageAlt;
  } else if (!ogImageAlt && coverImageAlt) {
    appOgImageAlt = coverImageAlt;
  }

  return (
    <Head>
      <title>{title}</title>
      <meta name="author" content={author} />
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={appOgImage} />
      <meta property="og:image:alt" content={appOgImageAlt} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={appOgImage} />
      <meta name="twitter:image:alt" content={appOgImageAlt} />
      <meta name="keywords" content={siteConfig.siteMetadata.keywords.join(", ")} />
      <link rel="canonical" href={url} />
    </Head>
  );
};

export default AppHead;
