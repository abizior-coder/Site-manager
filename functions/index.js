const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-5";
const MAX_IMAGE_BLOCKS = 4;

exports.callClaude = onCall(
  { secrets: [ANTHROPIC_API_KEY], cors: true, timeoutSeconds: 60 },
  async (request) => {
    const content = request.data && request.data.content;
    if (!Array.isArray(content) || content.length === 0) {
      throw new HttpsError("invalid-argument", "content must be a non-empty array");
    }
    const imageBlocks = content.filter((b) => b && b.type === "image");
    if (imageBlocks.length > MAX_IMAGE_BLOCKS) {
      throw new HttpsError("invalid-argument", `too many images (max ${MAX_IMAGE_BLOCKS})`);
    }
    for (const block of content) {
      if (!block || (block.type !== "image" && block.type !== "text")) {
        throw new HttpsError("invalid-argument", "content blocks must be type image or text");
      }
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY.value(),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new HttpsError("internal", `Anthropic API error ${response.status}: ${errText.slice(0, 300)}`);
    }

    const data = await response.json();
    const text = (data.content || []).map((b) => b.text || "").join("\n");
    return { text };
  }
);
