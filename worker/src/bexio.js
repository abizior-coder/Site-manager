// bexio, connected with a Personal Access Token the owner pastes once. The
// token is checked against bexio, encrypted with a key derived from the
// Worker secret BEXIO_TOKEN_KEY, and kept in KV under the company; the
// browser never stores it. Pushes are idempotent: a customer already in
// bexio is reused, an invoice with the same api_reference is not created
// twice. Everything is injected (KV, sign-in, membership, fetch) so the
// flow runs in a test against a fake bexio.

export const BEXIO_API = "https://api.bexio.com";
export const TOKEN_TTL_DAYS = 60;
export const RENEW_HINT_DAYS = 50;
const SAFE_SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}
const kvKey = (cid) => `bx:${cid}`;
const mapKey = (cid, kind, id) => `bx:${cid}:${kind}:${id}`;

// --- token at rest ------------------------------------------------------------
async function keyFrom(secret) {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(secret)));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function encryptToken(secret, token) {
  const key = await keyFrom(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(token));
  return { iv: b64(iv), enc: b64(enc) };
}
export async function decryptToken(secret, { iv, enc }) {
  const key = await keyFrom(secret);
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, key, unb64(enc));
  return new TextDecoder().decode(dec);
}

// --- pure mapping ----------------------------------------------------------------
const clean = (s, max) =>
  String(s == null ? "" : s)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

