// Tailwind is built at build time now (npm run build → tailwind.css) from the
// classes these files use. The play CDN used to compile them in the browser:
// 400 KB of script from a third party with no integrity hash.
//
// `lg` starts at 900px, not Tailwind's 1024px: Windows laptops commonly run
// 125–150% display scaling, so a 1366px screen reports 910 CSS pixels and
// would otherwise get the phone layout.
module.exports = {
  content: ["./index.html", "./roofing-site-manager.jsx", "./tabs/**/*.jsx", "./ui/**/*.jsx"],
  theme: {
    screens: { sm: "640px", md: "768px", lg: "900px", xl: "1280px", "2xl": "1536px" },
  },
  // Class names assembled at runtime that the scanner cannot see whole.
  safelist: ["gap-1.5", "gap-2", "font-mono", "tracking-widest", "bottom-[150px]", "lg:bottom-[132px]", "bottom-5", "lg:bottom-8"],
  corePlugins: { preflight: true },
};
