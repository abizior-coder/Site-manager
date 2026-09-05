// Seeds the local emulators with a company, three roles and representative
// data, so the real UI can be driven end-to-end as each role.
//
// Everything here is disposable localhost fixture data. It never touches the
// production project and involves no real account.
//
//   npm run seed

import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, doc, setDoc, writeBatch } from "firebase/firestore";

const app = initializeApp({ projectId: "site-log-ab6a9", apiKey: "fake-api-key" });
const auth = getAuth(app);
const db = getFirestore(app);
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
connectFirestoreEmulator(db, "127.0.0.1", 8080);

const PROJECT = "site-log-ab6a9";

// Wipe first, so a run never depends on what a previous one left behind —
// a used invite code, for instance, cannot be recreated.
async function resetEmulators() {
  const targets = [
    `http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
    `http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/accounts`,
  ];
  for (const url of targets) {
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) throw new Error(`could not reset emulator: ${url} -> ${res.status}`);
  }
  console.log("emulators cleared");
}

const PASSWORD = "test1234";
const PEOPLE = [
  { key: "chef", email: "chef@test.local", name: "Chef Muster", role: "owner" },
  { key: "polier", email: "polier@test.local", name: "Polier Meier", role: "supervisor" },
  { key: "crew1", email: "crew1@test.local", name: "Hans Arbeiter", role: "crew" },
  { key: "crew2", email: "crew2@test.local", name: "Peter Helfer", role: "crew" },
];

async function ensureUser(email) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, PASSWORD);
    return cred.user.uid;
  } catch (e) {
    if (String(e.code).includes("email-already-in-use")) {
      const cred = await signInWithEmailAndPassword(auth, email, PASSWORD);
      return cred.user.uid;
    }
    throw e;
  }
}

const today = new Date().toISOString().slice(0, 10);
const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

await resetEmulators();

console.log("creating accounts…");
const uids = {};
for (const p of PEOPLE) {
  uids[p.key] = await ensureUser(p.email);
  console.log(`  ${p.email} -> ${uids[p.key]}`);
}

// Everything below is written while signed in as the owner, so it goes
// through the same rules a real owner would — if the rules are wrong, seeding
// fails rather than quietly succeeding.
await signOut(auth);
await signInWithEmailAndPassword(auth, "chef@test.local", PASSWORD);

const CID = "test-company";
console.log("seeding company…");
await setDoc(doc(db, "companies", CID), {
  name: "Muster Bedachungen AG",
  ownerUid: uids.chef,
  createdAt: Date.now(),
  publicSettings: { currency: "CHF" },
});

// The owner creates only their own membership; everyone else joins by
// redeeming an invite. The rules enforce that, so seeding has to follow the
// real flow — which means this also exercises invites end-to-end.
await setDoc(doc(db, "companies", CID, "members", uids.chef), {
  role: "owner",
  name: "Chef Muster",
  email: "chef@test.local",
  active: true,
  joinedAt: Date.now(),
});
await setDoc(doc(db, "users", uids.chef), { companyId: CID, displayName: "Chef Muster" });

for (const p of PEOPLE.filter((x) => x.key !== "chef")) {
  const code = `SEED${p.key.toUpperCase()}`;
  await signInWithEmailAndPassword(auth, "chef@test.local", PASSWORD);
  await setDoc(doc(db, "invites", code), {
    companyId: CID,
    role: p.role,
    expiresAt: Date.now() + 86400000,
    createdAt: Date.now(),
    usedBy: null,
  });

  await signOut(auth);
  await signInWithEmailAndPassword(auth, p.email, PASSWORD);
  // One batch, like the app: the rules let a code be redeemed only together
  // with the membership it creates.
  const join = writeBatch(db);
  join.set(doc(db, "companies", CID, "members", uids[p.key]), {
    role: p.role,
    name: p.name,
    email: p.email,
    active: true,
    joinedAt: Date.now(),
    inviteCode: code,
  });
  join.set(doc(db, "users", uids[p.key]), { companyId: CID, displayName: p.name });
  join.update(doc(db, "invites", code), { usedBy: uids[p.key] });
  await join.commit();
  console.log(`  ${p.email} joined as ${p.role}`);
}

await signOut(auth);
await signInWithEmailAndPassword(auth, "chef@test.local", PASSWORD);

await setDoc(doc(db, "companies", CID, "private", "finance"), {
  companyName: "Muster Bedachungen AG",
  street: "Musterstrasse",
  buildingNumber: "12",
  postalCode: "8000",
  town: "Zürich",
  country: "CH",
  iban: "CH9300762011623852957",
  vatNumber: "CHE-123.456.789",
  labourRate: "85",
  currency: "CHF",
  paymentDays: "30",
  defaultVatKey: "standard",
});

const projects = [
  {
    id: "p1",
    name: "Steildach Lettenring",
    customerId: "c1",
    client: "",
    address: "Lettenring 21, 8144 Dannikon",
    category: "pitched",
    status: "construction",
    quotedAmount: "12500",
  },
  {
    id: "p2",
    name: "Flachdach Werkstatt",
    customerId: "c2",
    client: "",
    address: "Industriestrasse 4, 8600 Dübendorf",
    category: "flat",
    status: "quoted",
  },
  {
    id: "p3",
    name: "Fassade Birmensdorf",
    customerId: "c1",
    client: "",
    address: "Schürenstrasse 7, Birmensdorf",
    category: "facade",
    status: "lead",
  },
  {
    id: "p4",
    name: "Dachfenster Alt",
    customerId: "c2",
    client: "",
    address: "Alte Gasse 1",
    category: "pitched",
    status: "completed",
  },
];
for (const p of projects) await setDoc(doc(db, "companies", CID, "projects", p.id), p);

const customers = [
  {
    id: "c1",
    name: "Sutter Teresa",
    company: "",
    phone: "+41 79 123 45 67",
    email: "teresa@example.ch",
    address: "Lettenring 21, 8144 Dannikon",
    notes: "Bevorzugt Anrufe am Morgen.",
    contacts: [
      {
        id: "k1",
        kind: "call",
        note: "Termin für Offerte vereinbart",
        followUp: day(-3),
        at: Date.now() - 86400000 * 5,
      },
      {
        id: "k2",
        kind: "visit",
        note: "Dach besichtigt, Ziegel teilweise defekt",
        followUp: "",
        at: Date.now() - 86400000 * 4,
      },
    ],
  },
  {
    id: "c2",
    name: "Werkstatt Huber GmbH",
    company: "Huber GmbH",
    phone: "+41 44 987 65 43",
    email: "info@huber.ch",
    address: "Industriestrasse 4, 8600 Dübendorf",
    notes: "",
    contacts: [],
  },
];
for (const c of customers) await setDoc(doc(db, "companies", CID, "customers", c.id), c);

const entries = [
  {
    id: "e1",
    type: "time",
    projectId: "p1",
    date: today,
    qty: "7.5",
    unit: "h",
    description: "7h 30m",
    userId: uids.crew1,
    startTime: "07:00",
    endTime: "15:30",
  },
  {
    id: "e2",
    type: "time",
    projectId: "p1",
    date: day(-1),
    qty: "8",
    unit: "h",
    description: "8h 0m",
    userId: uids.crew1,
    approvedBy: uids.polier,
    approvedAt: Date.now(),
  },
  {
    id: "e3",
    type: "time",
    projectId: "p1",
    date: today,
    qty: "6",
    unit: "h",
    description: "6h 0m",
    userId: uids.crew2,
  },
  {
    id: "e4",
    type: "material",
    projectId: "p1",
    date: today,
    qty: "24",
    unit: "m2",
    description: "Ziegel Frankfurter Pfanne",
    unitPrice: "18.50",
    userId: uids.crew1,
  },
  {
    id: "e5",
    type: "material",
    projectId: "p1",
    date: today,
    qty: "8",
    unit: "m",
    description: "Siga Risan",
    unitPrice: "12.50",
    userId: uids.crew1,
  },
  {
    id: "e6",
    type: "material",
    projectId: "p1",
    date: today,
    qty: "3",
    unit: "Stk",
    description: "Ohne Preis erfasst",
    userId: uids.crew2,
  },
  {
    id: "e7",
    type: "tool",
    projectId: "p1",
    date: today,
    qty: "1",
    unit: "",
    description: "Bauaufzug",
    unitPrice: "120",
    userId: uids.crew1,
  },
  {
    id: "e8",
    type: "note",
    projectId: "p1",
    date: today,
    description: "Regen ab 14:00, Arbeit unterbrochen",
    userId: uids.crew2,
  },
  {
    id: "e9",
    type: "time",
    projectId: "p2",
    date: day(-2),
    qty: "4",
    unit: "h",
    description: "4h 0m",
    userId: uids.polier,
  },
];
// Entries can only be created by the person they belong to — the rules
// reject an entry attributed to someone else — so sign in as each author.
const emailByUid = Object.fromEntries(PEOPLE.map((p) => [uids[p.key], p.email]));
for (const e of entries) {
  await signOut(auth);
  await signInWithEmailAndPassword(auth, emailByUid[e.userId], PASSWORD);
  await setDoc(doc(db, "companies", CID, "entries", e.id), e);
}
await signOut(auth);
await signInWithEmailAndPassword(auth, "chef@test.local", PASSWORD);

const documents = [
  {
    id: "d1",
    type: "invoice",
    projectId: "p1",
    customerId: "c1",
    number: "R-2026-001",
    date: day(-40),
    dueDate: day(-10),
    status: "open",
    paidAmount: "",
    paidDate: "",
    lineItems: [
      { id: "li1", description: "Arbeit", qty: "60", unit: "h", unitPrice: "85" },
      { id: "li2", description: "Ziegel", qty: "120", unit: "m2", unitPrice: "18.50" },
    ],
    vatRate: 8.1,
    notes: "",
  },
  {
    id: "d2",
    type: "invoice",
    projectId: "p4",
    customerId: "c2",
    number: "R-2026-002",
    date: day(-20),
    dueDate: day(10),
    status: "open",
    paidAmount: "500",
    paidDate: day(-5),
    lineItems: [{ id: "li3", description: "Dachfenster Einbau", qty: "1", unit: "", unitPrice: "2400" }],
    vatRate: 8.1,
    notes: "",
  },
  {
    id: "d3",
    type: "quote",
    projectId: "p2",
    customerId: "c2",
    number: "O-2026-001",
    date: day(-5),
    status: "sent",
    lineItems: [{ id: "li4", description: "Flachdachsanierung", qty: "1", unit: "", unitPrice: "18000" }],
    vatRate: 8.1,
    notes: "Gültig 30 Tage.",
  },
];
for (const d of documents) await setDoc(doc(db, "companies", CID, "documents", d.id), d);

for (const a of [
  { id: "a1", date: today, projectId: "p1", userId: uids.crew1 },
  { id: "a2", date: today, projectId: "p1", userId: uids.crew2 },
  { id: "a3", date: day(1), projectId: "p2", userId: uids.crew1 },
])
  await setDoc(doc(db, "companies", CID, "assignments", a.id), a);

// Leave, like entries, may only be filed by the person it belongs to.
const leaveRows = [
  {
    id: "l1",
    date: day(3),
    userId: uids.crew2,
    type: "vacation",
    note: "Familienfeier",
    status: "pending",
    createdAt: Date.now(),
  },
  { id: "l2", date: day(-1), userId: uids.crew1, type: "sick", note: "", status: "pending", createdAt: Date.now() },
];
for (const l of leaveRows) {
  await signOut(auth);
  await signInWithEmailAndPassword(auth, emailByUid[l.userId], PASSWORD);
  await setDoc(doc(db, "companies", CID, "leave", l.id), l);
}
// The Polier then approves one, which is how it happens in the app.
await signOut(auth);
await signInWithEmailAndPassword(auth, "polier@test.local", PASSWORD);
await setDoc(doc(db, "companies", CID, "leave", "l2"), { ...leaveRows[1], status: "approved" });
await signOut(auth);
await signInWithEmailAndPassword(auth, "chef@test.local", PASSWORD);

await setDoc(doc(db, "companies", CID, "kv", "site-tech-library"), {
  value: JSON.stringify([
    {
      id: "t1",
      name: "Siga Majrex",
      supplier: "SIGA",
      articleNumber: "MJX-150",
      category: "Dampfbremse",
      specs: [
        { id: "s1", key: "sd-Wert", value: "veränderlich" },
        { id: "s2", key: "Breite", value: "1.5 m" },
      ],
      createdAt: Date.now(),
    },
  ]),
});
await setDoc(doc(db, "companies", CID, "kv", "site-material-prices"), {
  value: JSON.stringify({ "siga risan": "12.50", "ziegel frankfurter pfanne": "18.50" }),
});

console.log(`
seeded.

  http://localhost:5566/index.html?emulator=1

  chef@test.local     owner       password: ${PASSWORD}
  polier@test.local   supervisor  password: ${PASSWORD}
  crew1@test.local    crew        password: ${PASSWORD}
  crew2@test.local    crew        password: ${PASSWORD}
`);
process.exit(0);
