// src/pages/_document.tsx
import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render(): JSX.Element {
    return (
      <Html lang="en">
        <Head>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
          />
          <style>{`body { margin: 0; }`}</style>
          <script type="importmap" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            imports: {
              "three": "//unpkg.com/three/build/three.module.js",
              "three/addons/": "//unpkg.com/three/examples/jsm/"
            }
          }) }} />
          <script type="module" dangerouslySetInnerHTML={{
            __html: `
              import * as THREE from 'three';
              window.THREE = THREE;
            `,
          }} />
          <script src="https://unpkg.com/three-globe" defer></script>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
