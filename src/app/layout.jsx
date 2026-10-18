import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";

// Self-hosted rather than next/font/google: that fetches font data from
// Google at BUILD TIME, which is reliable locally and on Vercel but
// proved flaky in GitHub Actions CI (TypeError: Cannot read properties
// of null (reading '1') in next/font's loader — a known class of issue
// when a CI runner's network path to Google Fonts gets rate-limited or
// blocked). Self-hosting removes that dependency from the build
// entirely. Both files are the actual variable-weight fonts Google
// serves (one file covers the whole weight range, not one per weight —
// confirmed by fetching the real CSS2 API response, not guessed), latin
// subset only, which is all this app needs.
const jakarta = localFont({
	src: "./fonts/plus-jakarta-sans.woff2",
	variable: "--font-display",
	weight: "500 800",
	display: "swap",
});

const inter = localFont({
	src: "./fonts/inter.woff2",
	variable: "--font-sans",
	weight: "400 700",
	display: "swap",
});

export const metadata = {
	title: "QuizMaster",
	description: "A quiz platform for RCCG Region 70",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body className={`${jakarta.variable} ${inter.variable} font-sans antialiased`}>
				<AuthProvider>{children}</AuthProvider>
			</body>
		</html>
	);
}
