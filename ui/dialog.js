// What every dialog owes the person using it: Escape closes it, focus goes
// in when it opens, Tab stays inside, and focus comes back to the control
// that opened it. The helpers are pure DOM so a test can drive them.
import { useEffect, useRef } from "react";

export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusable(root) {
  if (!root) return [];
  const view = root.ownerDocument?.defaultView;
  const shown = (el) => {
    if (!view || typeof view.getComputedStyle !== "function") return true;
    const cs = view.getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden";
  };
  return [...root.querySelectorAll(FOCUSABLE)].filter(
    (el) =>
      !el.hasAttribute("hidden") && el.getAttribute("aria-hidden") !== "true" && !el.closest("[hidden]") && shown(el),
  );
}

// For a Tab press inside `root`: the element that should get focus, or null
// when the browser's own order is fine.
export function trapTab(event, root) {
  if (!event || event.key !== "Tab" || !root) return null;
  const list = focusable(root);
  if (!list.length) return root;
  const first = list[0],
    last = list[list.length - 1];
  const active = root.ownerDocument.activeElement;
  const inside = root.contains(active);
  if (event.shiftKey) return !inside || active === first || active === root ? last : null;
  return !inside || active === last ? first : null;
}

export function useDialog({ onClose, active = true }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!active) return undefined;
    const root = ref.current;
    if (!root) return undefined;
    const doc = root.ownerDocument;
    const opener = doc.activeElement;
    const list = focusable(root);
    const target = list.find((el) => !el.hasAttribute("data-dialog-close")) || list[0] || root;
    try {
      target.focus({ preventScroll: true });
    } catch {}
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (closeRef.current) closeRef.current();
        return;
      }
      const next = trapTab(e, root);
      if (next) {
        e.preventDefault();
        try {
          next.focus({ preventScroll: true });
        } catch {}
      }
    };
    root.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("keydown", onKey);
      try {
        if (opener && typeof opener.focus === "function" && doc.contains(opener)) opener.focus({ preventScroll: true });
      } catch {}
    };
  }, [active]);
  return ref;
}
