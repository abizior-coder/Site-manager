const MODEL = "claude-sonnet-5";
const MAX_IMAGE_BLOCKS = 4;
const DAILY_LIMIT = 200; // scans per account per day, when KV is bound

const FIREBASE_PROJECT_ID = "site-log-ab6a9";
const FIREBASE_API_KEY = "AIzaSyA_pf25-mCaig-HL3mJJSJQfFbXttKnADw";

function corsHeaders(origin, allowedOrigins) {
  const allowed = (allowedOrigins || "").split(",").map((o) => o.trim()).filter(Boolean);
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
  if (!token) return { ok: false, status: 401, error: "sign-in required" };

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    }
  );
  if (!res.ok) return { ok: false, status: 401, error: "invalid or expired sign-in" };

  const data = await res.json().catch(() => null);
  const user = data && data.users && data.users[0];
  if (!user || !user.localId) return { ok: false, status: 401, error: "invalid sign-in" };
  return { ok: true, uid: user.localId };
}

// Per-account daily cap. A valid account is now required, but sign-up is open,
// so a determined abuser could still register and hammer the endpoint.
// Enforced only when a KV namespace is bound, so the Worker stays deployable
// without one; add the binding to turn the cap on.
async function overDailyLimit(env, uid) {
  if (!env.RATE_LIMIT) return false;
  const key = `${uid}:${new Date().toISOString().slice(0, 10)}`;
  const used = parseInt((await env.RATE_LIMIT.get(key)) || "0", 10);
  if (used >= DAILY_LIMIT) return true;
  // Expires a day after the window it counts, so old counters clean themselves.
  await env.RATE_LIMIT.put(key, String(used + 1), { expirationTtl: 172800 });
  return false;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin, env.ALLOWED_ORIGINS);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers });

    const auth = await verifyUser(request);
    if (!auth.ok) return json({ error: auth.error }, auth.status, headers);

    if (await overDailyLimit(env, auth.uid)) {
      return json({ error: "daily scan limit reached — try again tomorrow" }, 429, headers);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid JSON body" }, 400, headers);
    }

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
      return json({ error: `Anthropic API error ${anthropicRes.status}: ${errText.slice(0, 300)}` }, 502, headers);
    }

    const data = await anthropicRes.json();
    return json({ text: (data.content || []).map((b) => b.text || "").join("\n") }, 200, headers);
  },
};
