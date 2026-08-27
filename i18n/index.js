// One file per language, so adding one is adding a file rather than editing a
// 500-line object inside an 8,000-line component. The order here is the order
// of the language picker.

import en from "./en.json";
import de from "./de.json";
import gsw from "./gsw.json";
import fr from "./fr.json";
import it from "./it.json";
import es from "./es.json";
import pt from "./pt.json";
import pl from "./pl.json";
import sq from "./sq.json";
import ro from "./ro.json";
import bg from "./bg.json";
import hu from "./hu.json";
import sk from "./sk.json";
import cs from "./cs.json";

// Anything a translation has not caught up with falls back to English rather
// than rendering the key name at someone on a roof.
function withFallback(dict) {
  return new Proxy(dict, {
    get(target, key) {
      const own = target[key];
      return own === undefined || own === "" ? en[key] : own;
    },
  });
}

export const T = {
  de: withFallback(de),
  gsw: withFallback(gsw),
  fr: withFallback(fr),
  it: withFallback(it),
  en,
  sq: withFallback(sq),
  ro: withFallback(ro),
  bg: withFallback(bg),
  hu: withFallback(hu),
  pl: withFallback(pl),
  pt: withFallback(pt),
  es: withFallback(es),
  sk: withFallback(sk),
  cs: withFallback(cs),
};

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
