# Moves one tab's JSX out of SiteManager into a lazy component. The tab's
# free identifiers that SiteManager declares become props; module-level
# names are imported from the app module; icons from lucide-react.
#
#   python .extract-tab.py materials MaterialsTab
import io, re, sys

tab_id, comp = sys.argv[1], sys.argv[2]
SRC = "roofing-site-manager.jsx"
s = io.open(SRC, encoding="utf-8", newline="").read()

start_marker = f'        {{tab === "{tab_id}" && (() => {{\n'
guard = ""
if start_marker not in s:
    start_marker = f'        {{tab === "{tab_id}" && canManage() && (() => {{\n'
    guard = "canManage() && "
i = s.index(start_marker)
# The block ends at the next tab conditional at the same indentation.
j = s.index('\n        {tab === "', i + len(start_marker)) + 1
block = s[i:j]
body = block.rstrip()
assert body.endswith("})()}"), body[-30:]
inner = body[len(start_marker): -len("})()}")].rstrip()  # the IIFE body: statements + return (...)
print("cut", tab_id, len(block.splitlines()), "lines")
s = s[:i] + s[j:]

lucide_line = re.search(r'^import \{ (.*) \} from "lucide-react";$', s, re.M).group(1)
LUCIDE = set(x.strip() for x in lucide_line.split(","))

# Names declared at module level, and names SiteManager declares.
top = {}
for m in re.finditer(r"^(export )?(?:default )?(?:async )?(?:function|const|let|class) ([A-Za-z_$][\w$]*)", s, re.M):
    top[m.group(2)] = bool(m.group(1))
imports = {}
for m in re.finditer(r'^import \{([^}]*)\} from "([^"]+)";', s, re.M):
    for name in m.group(1).split(","):
        name = name.strip()
        if name: imports[name.split(" as ")[-1].strip()] = (name, m.group(2))

sm_start = s.index("export default function SiteManager()")
sm_end = s.index("\nfunction MountainBackground", sm_start)
sm = s[sm_start:sm_end]
declared = set()
for m in re.finditer(r"^  (?:async )?(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)", sm, re.M): declared.add(m.group(1))
for m in re.finditer(r"^  (?:const|let|var)\s+\[([^\]]*)\]\s*=", sm, re.M):
    for n in m.group(1).split(","):
        n = n.strip().split("=")[0].strip()
        if re.match(r"^[A-Za-z_$][\w$]*$", n): declared.add(n)
for m in re.finditer(r"^  (?:const|let|var)\s+\{([^}]*)\}\s*=", sm, re.M):
    for n in m.group(1).split(","):
        n = n.strip().split(":")[-1].split("=")[0].strip()
        if re.match(r"^[A-Za-z_$][\w$]*$", n): declared.add(n)

# Names the block declares itself (locals), so they are not props.
local = set()
for m in re.finditer(r"\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)", inner): local.add(m.group(1))
for m in re.finditer(r"\b(?:const|let|var)\s+\[([^\]]*)\]\s*=", inner):
    for n in m.group(1).split(","):
        n = n.strip().split("=")[0].strip()
        if re.match(r"^[A-Za-z_$][\w$]*$", n): local.add(n)
for m in re.finditer(r"\b(?:const|let|var)\s+\{([^}]*)\}\s*=", inner):
    for n in m.group(1).split(","):
        n = n.strip().split(":")[-1].split("=")[0].strip()
        if re.match(r"^[A-Za-z_$][\w$]*$", n): local.add(n)
# arrow / function parameters
for m in re.finditer(r"\(([^()]*)\)\s*=>", inner):
    for n in re.findall(r"[A-Za-z_$][\w$]*", m.group(1)): local.add(n)
for m in re.finditer(r"(?<![\w$.])([A-Za-z_$][\w$]*)\s*=>", inner): local.add(m.group(1))
for m in re.finditer(r"\bfunction\s*\w*\s*\(([^)]*)\)", inner):
    for n in re.findall(r"[A-Za-z_$][\w$]*", m.group(1)): local.add(n)
for m in re.finditer(r"\bcatch\s*\((\w+)\)", inner): local.add(m.group(1))

# Strip strings and JSX text roughly before collecting identifiers: keep it
# simple -- identifiers inside strings only add harmless candidates that the
# `declared` filter drops.
ident = set(re.findall(r"(?<![.\w$])([A-Za-z_$][\w$]*)", inner.replace("...", " ")))
JSX_TAGS = set(re.findall(r"<([A-Z][A-Za-z0-9]*)", inner))

props = sorted(n for n in ident if n in declared and n not in local and n not in top and n not in imports and n not in LUCIDE)
icons = sorted(n for n in JSX_TAGS | set(re.findall(r"icon: ([A-Z][A-Za-z0-9]*)", inner)) | set(re.findall(r"Icon = ([A-Z][A-Za-z0-9]*)", inner)) if n in LUCIDE)
from_app = sorted(n for n in ident if n in top and n not in local)
mods = {}
for n in ident:
    if n in imports and n not in local and n not in top:
        orig, src = imports[n]
        mods.setdefault(src, set()).add(orig)
hooks = sorted(n for n in ident if n in ("useState", "useEffect", "useRef", "useMemo", "Fragment"))
mods.setdefault("react", set()).update(hooks)

print("props:", len(props), props)
print("from app:", from_app)
print("modules:", {k: sorted(v) for k, v in mods.items()})

for n in from_app:
    if not top[n]:
        s, k = re.subn(r"^((?:async )?(?:function|const|let|class) %s\b)" % re.escape(n), r"export \1", s, count=1, flags=re.M)
        if k != 1: raise SystemExit("could not export " + n)

def rel(src): return "." + src if src.startswith("./") else src
head = [f"// The {tab_id} tab, loaded when first opened. State and handlers stay in the\n// app and arrive as props; this module only renders."]
for src, names in sorted(mods.items()):
    names = sorted(names)
    if names: head.append(f'import {{ {", ".join(names)} }} from "{rel(src)}";')
# icons already arrive through the app module's own lucide import (mods)
if from_app: head.append(f'import {{ {", ".join(from_app)} }} from "../roofing-site-manager.jsx";')
lines = inner.splitlines()
lines = [l[8:] if l.startswith("        ") else l for l in lines]
comp_src = "\n".join(head) + "\n\nexport function " + comp + "({ " + ", ".join(props) + " }) {\n" + "\n".join(lines) + "\n}\n"
io.open(f"tabs/{comp}.jsx", "w", encoding="utf-8", newline="\n").write(comp_src)

mount = f'        {{tab === "{tab_id}" && {guard}<Suspense fallback={{null}}><{comp} ' + " ".join(f"{p}={{{p}}}" for p in props) + " /></Suspense>}\n"
next_tab = s.index('        {tab === "', i)  # exports above shifted `i`; re-anchor on the next tab
s = s[:next_tab] + mount + s[next_tab:]
s = s.replace("// Cloudflare Worker that holds the Anthropic API key server-side.",
              f'const {comp} = lazy(() => import("./tabs/{comp}.jsx").then((m) => ({{ default: m.{comp} }})));\n\n// Cloudflare Worker that holds the Anthropic API key server-side.', 1)
io.open(SRC, "w", encoding="utf-8", newline="").write(s)
print("app module now", len(s.splitlines()), "lines")
