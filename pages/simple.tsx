import type { NextPage } from "next";
import Head from "next/head";

const SimpleHome: NextPage = () => {
  return (
    <>
      <Head>
        <title>Simple Home Test</title>
      </Head>
      <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <h1 style={{ color: '#333', fontSize: '2rem', marginBottom: '20px' }}>
          Homepage Test
        </h1>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>
          This is a simplified version of the homepage to test if the basic structure works.
        </p>
        <p style={{ fontSize: '1rem', color: '#666' }}>
          If you can see this, the basic Next.js routing is working correctly.
        </p>
      </div>
    </>
  );
};

export default SimpleHome;
