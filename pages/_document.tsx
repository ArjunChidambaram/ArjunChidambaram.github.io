import { Html, Head, Main, NextScript } from "next/document";
import { siteConfig } from "config/site.config";

const Document = () => {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />

        {/* Favicons */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={siteConfig.images.favicons.appleTouchIcon}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={siteConfig.images.favicons.favicon32}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={siteConfig.images.favicons.favicon16}
        />
        <link rel="shortcut icon" href="/favicons/favicon.ico?v=3" />
        <link rel="manifest" href={siteConfig.images.favicons.manifest} />
        <link
          rel="mask-icon"
          href={siteConfig.images.favicons.safariPinnedTab}
          color="#007A7A"
        />
        <meta name="msapplication-TileColor" content="#007A7A" />
        <meta name="theme-color" content="#007A7A" />

        <link
          href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="bg-bglight dark:bg-bgdark">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};

export default Document;
