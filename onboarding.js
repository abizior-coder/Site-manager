// A firm sets itself up without the developer: invite links and the owner's
// first steps. Small on purpose: this is in the first paint. The customer
// file import lives in customers-import.js and loads when a file is picked.

// The invite as a link the crew can tap: the app's own address with ?join=CODE.
export function inviteUrl(code, href) {
  const u = new URL(href || "https://abizior-coder.github.io/Site-manager/index.html");
  u.search = "";
  u.hash = "";
  if (!/index\.html$/.test(u.pathname)) u.pathname = u.pathname.replace(/\/?$/, "/index.html");
  u.searchParams.set("join", String(code || "").toUpperCase());
  return u.toString();
}

export function joinCodeFromSearch(search) {
  const raw = new URLSearchParams(search || "").get("join") || "";
  const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return code.length >= 6 && code.length <= 12 ? code : "";
}

export function withoutJoinParam(href) {
  const u = new URL(href);
  u.searchParams.delete("join");
  return u.toString();
}

// What a new owner still has to do, in the order it pays off.
export function firstSteps({ projects, customers, members, invites, billing }) {
  const b = billing || {};
  return [
    { key: "hours", done: (parseFloat(b.weeklyHours) || 0) > 0 && (parseFloat(b.labourRate) || 0) > 0 },
    { key: "site", done: (projects || []).length > 0 },
    { key: "crew", done: (members || []).length > 1 || (invites || []).length > 0 },
    { key: "customers", done: (customers || []).length > 0 },
  ];
}
