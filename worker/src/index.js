import { handleFiles, firestoreMember } from "./files.js";
import { checkLimits } from "./limits.js";
import { handleErrors } from "./errors.js";
import { handleBexio } from "./bexio.js";
import { handleMetrics } from "./metrics.js";

const MODEL = "claude-sonnet-5";
const MAX_IMAGE_BLOCKS = 4;

const FIREBASE_PROJECT_ID = "site-log-ab6a9";
const FIREBASE_API_KEY = "AIzaSyA_pf25-mCaig-HL3mJJSJQfFbXttKnADw";

export function corsHeaders(origin, allowedOrigins) {
  const allowed = (allowedOrigins || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    // PUT is the bexio token; a method missing here fails in the browser as a
    // bare "Failed to fetch" with nothing in the Worker log.
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

// CORS only constrains browsers — curl ignores it entirely, so this endpoint
// was effectively open to anyone who found the URL, spending the account's
// Anthropic credits. Every request must now carry a Firebase ID token.
// Verified against Google's Identity Toolkit rather than checking the
// signature here: one extra call on an operation that already takes seconds,
// in exchange for no key handling or JWKS caching in the Worker.
async function verifyUser(request) {
  const header = request.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return { ok: false, status: 401, error: "sign-in required", code: "auth_required" };

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
  });
  if (!res.ok) return { ok: false, status: 401, error: "invalid or expired sign-in", code: "auth_expired" };

  const data = await res.json().catch(() => null);
  const user = data && data.users && data.users[0];
  if (!user || !user.localId) return { ok: false, status: 401, error: "invalid sign-in", code: "auth_invalid" };
  // The token travels on so the files routes can read Firestore as this user.
  return { ok: true, uid: user.localId, token };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin, env.ALLOWED_ORIGINS);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

    // Usage counts live under /metrics, plans and documents under /files;
    // everything else is the AI proxy.
    if (new URL(request.url).pathname.startsWith("/metrics")) {
      return handleMetrics({
        request,
        env,
        headers,
        verify: verifyUser,
        isMember: (cid, uid, token) => firestoreMember(FIREBASE_PROJECT_ID, cid, uid, token),
      });
    }
    if (new URL(request.url).pathname.startsWith("/bexio")) {
      return handleBexio({
        request,
        env,
        headers,
        verify: verifyUser,
        isMember: (cid, uid, token) => firestoreMember(FIREBASE_PROJECT_ID, cid, uid, token),
      });
    }
    if (new URL(request.url).pathname.startsWith("/errors")) {
      return handleErrors({
        request,
        env,
        headers,
        verify: verifyUser,
        isMember: (cid, uid, token) => firestoreMember(FIREBASE_PROJECT_ID, cid, uid, token),
      });
    }
    if (new URL(request.url).pathname.startsWith("/files")) {
      return handleFiles({
        request,
        env,
        headers,
        verify: verifyUser,
        isMember: (cid, uid, token) => firestoreMember(FIREBASE_PROJECT_ID, cid, uid, token),
      });
    }

    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers });

    const auth = await verifyUser(request);
    if (!auth.ok) return json({ error: auth.error }, auth.status, headers);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid JSON body" }, 400, headers);
    }

    // The call is charged to a company, and only a member of that company
    // may make it. Sign-up is open, so a cap per account is a cap per
    // throwaway account; the cap that protects the bill is the company's.
    const cid = typeof body.companyId === "string" ? body.companyId.trim() : "";
    if (!cid) return json({ error: "company missing" }, 400, headers);
    const membership = await firestoreMember(FIREBASE_PROJECT_ID, cid, auth.uid, auth.token);
    if (!membership.member) return json({ error: "not a member of this company" }, 403, headers);
    const limited = await checkLimits(env.RATE_LIMIT, { uid: auth.uid, cid });
    if (limited) return json({ error: limited.error }, limited.status, headers);

    const content = body && body.content;
    if (!Array.isArray(content) || content.length === 0) {
      return json({ error: "content must be a non-empty array" }, 400, headers);
    }
    if (content.filter((b) => b && b.type === "image").length > MAX_IMAGE_BLOCKS) {
      return json({ error: `too many images (max ${MAX_IMAGE_BLOCKS})` }, 400, headers);
    }
    for (const block of content) {
      if (!block || (block.type !== "image" && block.type !== "text")) {
        return json({ error: "content blocks must be type image or text" }, 400, headers);
      }
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 1000, messages: [{ role: "user", content }] }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text().catch(() => "");
      // Anthropic's error carries no user content; logging it is what makes a
      // 502 diagnosable from `wrangler tail` without asking the person to
      // read a toast aloud.
      console.error(`anthropic ${anthropicRes.status} for ${cid}: ${errText.slice(0, 300)}`);
      return json({ error: `Anthropic API error ${anthropicRes.status}: ${errText.slice(0, 300)}` }, 502, headers);
    }

    const data = await anthropicRes.json();
    return json({ text: (data.content || []).map((b) => b.text || "").join("\n") }, 200, headers);
  },
};
