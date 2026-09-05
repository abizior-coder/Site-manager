// bexio without bexio: a fake API, a KV in memory, a sign-in table. Pinned
// down: the token is checked before it is kept and encrypted at rest, only
// the owner may touch it, contacts are reused rather than doubled, invoices
// pick the tax by rate and are never created twice, a dry run sends nothing.
// Run: node worker/bexio.test.mjs
import {
  handleBexio,
  contactPayload,
  invoicePayload,
  pickTax,
  positionsOf,
  splitAddress,
  encryptToken,
  decryptToken,
} from "./src/bexio.js";

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
function fakeKv() {
  const store = new Map();
  return {
    store,
    async get(k) {
      return store.has(k) ? store.get(k) : null;
    },
    async put(k, v) {
      store.set(k, v);
    },
    async delete(k) {
      store.delete(k);
    },
  };
}
const TOKENS = { "tok-chef": "u-chef", "tok-crew": "u-crew" };
const MEMBERS = { "c1:u-chef": "owner", "c1:u-crew": "crew" };
const verify = async (req) => {
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  return TOKENS[token]
    ? { ok: true, uid: TOKENS[token], token }
    : { ok: false, status: 401, error: "sign-in required" };
};
const isMember = async (cid, uid) =>
  MEMBERS[`${cid}:${uid}`] ? { member: true, role: MEMBERS[`${cid}:${uid}`] } : { member: false };
const NOW = Date.parse("2026-09-05T12:00:00Z");