// "Dorfstrasse 5\n8903 Birmensdorf" → street, postcode, city.
export function splitAddress(text) {
  const lines = String(text || "")
    .split(/\r?\n|,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  let postcode = "",
    city = "";
  const idx = lines.findIndex((l) => /^(?:CH-)?\d{4}\s+\S/.test(l));
  if (idx >= 0) {
    const m = lines[idx].match(/^(?:CH-)?(\d{4})\s+(.+)$/);
    postcode = m[1];
    city = m[2].trim();
    lines.splice(idx, 1);
  }
  return { address: lines.join(", "), postcode, city };
}

// A Site Log customer as a bexio contact: a company when a company name is
// set, else a person with the whole name in name_1 (Swiss offices write
// both orders; a wrong split is worse than none).
export function contactPayload(customer, userId) {
  const a = splitAddress(customer.address);
  const firma = clean(customer.company, 200);
  const body = {
    contact_type_id: firma ? 1 : 2,
    name_1: firma || clean(customer.name, 200),
    name_2: firma ? clean(customer.name, 200) || undefined : undefined,
    address: a.address || undefined,
    postcode: a.postcode || undefined,
    city: a.city || undefined,
    mail: clean(customer.email, 200) || undefined,
    phone_fixed: clean(customer.phone, 60) || undefined,
    user_id: userId,
    owner_id: userId,
  };
  for (const k of Object.keys(body)) if (body[k] === undefined) delete body[k];
  return body;
}

// The active sales tax whose rate matches ours (8.1, 2.6, 3.8, 0).
export function pickTax(taxes, rate) {
  const want = Math.round((parseFloat(rate) || 0) * 100) / 100;
  const list = (taxes || []).filter((t) => t && t.is_active !== false && (!t.type || /sales/i.test(String(t.type))));
  const exact = list.find((t) => Math.abs((parseFloat(t.value ?? t.percentage) || 0) - want) < 0.005);
  return exact || null;
}

export function positionsOf(doc, taxId) {
  return (doc.lineItems || [])
    .filter((li) => String(li.description || "").trim())
    .map((li) => ({
      type: "KbPositionCustom",
      amount: String(parseFloat(li.qty || 0) || 0),
      unit_price: String(Math.round((parseFloat(li.unitPrice || 0) || 0) * 100) / 100),
      text: clean(li.description, 500) + (li.unit ? ` (${clean(li.unit, 20)})` : ""),
      tax_id: taxId,
    }));
}

export function invoicePayload(doc, contactId, userId, taxId, projectName) {
  return {
    title: clean(projectName || doc.number || "", 80) || undefined,
    contact_id: contactId,
    user_id: userId,
    is_valid_from: doc.date || undefined,
    is_valid_to: doc.dueDate || undefined,
    mwst_type: 1,
    mwst_is_net: true,
    show_position_taxes: true,
    api_reference: String(doc.number || doc.id),
    positions: positionsOf(doc, taxId),
  };
}

// --- bexio calls --------------------------------------------------------------------
async function bx(fetchImpl, token, method, path, body) {
  const res = await fetchImpl(`${BEXIO_API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, ok: res.ok, data };
}

const errText = (r) => {
  const d = r && r.data;
  if (!d) return `bexio ${r ? r.status : "?"}`;
  if (typeof d === "string") return d.slice(0, 300);
  const parts = [d.message, ...(Array.isArray(d.errors) ? d.errors : [])].filter(Boolean).map(String);
  return (parts.join(" · ") || JSON.stringify(d)).slice(0, 300);
};

// --- the handler ------------------------------------------------------------------------
// PUT    /bexio/<cid>/token   { token }                        -- owner
// GET    /bexio/<cid>/status                                    -- owner
// DELETE /bexio/<cid>/token                                     -- owner
// POST   /bexio/<cid>/push    { contacts?, invoices?, projects?, dryRun? } -- owner
export async function handleBexio({ request, env, headers, verify, isMember, fetchImpl = fetch, now = Date.now() }) {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean); // ["bexio", cid, "token"|"status"|"push"]
  if (parts[0] !== "bexio" || parts.length !== 3) return json({ error: "not found" }, 404, headers);
  const [, cid, action] = parts;
  if (!SAFE_SEGMENT.test(cid)) return json({ error: "bad id" }, 400, headers);
  const kv = env.RATE_LIMIT;
  if (!kv) return json({ error: "storage is not configured" }, 503, headers);
  if (!env.BEXIO_TOKEN_KEY) return json({ error: "bexio is not configured: BEXIO_TOKEN_KEY missing" }, 503, headers);

  const auth = await verify(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status, headers);
  const membership = await isMember(cid, auth.uid, auth.token);
  if (!membership.member || membership.role !== "owner") return json({ error: "owners only" }, 403, headers);

  const stored = JSON.parse((await kv.get(kvKey(cid))) || "null");

  if (action === "token" && request.method === "PUT") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid JSON body" }, 400, headers);
    }
    const token = String((body && body.token) || "").trim();
    if (token.length < 20) return json({ error: "token missing" }, 400, headers);
    const me = await bx(fetchImpl, token, "GET", "/3.0/users/me");
    if (!me.ok || !me.data || !me.data.id)
      return json({ error: `bexio refused the token: ${errText(me)}` }, 401, headers);
    const sealed = await encryptToken(env.BEXIO_TOKEN_KEY, token);
    const record = {
      ...sealed,
      userId: me.data.id,
      userName: [me.data.firstname, me.data.lastname].filter(Boolean).join(" ") || me.data.email || String(me.data.id),
      since: now,
    };
    await kv.put(kvKey(cid), JSON.stringify(record));
    return json({ ok: true, status: statusOf(record, now) }, 200, headers);
  }
  if (action === "token" && request.method === "DELETE") {
    await kv.delete(kvKey(cid));
    return json({ ok: true }, 200, headers);
  }
  if (action === "status" && request.method === "GET") {
    return json(stored ? statusOf(stored, now) : { connected: false }, 200, headers);
  }
  if (action === "push" && request.method === "POST") {
    if (!stored) return json({ error: "not connected" }, 409, headers);
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid JSON body" }, 400, headers);
    }
    const token = await decryptToken(env.BEXIO_TOKEN_KEY, stored);
    const dryRun = !!body.dryRun;
    const results = { contacts: [], invoices: [] };
    const projects = new Map((body.projects || []).map((p) => [p.id, p.name]));

    for (const c of (body.contacts || []).slice(0, 200)) {
      const r = await pushContact({ fetchImpl, token, kv, cid, customer: c, userId: stored.userId, dryRun });
      results.contacts.push(r);
      if (r.status === "error" && r.auth) return json({ error: "bexio refused the token", results }, 401, headers);
    }
    if ((body.invoices || []).length) {
      const taxes = dryRun ? { ok: true, data: [] } : await bx(fetchImpl, token, "GET", "/3.0/taxes?scope=active");
      if (!taxes.ok) return json({ error: `taxes: ${errText(taxes)}`, results }, 502, headers);
      for (const inv of body.invoices.slice(0, 100)) {
        const customer = (body.contacts || []).find((c) => c.id === inv.customerId) || inv.customer || null;
        const r = await pushInvoice({
          fetchImpl,
          token,
          kv,
          cid,
          doc: inv,
          customer,
          userId: stored.userId,
          taxes: taxes.data || [],
          dryRun,
          projectName: projects.get(inv.projectId),
        });
        results.invoices.push(r);
      }
    }
    if (!dryRun) await kv.put(kvKey(cid), JSON.stringify({ ...stored, lastPush: now }));
    return json({ ok: true, dryRun, results }, 200, headers);
  }
  return json({ error: "method not allowed" }, 405, headers);
}

function statusOf(record, now) {
  const ageDays = Math.floor((now - (record.since || now)) / 86400000);
  return {
    connected: true,
    user: record.userName,
    since: record.since,
    ageDays,
    renewSoon: ageDays >= RENEW_HINT_DAYS,
    expiresInDays: Math.max(0, TOKEN_TTL_DAYS - ageDays),
    lastPush: record.lastPush || null,
  };
}

async function pushContact({ fetchImpl, token, kv, cid, customer, userId, dryRun }) {
  const payload = contactPayload(customer, userId);
  if (dryRun) return { id: customer.id, status: "dry-run", payload };
  const known = await kv.get(mapKey(cid, "contact", customer.id));
  if (known) return { id: customer.id, bexioId: Number(known), status: "exists" };
  // Already in bexio? Same e-mail first, then the same name.
  const criteria = payload.mail
    ? [{ field: "mail", value: payload.mail, criteria: "=" }]
    : [{ field: "name_1", value: payload.name_1, criteria: "=" }];
  const found = await bx(fetchImpl, token, "POST", "/2.0/contact/search", criteria);
  if (found.status === 401) return { id: customer.id, status: "error", auth: true, error: errText(found) };
  const hit = found.ok && Array.isArray(found.data) ? found.data[0] : null;
  if (hit && hit.id) {
    await kv.put(mapKey(cid, "contact", customer.id), String(hit.id));
    return { id: customer.id, bexioId: hit.id, status: "exists" };
  }
  const created = await bx(fetchImpl, token, "POST", "/2.0/contact", payload);
  if (created.status === 401) return { id: customer.id, status: "error", auth: true, error: errText(created) };
  if (!created.ok || !created.data || !created.data.id)
    return { id: customer.id, status: "error", error: errText(created) };
  await kv.put(mapKey(cid, "contact", customer.id), String(created.data.id));
  return { id: customer.id, bexioId: created.data.id, status: "created" };
}

async function pushInvoice({ fetchImpl, token, kv, cid, doc, customer, userId, taxes, dryRun, projectName }) {
  const tax = pickTax(taxes, doc.vatRate);
  if (dryRun)
    return {
      id: doc.id,
      number: doc.number,
      status: "dry-run",
      payload: invoicePayload(
        doc,
        customer ? `<contact ${customer.id}>` : null,
        userId,
        tax ? tax.id : "<tax>",
        projectName,
      ),
    };
  if (!tax)
    return {
      id: doc.id,
      number: doc.number,
      status: "error",
      error: `no active sales tax with ${doc.vatRate}% in bexio`,
    };
  const known = await kv.get(mapKey(cid, "invoice", doc.id));
  if (known) return { id: doc.id, number: doc.number, bexioId: Number(known), status: "exists" };
  const ref = String(doc.number || doc.id);
  const found = await bx(fetchImpl, token, "POST", "/2.0/kb_invoice/search", [
    { field: "api_reference", value: ref, criteria: "=" },
  ]);
  const hit = found.ok && Array.isArray(found.data) ? found.data[0] : null;
  if (hit && hit.id) {
    await kv.put(mapKey(cid, "invoice", doc.id), String(hit.id));
    return { id: doc.id, number: doc.number, bexioId: hit.id, status: "exists" };
  }
  let contactId = customer ? Number(await kv.get(mapKey(cid, "contact", customer.id))) : 0;
  if (!contactId && customer) {
    const r = await pushContact({ fetchImpl, token, kv, cid, customer, userId, dryRun: false });
    if (r.status === "error") return { id: doc.id, number: doc.number, status: "error", error: `contact: ${r.error}` };
    contactId = r.bexioId;
  }
  if (!contactId) return { id: doc.id, number: doc.number, status: "error", error: "no customer on the invoice" };
  const created = await bx(
    fetchImpl,
    token,
    "POST",
    "/2.0/kb_invoice",
    invoicePayload(doc, contactId, userId, tax.id, projectName),
  );
  if (!created.ok || !created.data || !created.data.id)
    return { id: doc.id, number: doc.number, status: "error", error: errText(created) };
  await kv.put(mapKey(cid, "invoice", doc.id), String(created.data.id));
  return { id: doc.id, number: doc.number, bexioId: created.data.id, status: "created" };
}
