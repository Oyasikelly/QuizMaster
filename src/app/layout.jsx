import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";

// Display font for headings — gives the admin UI real visual character
// instead of the default system sans. Body stays on Inter, built for
// legibility in dense, data-heavy screens.
const jakarta = Plus_Jakarta_Sans({
	variable: "--font-display",
	subsets: ["latin"],
	weight: ["500", "600", "700", "800"],
});

const inter = Inter({
	variable: "--font-sans",
	subsets: ["latin"],
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