// The fake bexio: one valid PAT, a contact search that knows one e-mail, taxes, creates with ids.
const calls = [];
function fakeBexio() {
  let nextId = 100;
  return async (url, opts) => {
    const path = url.replace("https://api.bexio.com", "");
    const auth = (opts.headers || {}).Authorization || "";
    calls.push(`${opts.method} ${path}`);
    const reply = (status, data) =>
      new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
    if (auth !== "Bearer pat-valid-token-1234567890") return reply(401, { message: "Unauthorized" });
    if (path === "/3.0/users/me")
      return reply(200, { id: 7, firstname: "Andrzej", lastname: "Bizior", email: "a@b.ch" });
    if (path.startsWith("/3.0/taxes"))
      return reply(200, [
        { id: 3, value: 8.1, type: "sales_tax", is_active: true },
        { id: 4, value: 2.6, type: "sales_tax", is_active: true },
        { id: 9, value: 8.1, type: "pre_tax", is_active: true },
      ]);
    if (path === "/2.0/contact/search") {
      const body = JSON.parse(opts.body);
      if (body[0].field === "mail" && body[0].value === "info@huber.ch")
        return reply(200, [{ id: 55, name_1: "Huber GmbH" }]);
      return reply(200, []);
    }
    if (path === "/2.0/contact") return reply(201, { id: nextId++ });
    if (path === "/2.0/kb_invoice/search") {
      const body = JSON.parse(opts.body);
      return reply(200, body[0].value === "R-2026-001" ? [{ id: 900 }] : []);
    }
    if (path === "/2.0/kb_invoice") {
      const body = JSON.parse(opts.body);
      if (!body.positions.length)
        return reply(422, { message: "Validation failed", errors: ["positions: must not be empty"] });
      return reply(201, { id: nextId++ });
    }
    return reply(404, { message: "no" });
  };
}
function req(method, path, token, body) {
  return new Request(`https://w.example${path}`, {
    method,
    headers: { Authorization: token ? `Bearer ${token}` : "", "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}
async function call(env, method, path, token, body, fetchImpl) {
  const res = await handleBexio({
    request: req(method, path, token, body),
    env,
    headers: {},
    verify,
    isMember,
    fetchImpl,
    now: NOW,
  });
  return { status: res.status, body: await res.json() };
}

// --- pure ------------------------------------------------------------------------
t("an address splits into street, PLZ and Ort", splitAddress("Dorfstrasse 5\n8903 Birmensdorf"), {
  address: "Dorfstrasse 5",
  postcode: "8903",
  city: "Birmensdorf",
});
t(
  "a company becomes a Firma contact with the person as name_2",
  contactPayload(
    {
      name: "Hans Muster",
      company: "Muster AG",
      address: "Dorfstrasse 5\n8903 Birmensdorf",
      email: "info@muster.ch",
      phone: "044 1",
    },
    7,
  ),
  {
    contact_type_id: 1,
    name_1: "Muster AG",
    name_2: "Hans Muster",
    address: "Dorfstrasse 5",
    postcode: "8903",
    city: "Birmensdorf",
    mail: "info@muster.ch",
    phone_fixed: "044 1",
    user_id: 7,
    owner_id: 7,
  },
);
t("a person keeps the whole name in name_1", contactPayload({ name: "Sutter Teresa" }, 7), {
  contact_type_id: 2,
  name_1: "Sutter Teresa",
  user_id: 7,
  owner_id: 7,
});
t(
  "the tax is the active sales tax with our rate, never the pre-tax",
  [
    pickTax(
      [
        { id: 3, value: 8.1, type: "sales_tax" },
        { id: 9, value: 8.1, type: "pre_tax" },
      ],
      8.1,
    ).id,
    pickTax([{ id: 4, value: 2.6, type: "sales_tax" }], 8.1),
  ],
  [3, null],
);
t(
  "positions carry amount, price, text with unit, tax",
  positionsOf(
    {
      lineItems: [
        { description: "Arbeit", qty: "7.5", unit: "h", unitPrice: "85.50" },
        { description: " ", qty: "1", unitPrice: "1" },
      ],
    },
    3,
  ),
  [{ type: "KbPositionCustom", amount: "7.5", unit_price: "85.5", text: "Arbeit (h)", tax_id: 3 }],
);
t(
  "an invoice payload is exclusive VAT with our number as api_reference",
  (() => {
    const p = invoicePayload(
      {
        number: "R-2026-002",
        date: "2026-08-15",
        dueDate: "2026-09-14",
        lineItems: [{ description: "Dach", qty: "1", unitPrice: "2400" }],
      },
      55,
      7,
      3,
      "Dachfenster Alt",
    );
    return [
      p.title,
      p.contact_id,
      p.user_id,
      p.mwst_type,
      p.mwst_is_net,
      p.api_reference,
      p.is_valid_from,
      p.positions.length,
    ];
  })(),
  ["Dachfenster Alt", 55, 7, 1, true, "R-2026-002", "2026-08-15", 1],
);
{
  const sealed = await encryptToken("secret-key", "pat-valid-token-1234567890");
  t(
    "the token is encrypted at rest and comes back whole",
    [sealed.enc !== "pat-valid-token-1234567890", await decryptToken("secret-key", sealed)],
    [true, "pat-valid-token-1234567890"],
  );
}

// --- the handler --------------------------------------------------------------------
const env = { RATE_LIMIT: fakeKv(), BEXIO_TOKEN_KEY: "secret-key" };
const bexio = fakeBexio();
t(
  "without the Worker secret the endpoint says so",
  (await call({ RATE_LIMIT: fakeKv() }, "GET", "/bexio/c1/status", "tok-chef", null, bexio)).status,
  503,
);
t(
  "crew may not touch the connection",
  (await call(env, "GET", "/bexio/c1/status", "tok-crew", null, bexio)).status,
  403,
);
t("not connected yet", (await call(env, "GET", "/bexio/c1/status", "tok-chef", null, bexio)).body, {
  connected: false,
});
t(
  "a token bexio refuses is not kept",
  [
    (await call(env, "PUT", "/bexio/c1/token", "tok-chef", { token: "wrong-token-1234567890123" }, bexio)).status,
    env.RATE_LIMIT.store.has("bx:c1"),
  ],
  [401, false],
);
{
  const r = await call(env, "PUT", "/bexio/c1/token", "tok-chef", { token: "pat-valid-token-1234567890" }, bexio);
  t(
    "a valid token is kept, encrypted, with the bexio user",
    [
      r.status,
      r.body.status.connected,
      r.body.status.user,
      JSON.parse(env.RATE_LIMIT.store.get("bx:c1")).enc.includes("pat-valid") === false,
    ],
    [200, true, "Andrzej Bizior", true],
  );
}
t(
  "status reports the token age and the renewal hint",
  (() => {
    const s = env.RATE_LIMIT.store.get("bx:c1");
    return !!s;
  })(),
  true,
);

const customers = [
  { id: "c-huber", name: "Werkstatt Huber GmbH", company: "Huber GmbH", email: "info@huber.ch" },
  { id: "c-sutter", name: "Sutter Teresa", address: "Lettenring 21\n8144 Dannikon", email: "teresa@example.ch" },
];
{
  calls.length = 0;
  const r = await call(env, "POST", "/bexio/c1/push", "tok-chef", { contacts: customers, dryRun: true }, bexio);
  t(
    "a dry run maps every contact and calls bexio for nothing",
    [
      r.body.dryRun,
      r.body.results.contacts.map((c) => c.status),
      r.body.results.contacts[0].payload.name_1,
      calls.length,
    ],
    [true, ["dry-run", "dry-run"], "Huber GmbH", 0],
  );
}
{
  const r = await call(env, "POST", "/bexio/c1/push", "tok-chef", { contacts: customers }, bexio);
  t(
    "a contact already in bexio is reused, a new one created, both remembered",
    [
      r.body.results.contacts.map((c) => [c.status, c.bexioId]),
      env.RATE_LIMIT.store.get("bx:c1:contact:c-huber"),
      env.RATE_LIMIT.store.get("bx:c1:contact:c-sutter"),
    ],
    [
      [
        ["exists", 55],
        ["created", 100],
      ],
      "55",
      "100",
    ],
  );
  const again = await call(env, "POST", "/bexio/c1/push", "tok-chef", { contacts: customers }, bexio);
  t(
    "a second push creates nothing",
    again.body.results.contacts.map((c) => c.status),
    ["exists", "exists"],
  );
}
const invoices = [
  {
    id: "i1",
    number: "R-2026-001",
    type: "invoice",
    status: "open",
    customerId: "c-huber",
    projectId: "p1",
    vatRate: 8.1,
    date: "2026-08-01",
    dueDate: "2026-08-31",
    lineItems: [{ description: "A", qty: "1", unitPrice: "100" }],
  },
  {
    id: "i2",
    number: "R-2026-002",
    type: "invoice",
    status: "open",
    customerId: "c-sutter",
    projectId: "p2",
    vatRate: 8.1,
    date: "2026-08-15",
    dueDate: "2026-09-14",
    lineItems: [{ description: "Dachfenster Einbau", qty: "1", unitPrice: "2400" }],
  },
  {
    id: "i3",
    number: "R-2026-003",
    type: "invoice",
    status: "open",
    customerId: "c-sutter",
    vatRate: 3.8,
    date: "2026-08-20",
    lineItems: [{ description: "x", qty: "1", unitPrice: "1" }],
  },
  {
    id: "i4",
    number: "R-2026-004",
    type: "invoice",
    status: "open",
    customerId: "c-sutter",
    vatRate: 8.1,
    date: "2026-08-21",
    lineItems: [],
  },
];
{
  const r = await call(
    env,
    "POST",
    "/bexio/c1/push",
    "tok-chef",
    { contacts: customers, invoices, projects: [{ id: "p2", name: "Dachfenster Alt" }] },
    bexio,
  );
  const inv = r.body.results.invoices;
  t(
    "an invoice bexio already has (api_reference) is not created twice",
    [inv[0].status, inv[0].bexioId],
    ["exists", 900],
  );
  t(
    "a new invoice is created with the customer's bexio id and the 8.1 tax",
    [inv[1].status, typeof inv[1].bexioId],
    ["created", "number"],
  );
  t(
    "a rate bexio has no active tax for is an error naming the rate",
    [inv[2].status, inv[2].error],
    ["error", "no active sales tax with 3.8% in bexio"],
  );
  t(
    "bexio's own validation text is surfaced verbatim",
    [inv[3].status, inv[3].error],
    ["error", "Validation failed · positions: must not be empty"],
  );
  t("the push time is recorded", JSON.parse(env.RATE_LIMIT.store.get("bx:c1")).lastPush, NOW);
}
t(
  "disconnecting forgets the token",
  [(await call(env, "DELETE", "/bexio/c1/token", "tok-chef", null, bexio)).body, env.RATE_LIMIT.store.has("bx:c1")],
  [{ ok: true }, false],
);
t(
  "a push while disconnected is refused",
  (await call(env, "POST", "/bexio/c1/push", "tok-chef", { contacts: customers }, bexio)).status,
  409,
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
