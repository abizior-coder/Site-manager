import io, json

def patch(path, pairs):
    s = io.open(path, encoding="utf-8", newline="").read()
    for a, b, l in pairs:
        n = s.count(a)
        if n != 1:
            raise SystemExit(f"MISS {path} {l} ({n})")
        s = s.replace(a, b)
        print("ok", path, l)
    io.open(path, "w", encoding="utf-8", newline="").write(s)

# ============================================================================ Worker
patch("worker/src/index.js", [
('''import { handleFiles, firestoreMember } from "./files.js";''',
 '''import { handleFiles, firestoreMember } from "./files.js";
import { checkLimits } from "./limits.js";''', "import limits"),
('''    const auth = await verifyUser(request);
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
''',
'''    const auth = await verifyUser(request);
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
''', "company-charged proxy"),
])

# the old per-uid counter is replaced by limits.js; keep the file readable
s = io.open("worker/src/index.js", encoding="utf-8", newline="").read()
start = s.find("// Per-account daily cap.")
if start < 0:
    start = s.find("async function overDailyLimit")
end = s.find("export default {")
if start > 0 and end > start:
    s = s[:start] + s[end:]
    s = s.replace('const DAILY_LIMIT = 200; // scans per account per day, when KV is bound\n', "")
    io.open("worker/src/index.js", "w", encoding="utf-8", newline="").write(s)
    print("ok worker/src/index.js old cap removed")
else:
    print("!! could not locate overDailyLimit block; leaving it")

# ============================================================================ client
patch("roofing-site-manager.jsx", [
('''        body: JSON.stringify({ content }),''',
 '''        body: JSON.stringify({ content, companyId: getCompanyId() }),''', "callClaude sends company"),
])

# ============================================================================ rules: personal store capped
patch("firestore.rules", [
('''      match /kv/{key} {
        allow read, write: if signedIn() && request.auth.uid == uid;
      }''',
'''      match /kv/{key} {
        allow read: if signedIn() && request.auth.uid == uid;
        // 256 KB per document: enough for any preference, not enough to fill
        // the free tier from a throwaway account.
        allow write: if signedIn() && request.auth.uid == uid
                     && (request.method == 'delete'
                         || !('value' in request.resource.data)
                         || !(request.resource.data.value is string)
                         || request.resource.data.value.size() <= 262144);
      }''', "users kv capped"),
])

patch("rules.test.mjs", [
('''await check("owner CAN still read their own personal kv (migration source)", () =>''',
'''await check("a personal kv document over 256 KB is refused", () =>
  assertFails(setDoc(doc(owner, "users", OWNER, "kv", "big"), { value: "x".repeat(262145) })));
await check("a personal kv document under 256 KB is fine", () =>
  assertSucceeds(setDoc(doc(owner, "users", OWNER, "kv", "small"), { value: "x".repeat(1000) })));
await check("owner CAN still read their own personal kv (migration source)", () =>''', "users kv tests"),
])

# ============================================================================ package.json
d = json.load(io.open("package.json", encoding="utf-8"))
d["scripts"]["test:worker"] = "node worker/files.test.mjs && node worker/limits.test.mjs"
io.open("package.json", "w", encoding="utf-8", newline="\n").write(json.dumps(d, indent=2, ensure_ascii=False) + "\n")
print("ok package.json test:worker")
