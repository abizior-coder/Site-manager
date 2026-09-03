import { createRoot } from "react-dom/client";
import SiteManager from "./roofing-site-manager.jsx";
import { storage } from "./firebase-client.js";
import { loadLang } from "./i18n/index.js";

// The app calls window.storage throughout. Defining it here — from the bundle
// rather than from index.html — means a stale cached shell cannot leave the
// app wired to an old, unauthenticated storage layer.
window.storage = storage;

// German is the UI's first language and English the fallback for any key a
// translation lacks; both are in hand before the first paint. Other
// languages load when chosen.
await Promise.all([loadLang("en"), loadLang("de")]);
createRoot(document.getElementById("root")).render(<SiteManager />);
