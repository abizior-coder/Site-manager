// Plans and documents on a job, stored in R2 behind the same sign-in the AI
// proxy uses.
//
// The Worker never trusts the company id the client sends. Membership is
// checked on every request by reading the member document *as that user*
// through the Firestore REST API: the security rules decide, no service
// account is involved, and a token from another company gets 403 from
// Firestore before it gets anywhere near a plan.
//
// Everything that touches the network is injected (verify, isMember, the
// bucket), so the routing, the limits and the authorisation can be tested
// without R2 or Google.

export const MAX_FILE_BYTES = 25 * 1024 * 1024;

// Nothing that a phone or a desk could run. Plans, scans, photos, office
// documents and CAD exports all pass; the list is what gets refused.
// Also refused: anything a browser would *render as a page*. An HTML or SVG
// "plan" opened inline would run as the app itself.
const REFUSED_EXT =
  /\.(exe|msi|bat|cmd|com|scr|pif|vbs|vbe|js|jse|wsf|wsh|ps1|psm1|sh|apk|jar|dll|cpl|hta|lnk|reg|html?|xhtml|mhtml?|svgz?)$/i;
const REFUSED_MIME =
  /^(application\/(x-msdownload|x-msdos-program|x-sh|x-shellscript|java-archive|vnd\.android\.package-archive|x-executable|xhtml\+xml)|text\/(javascript|html)|image\/svg\+xml)/i;

// What may open inline. Everything else is handed over as a download with a
// neutral type, whatever the uploader claimed it was.
const INLINE_MIME = /^(application\/pdf|image\/(jpeg|png|gif|webp|heic|heif|bmp))$/i;
export function inlineType(type) {
  return INLINE_MIME.test(type || "") ? type : "";
}

export function refusedType(name, type) {
  return REFUSED_EXT.test(name || "") || REFUSED_MIME.test(type || "");
}

function newId() {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Object keys are company-scoped so a bucket listing, if one ever leaks,
// still cannot be mistaken for another firm's plans.
export function objectKey(cid, id) {
  return `companies/${cid}/files/${id}`;
}

const SAFE_SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

// Reads the caller's membership as the caller. 200 means the rules let this
// user read that member document, which only a member can.
export async function firestoreMember(projectId, cid, uid, token) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/companies/${encodeURIComponent(cid)}/members/${encodeURIComponent(uid)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return { member: false };
  const doc = await res.json().catch(() => null);
  const role = doc && doc.fields && doc.fields.role && doc.fields.role.stringValue;
  const active = doc && doc.fields && doc.fields.active && doc.fields.active.booleanValue;
  if (active === false) return { member: false };
  return { member: true, role: role || "crew" };
}

export async function handleFiles({ request, env, headers, verify, isMember }) {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean); // ["files", cid, idOrPid]
  if (parts[0] !== "files" || parts.length !== 3) return json({ error: "not found" }, 404, headers);
  const cid = parts[1];
  const third = parts[2];
  if (!SAFE_SEGMENT.test(cid) || !SAFE_SEGMENT.test(third)) return json({ error: "bad id" }, 400, headers);

  const bucket = env.FILES;
  if (!bucket) return json({ error: "file storage is not configured" }, 503, headers);

  const auth = await verify(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status, headers);

  const membership = await isMember(cid, auth.uid, auth.token);
  if (!membership.member) return json({ error: "not a member of this company" }, 403, headers);
  const manages = membership.role === "owner" || membership.role === "supervisor";

  // --- upload: POST /files/{cid}/{projectId} ---------------------------------
  if (request.method === "POST") {
    const declared = parseInt(request.headers.get("Content-Length") || "0", 10);
    if (declared > MAX_FILE_BYTES + 4096) return json({ error: "file too large (max 25 MB)" }, 413, headers);

    let form;
    try {
      form = await request.formData();
    } catch {
      return json({ error: "expected multipart form data" }, 400, headers);
    }
    const file = form.get("file");
    if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function")
      return json({ error: "missing file field" }, 400, headers);

    const name = String(file.name || "file").slice(0, 200);
    const type = String(file.type || "application/octet-stream").slice(0, 120);
    if (file.size > MAX_FILE_BYTES) return json({ error: "file too large (max 25 MB)" }, 413, headers);
    if (refusedType(name, type)) return json({ error: "this file type is not allowed" }, 415, headers);

    const id = newId();
    const kind = String(form.get("kind") || "other").slice(0, 20);
    await bucket.put(objectKey(cid, id), await file.arrayBuffer(), {
      httpMetadata: { contentType: type },
      customMetadata: { name, projectId: third, uploadedBy: auth.uid, kind, createdAt: String(Date.now()) },
    });
    return json({ id, name, size: file.size, type, kind, projectId: third, uploadedBy: auth.uid }, 201, headers);
  }

  // --- open: GET /files/{cid}/{id} ---------------------------------------------
  if (request.method === "GET") {
    const obj = await bucket.get(objectKey(cid, third));
    if (!obj) return json({ error: "not found" }, 404, headers);
    const meta = obj.customMetadata || {};
    const stored = (obj.httpMetadata && obj.httpMetadata.contentType) || "";
    const safe = inlineType(stored);
    // ASCII fallback plus RFC 5987 so an umlaut in the plan's name survives.
    const ascii = String(meta.name || "file")
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/"/g, "");
    const fname = `filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(meta.name || "file")}`;
    return new Response(obj.body, {
      status: 200,
      headers: {
        ...headers,
        "Content-Type": safe || "application/octet-stream",
        "Content-Length": String(obj.size),
        "Content-Disposition": `${safe ? "inline" : "attachment"}; ${fname}`,
        "Cache-Control": "private, max-age=0, no-store",
        "X-Content-Type-Options": "nosniff",
        // Even if a browser ever navigated straight to this response, nothing
        // in it may run or reach anything.
        "Content-Security-Policy": "sandbox; default-src 'none'",
      },
    });
  }

  // --- remove: DELETE /files/{cid}/{id} ---------------------------------------
  if (request.method === "DELETE") {
    const key = objectKey(cid, third);
    const obj = await bucket.head(key);
    if (!obj) return json({ error: "not found" }, 404, headers);
    const uploadedBy = (obj.customMetadata || {}).uploadedBy;
    if (!manages && uploadedBy !== auth.uid)
      return json({ error: "only a manager or the uploader can delete this" }, 403, headers);
    await bucket.delete(key);
    return new Response(null, { status: 204, headers });
  }

  return json({ error: "method not allowed" }, 405, headers);
}
