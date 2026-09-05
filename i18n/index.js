// One file per language, so adding one is adding a file rather than editing a
// 500-line object inside an 8,000-line component. The order here is the order
// of the language picker.
//
// Languages load on demand: fourteen dictionaries were half the bundle, and a
// phone needs one of them. `loadLang` pulls one file as its own chunk; English
// is the fallback and is loaded with the first language before the app mounts.

const LOADERS = {
  en: () => import("./en.json"),
  de: () => import("./de.json"),
  gsw: () => import("./gsw.json"),
  fr: () => import("./fr.json"),
  it: () => import("./it.json"),
  es: () => import("./es.json"),
  pt: () => import("./pt.json"),
  pl: () => import("./pl.json"),
  sq: () => import("./sq.json"),
  ro: () => import("./ro.json"),
  bg: () => import("./bg.json"),
  hu: () => import("./hu.json"),
  sk: () => import("./sk.json"),
  cs: () => import("./cs.json"),
};

const raw = {};
const pending = {};

// Anything a translation has not caught up with falls back to English rather
// than rendering the key name at someone on a roof.
function withFallback(dict) {
  return new Proxy(dict, {
    get(target, key) {
      const own = target[key];
      return own === undefined || own === "" ? (raw.en || {})[key] : own;
    },
  });
}

// Loaded dictionaries by code. `T[code]` is undefined until `loadLang(code)`
// has resolved; callers fall back to `T.de` or `T.en` meanwhile.
export const T = {};

export function isLang(code) {
  return Object.prototype.hasOwnProperty.call(LOADERS, code);
}

export function loadLang(code) {
  const c = isLang(code) ? code : "en";
  if (T[c]) return Promise.resolve(T[c]);
  if (!pending[c]) {
    pending[c] = LOADERS[c]()
      .then((mod) => {
        const d = mod.default !== undefined ? mod.default : mod;
        raw[c] = typeof d === "string" ? JSON.parse(d) : d;
        T[c] = c === "en" ? raw.en : withFallback(raw[c]);
        return T[c];
      })
      .catch((e) => {
        delete pending[c];
        throw e;
      });
  }
  return pending[c];
}

export const LANGS = [
  { code: "de", label: "Deutsch" },
  { code: "gsw", label: "Schwiizerdütsch" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "en", label: "English" },
  { code: "sq", label: "Shqip" },
  { code: "ro", label: "Română" },
  { code: "bg", label: "Български" },
  { code: "hu", label: "Magyar" },
  { code: "pl", label: "Polski" },
  { code: "pt", label: "Português" },
  { code: "es", label: "Español" },
  { code: "sk", label: "Slovenčina" },
  { code: "cs", label: "Čeština" },
];
