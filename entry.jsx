import { createRoot } from "react-dom/client";
import SiteManager from "./roofing-site-manager.jsx";
import { storage } from "./firebase-client.js";

// The app calls window.storage throughout. Defining it here — from the bundle
// rather than from index.html — means a stale cached shell cannot leave the
// app wired to an old, unauthenticated storage layer.
window.storage = storage;

createRoot(document.getElementById("root")).render(<SiteManager />);
