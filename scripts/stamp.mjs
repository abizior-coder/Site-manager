// Stamps content hashes onto the bundle and stylesheet references in
// index.html. Without this, browsers (and the GitHub Pages CDN) happily serve
// a stale bundle after a deploy, so users keep running old code until a hard
// refresh. The chunks the bundle imports carry a hash in their file name
// already, so only the entry and the stylesheet need a stamp.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, statSync } from "node:fs";

const hashOf = (path) => createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, 8);

const bundleHash = hashOf("build/bundle.js");
const cssHash = hashOf("tailwind.css");

const htmlPath = "index.html";
const html = readFileSync(htmlPath, "utf8");
let stamped = html.replace(/(<script type="module" src="build\/bundle\.js)(\?v=[a-f0-9]+)?(")/, `$1?v=${bundleHash}$3`);
stamped = stamped.replace(/(<link rel="stylesheet" href="tailwind\.css)(\?v=[a-f0-9]+)?(")/, `$1?v=${cssHash}$3`);

if (!stamped.includes(`build/bundle.js?v=${bundleHash}`)) {
  console.error("stamp: could not find the build/bundle.js script tag in index.html");
  process.exit(1);
}
if (!stamped.includes(`tailwind.css?v=${cssHash}`)) {
  console.error("stamp: could not find the tailwind.css link in index.html");
  process.exit(1);
}

writeFileSync(htmlPath, stamped);
const kb = (p) => Math.round(statSync(p).size / 1024);
console.log(`stamp: build/bundle.js?v=${bundleHash} (${kb("build/bundle.js")} KB) · tailwind.css?v=${cssHash} (${kb("tailwind.css")} KB)`);
