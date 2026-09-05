// Code 128 for the pickup slip, drawn by the app itself: the order
// reference no longer travels to a third-party image service. Subset B for
// text, subset C for runs of digits, the standard modulo-103 checksum.
// Pure; the caller renders the bars (the app as SVG rects).

// Bar/space widths per symbol value 0..106; each row sums to 11 modules,
// the stop pattern to 13.
const PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];
export const CODE_C = 99, CODE_B = 100, START_B = 104, START_C = 105, STOP = 106;
export const QUIET_ZONE = 10;

export function patternFor(value) { return PATTERNS[value]; }
export function patternCount() { return PATTERNS.length; }

const isDigit = (ch) => ch >= "0" && ch <= "9";

// The symbol values (start, data, checksum, stop) for a printable-ASCII text.
export function code128Values(text) {
  const s = String(text == null ? "" : text);
  if (!s.length || s.length > 80) throw new Error("code128: 1 to 80 characters");
  for (const ch of s) { const c = ch.charCodeAt(0); if (c < 32 || c > 126) throw new Error("code128: printable ASCII only"); }
  const digitsAhead = (i) => { let n = 0; while (i + n < s.length && isDigit(s[i + n])) n++; return n; };
  const values = [];
  let i = 0;
  let mode;
  const lead = digitsAhead(0);
  if ((lead >= 4 && lead % 2 === 0) || (s.length === 2 && lead === 2)) { values.push(START_C); mode = "C"; } else { values.push(START_B); mode = "B"; }
  while (i < s.length) {
    const n = digitsAhead(i);
    if (mode === "C") {
      if (n >= 2) { values.push(parseInt(s.slice(i, i + 2), 10)); i += 2; continue; }
      values.push(CODE_B); mode = "B"; continue;
    }
    if (n >= 4) {
      if (n % 2 === 1) { values.push(s.charCodeAt(i) - 32); i++; }
      values.push(CODE_C); mode = "C"; continue;
    }
    values.push(s.charCodeAt(i) - 32); i++;
  }
  let sum = values[0];
  for (let k = 1; k < values.length; k++) sum += values[k] * k;
  values.push(sum % 103);
  values.push(STOP);
  return values;
}

// Bars as {x, w} in modules, plus the total width with quiet zones.
export function code128Bars(text) {
  const values = code128Values(text);
  const bars = [];
  let x = QUIET_ZONE;
  for (const v of values) {
    const p = PATTERNS[v];
    for (let k = 0; k < p.length; k++) {
      const w = Number(p[k]);
      if (k % 2 === 0) bars.push({ x, w });
      x += w;
    }
  }
  return { bars, width: x + QUIET_ZONE, values };
}
