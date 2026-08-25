const MODEL = "claude-sonnet-5";
const MAX_IMAGE_BLOCKS = 4;

function corsHeaders(origin, allowedOrigins) {
  const allowed = allowedOrigins.split(",").map((o) => o.trim());
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin, env.ALLOWED_ORIGINS || "");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "invalid JSON body" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const content = body && body.content;
    if (!Array.isArray(content) || content.length === 0) {
      return new Response(JSON.stringify({ error: "content must be a non-empty array" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    const imageBlocks = content.filter((b) => b && b.type === "image");
    if (imageBlocks.length > MAX_IMAGE_BLOCKS) {
      return new Response(JSON.stringify({ error: `too many images (max ${MAX_IMAGE_BLOCKS})` }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    for (const block of content) {
      if (!block || (block.type !== "image" && block.type !== "text")) {
        return new Response(JSON.stringify({ error: "content blocks must be type image or text" }), {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{ role: "user", content }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text().catch(() => "");
      return new Response(JSON.stringify({ error: `Anthropic API error ${anthropicRes.status}: ${errText.slice(0, 300)}` }), {
        status: 502,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const data = await anthropicRes.json();
    const text = (data.content || []).map((b) => b.text || "").join("\n");

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  },
};
