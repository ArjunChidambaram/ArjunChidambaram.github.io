import type { NextPage } from "next";

const Test: NextPage = () => {
  return (
    <div style={{ padding: '20px', fontSize: '24px', fontFamily: 'Arial' }}>
      <h1>Test Page</h1>
      <p>This is a simple test page to verify the server is working.</p>
      <p>If you can see this, the Next.js server is running correctly.</p>
      <style jsx>{`
        div {
          background-color: #f0f0f0;
          min-height: 100vh;
        }
        h1 {
          color: #333;
        }
      `}</style>
    </div>
  );
};

export default Test;
