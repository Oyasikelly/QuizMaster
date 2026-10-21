// Next.js's app/manifest.js convention: auto-served at /manifest.webmanifest
// and auto-linked into every page's <head> -- no manual <link rel="manifest">
// needed.
export default function manifest() {
	return {
		name: "QuizMaster",
		short_name: "QuizMaster",
		description: "A quiz platform for RCCG Region 70",
		start_url: "/",
		display: "standalone",
		background_color: "#f4f2ff",
		theme_color: "#7c52f7",
		icons: [
			{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
			{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
			{ src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
			{ src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
		],
	};
}
