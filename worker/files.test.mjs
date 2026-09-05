// The files routes without R2 or Google: a bucket in memory, a sign-in table,
// a membership table. What is pinned down is who may do what and where the
// limits bite -- the parts that would be expensive to learn from a plan
// that vanished. Run: node worker/files.test.mjs
import { handleFiles, refusedType, objectKey, inlineType, MAX_FILE_BYTES } from "./src/files.js";

let pass = 0,
  fail = 0;
function t(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(
    (ok ? "ok   " : "FAIL ") +
      name +
      (ok ? "" : `\n       got  ${JSON.stringify(got)}\n       want ${JSON.stringify(want)}`),
  );
  ok ? pass++ : fail++;
}

// --- fakes ------------------------------------------------------------------
function fakeBucket() {
  const store = new Map();
  return {
    store,
    async put(key, body, opts) {
      store.set(key, {
        body: new Uint8Array(body),
        size: body.byteLength,
        httpMetadata: opts.httpMetadata,
        customMetadata: opts.customMetadata,
      });
    },
    async get(key) {
      const o = store.get(key);
      return o ? { body: o.body, size: o.size, httpMetadata: o.httpMetadata, customMetadata: o.customMetadata } : null;
    },
    async head(key) {
      const o = store.get(key);
      return o ? { size: o.size, customMetadata: o.customMetadata } : null;
    },
    async delete(key) {
      store.delete(key);
    },
  };
}
const TOKENS = { "tok-chef": "u-chef", "tok-crew": "u-crew", "tok-other": "u-other", "tok-crew2": "u-crew2" };
const MEMBERS = { "c1:u-chef": "owner", "c1:u-crew": "crew", "c1:u-crew2": "crew", "c2:u-other": "owner" };
const verify = async (req) => {
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  return TOKENS[token]
    ? { ok: true, uid: TOKENS[token], token }
    : { ok: false, status: 401, error: "sign-in required" };
};
const isMember = async (cid, uid) =>
  MEMBERS[`${cid}:${uid}`] ? { member: true, role: MEMBERS[`${cid}:${uid}`] } : { member: false };

