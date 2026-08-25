// Stamps a content hash onto the bundle.js reference in index.html.
// Without this, browsers (and the GitHub Pages CDN) happily serve a stale
// bundle after a deploy, so users keep running old code until a hard refresh.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const bundle = readFileSync("bundle.js");
const hash = createHash("sha256").update(bundle).digest("hex").slice(0, 8);

const htmlPath = "index.html";
const html = readFileSync(htmlPath, "utf8");
const stamped = html.replace(
  /(<script type="module" src="bundle\.js)(\?v=[a-f0-9]+)?(")/,
  `$1?v=${hash}$3`
);

if (stamped === html && !html.includes(`bundle.js?v=${hash}`)) {
  console.error("stamp: could not find bundle.js script tag in index.html");
  process.exit(1);
}

writeFileSync(htmlPath, stamped);
console.log(`stamp: bundle.js?v=${hash}`);
