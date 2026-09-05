// The browser's preflight: every method a route uses must be announced, or
// the call dies as "Failed to fetch" before the Worker sees it.
// Run: node worker/cors.test.mjs
import { corsHeaders } from "./src/index.js";

let pass = 0,
  fail = 0;
function t(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(
    (ok ? "ok   " : "FAIL ") +
      name +
      (ok
        ? ""
        : `
       got  ${JSON.stringify(got)}
       want ${JSON.stringify(want)}`),
  );
  ok ? pass++ : fail++;
}
const h = corsHeaders("https://abizior-coder.github.io", "https://abizior-coder.github.io,http://localhost:5566");
t("the production origin is allowed as itself", h["Access-Control-Allow-Origin"], "https://abizior-coder.github.io");
t(
  "a stranger origin gets the first allowed one, never a wildcard",
  corsHeaders("https://evil.example", "https://abizior-coder.github.io")["Access-Control-Allow-Origin"],
  "https://abizior-coder.github.io",
);
for (const m of ["GET", "POST", "PUT", "DELETE"])
  t(`${m} is announced to the browser`, h["Access-Control-Allow-Methods"].split(/,\s*/).includes(m), true);
t(
  "Authorization and Content-Type are allowed request headers",
  h["Access-Control-Allow-Headers"],
  "Content-Type, Authorization",
);
console.log(`
${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