function call(env, method, path, { token, form, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const init = { method, headers };
  if (form) init.body = form;
  if (body) {
    init.body = body;
  }
  return handleFiles({
    request: new Request(`https://w.example${path}`, init),
    env,
    headers: { "Access-Control-Allow-Origin": "*" },
    verify,
    isMember,
  });
}
function pdfForm(name = "plan.pdf", bytes = 3000, kind = "plan", type = "application/pdf") {
  const fd = new FormData();
  fd.append("file", new File([new Uint8Array(bytes)], name, { type }));
  fd.append("kind", kind);
  return fd;
}

// --- type refusal --------------------------------------------------------------
t("a pdf is fine", refusedType("Dach.pdf", "application/pdf"), false);
t("a dwg is fine", refusedType("Dach.dwg", "application/octet-stream"), false);
t("an exe is refused by extension", refusedType("setup.exe", "application/octet-stream"), true);
t("a script is refused by extension", refusedType("run.ps1", "text/plain"), true);
t("an executable is refused by mime", refusedType("thing", "application/x-msdownload"), true);
t("object keys are company-scoped", objectKey("c1", "abc"), "companies/c1/files/abc");
// A page is not a plan. HTML and SVG would run as the app if opened inline.
t("html is refused by extension", refusedType("Plan.html", "application/octet-stream"), true);
t("html is refused by mime even as .pdf", refusedType("Plan.pdf", "text/html"), true);
t("svg is refused", refusedType("logo.svg", "image/svg+xml"), true);
t("xhtml is refused", refusedType("x.xhtml", "application/xhtml+xml"), true);
t("pdf may open inline", inlineType("application/pdf"), "application/pdf");
t("jpeg may open inline", inlineType("image/jpeg"), "image/jpeg");
t(
  "anything else may not",
  [inlineType("text/plain"), inlineType("application/octet-stream"), inlineType("")],
  ["", "", ""],
);

// --- the happy path: upload, open, delete ----------------------------------------
const env = { FILES: fakeBucket() };
{
  const res = await call(env, "POST", "/files/c1/p1", { token: "tok-crew", form: pdfForm("Dach Süd.pdf") });
  t("crew can upload a plan to their company's job", res.status, 201);
  const meta = await res.json();
  t(
    "the upload answers with the file's identity",
    [meta.name, meta.type, meta.kind, meta.projectId, meta.uploadedBy],
    ["Dach Süd.pdf", "application/pdf", "plan", "p1", "u-crew"],
  );
  t("the object lands under the company", env.FILES.store.has(objectKey("c1", meta.id)), true);

  const open = await call(env, "GET", `/files/c1/${meta.id}`, { token: "tok-chef" });
  t("a manager of the same company can open it", open.status, 200);
  t("it comes back as a pdf", open.headers.get("Content-Type"), "application/pdf");
  t(
    "the umlaut in the name survives",
    open.headers.get("Content-Disposition").includes("filename*=UTF-8''Dach%20S%C3%BCd.pdf"),
    true,
  );
  t("it is never cached by a proxy", open.headers.get("Cache-Control"), "private, max-age=0, no-store");
  t(
    "every file response is sandboxed by CSP",
    open.headers.get("Content-Security-Policy"),
    "sandbox; default-src 'none'",
  );

  const stranger = await call(env, "GET", `/files/c1/${meta.id}`, { token: "tok-other" });
  t("a member of another company gets 403, not the plan", stranger.status, 403);
  const nobody = await call(env, "GET", `/files/c1/${meta.id}`, {});
  t("no sign-in, no file", nobody.status, 401);

  const otherCrew = await call(env, "DELETE", `/files/c1/${meta.id}`, { token: "tok-crew2" });
  t("other crew cannot delete what they did not upload", otherCrew.status, 403);
  const uploader = await call(env, "DELETE", `/files/c1/${meta.id}`, { token: "tok-crew" });
  t("the uploader can delete their own file", uploader.status, 204);
  t("and it is gone", env.FILES.store.has(objectKey("c1", meta.id)), false);
}
{
  const res = await call(env, "POST", "/files/c1/p1", { token: "tok-crew", form: pdfForm("offer.pdf", 100, "offer") });
  const meta = await res.json();
  const chef = await call(env, "DELETE", `/files/c1/${meta.id}`, { token: "tok-chef" });
  t("a manager can delete anyone's file", chef.status, 204);
}

// --- limits and refusals ----------------------------------------------------------
{
  // A CAD export is stored as what it is, but handed over as a download with
  // a neutral type -- never rendered.
  const up = await call(env, "POST", "/files/c1/p1", {
    token: "tok-crew",
    form: pdfForm("Dach.dwg", 500, "plan", "application/acad"),
  });
  const meta = await up.json();
  const open = await call(env, "GET", `/files/c1/${meta.id}`, { token: "tok-crew" });
  t("a non-inline type comes back as octet-stream", open.headers.get("Content-Type"), "application/octet-stream");
  t("and as an attachment", open.headers.get("Content-Disposition").startsWith("attachment;"), true);
  const html = await call(env, "POST", "/files/c1/p1", {
    token: "tok-crew",
    form: pdfForm("Plan.pdf", 500, "plan", "text/html"),
  });
  t("an html file named .pdf is refused at upload", html.status, 415);
}
{
  const big = await call(env, "POST", "/files/c1/p1", {
    token: "tok-crew",
    form: pdfForm("huge.pdf", MAX_FILE_BYTES + 1),
  });
  t("over 25 MB is refused with a readable status", big.status, 413);
  const exe = await call(env, "POST", "/files/c1/p1", {
    token: "tok-crew",
    form: pdfForm("setup.exe", 10, "other", "application/octet-stream"),
  });
  t("an executable is refused", exe.status, 415);
  const noFile = await call(env, "POST", "/files/c1/p1", {
    token: "tok-crew",
    form: (() => {
      const f = new FormData();
      f.append("kind", "plan");
      return f;
    })(),
  });
  t("a form without a file is a 400", noFile.status, 400);
  const badPath = await call(env, "GET", "/files/c1", { token: "tok-crew" });
  t("a path without an id is a 404", badPath.status, 404);
  const badId = await call(env, "GET", "/files/c1/../etc", { token: "tok-crew" });
  t("a path with a traversal is refused", [400, 404].includes(badId.status), true);
  const wrongCompany = await call(env, "POST", "/files/c2/p9", { token: "tok-crew", form: pdfForm() });
  t("uploading into another company is 403", wrongCompany.status, 403);
  const unbound = await call({}, "POST", "/files/c1/p1", { token: "tok-crew", form: pdfForm() });
  t("without a bucket bound the Worker says so instead of crashing", unbound.status, 503);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
