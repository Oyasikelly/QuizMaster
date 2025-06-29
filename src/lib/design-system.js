// Design System for QuizMaster
// This file contains all reusable design tokens, colors, typography, and spacing

export const colors = {
	// Primary Brand Colors
	primary: {
		50: "#f0f4ff",
		100: "#e0e9ff",
		200: "#c7d6ff",
		300: "#a4b8ff",
		400: "#8191ff",
		500: "#6366f1", // Main primary color
		600: "#4f46e5",
		700: "#4338ca",
		800: "#3730a3",
		900: "#312e81",
	},

	// Secondary Colors
	secondary: {
		50: "#fdf4ff",
		100: "#fae8ff",
		200: "#f5d0fe",
		300: "#f0abfc",
		400: "#e879f9",
		500: "#d946ef",
		600: "#c026d3",
		700: "#a21caf",
		800: "#86198f",
		900: "#701a75",
	},

	// Success Colors
	success: {
		50: "#f0fdf4",
		100: "#dcfce7",
		200: "#bbf7d0",
		300: "#86efac",
		400: "#4ade80",
		500: "#22c55e",
		600: "#16a34a",
		700: "#15803d",
		800: "#166534",
		900: "#14532d",
	},

	// Warning Colors
	warning: {
		50: "#fffbeb",
		100: "#fef3c7",
		200: "#fde68a",
		300: "#fcd34d",
		400: "#fbbf24",
		500: "#f59e0b",
		600: "#d97706",
		700: "#b45309",
		800: "#92400e",
		900: "#78350f",
	},

	// Error/Destructive Colors
	error: {
		50: "#fef2f2",
		100: "#fee2e2",
		200: "#fecaca",
		300: "#fca5a5",
		400: "#f87171",
		500: "#ef4444",
		600: "#dc2626",
		700: "#b91c1c",
		800: "#991b1b",
		900: "#7f1d1d",
	},

	// Neutral Colors
	neutral: {
		50: "#fafafa",
		100: "#f5f5f5",
		200: "#e5e5e5",
		300: "#d4d4d4",
		400: "#a3a3a3",
		500: "#737373",
		600: "#525252",
		700: "#404040",
		800: "#262626",
		900: "#171717",
	},

	// Gradients
	gradients: {
		primary: "linear-gradient(135deg, #6366f1 0%, #d946ef 100%)",
		secondary: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
		success: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
		purple: "linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)",
		blue: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
	},
};

export const typography = {
	// Font Sizes
	sizes: {
		xs: "0.75rem", // 12px
		sm: "0.875rem", // 14px
		base: "1rem", // 16px
		lg: "1.125rem", // 18px
		xl: "1.25rem", // 20px
		"2xl": "1.5rem", // 24px
		"3xl": "1.875rem", // 30px
		"4xl": "2.25rem", // 36px
		"5xl": "3rem", // 48px
		"6xl": "3.75rem", // 60px
	},

	// Font Weights
	weights: {
		thin: "100",
		extralight: "200",
		light: "300",
		normal: "400",
		medium: "500",
		semibold: "600",
		bold: "700",
		extrabold: "800",
		black: "900",
	},

	// Line Heights
	lineHeights: {
		none: "1",
		tight: "1.25",
		snug: "1.375",
		normal: "1.5",
		relaxed: "1.625",
		loose: "2",
	},

	// Letter Spacing
	letterSpacing: {
		tighter: "-0.05em",
		tight: "-0.025em",
		normal: "0em",
		wide: "0.025em",
		wider: "0.05em",
		widest: "0.1em",
	},
};

export const spacing = {
	// Spacing Scale
	0: "0",
	1: "0.25rem", // 4px
	2: "0.5rem", // 8px
	3: "0.75rem", // 12px
	4: "1rem", // 16px
	5: "1.25rem", // 20px
	6: "1.5rem", // 24px
	8: "2rem", // 32px
	10: "2.5rem", // 40px
	12: "3rem", // 48px
	16: "4rem", // 64px
	20: "5rem", // 80px
	24: "6rem", // 96px
	32: "8rem", // 128px
	40: "10rem", // 160px
	48: "12rem", // 192px
	56: "14rem", // 224px
	64: "16rem", // 256px
};

export const borderRadius = {
	none: "0",
	sm: "0.125rem", // 2px
	base: "0.25rem", // 4px
	md: "0.375rem", // 6px
	lg: "0.5rem", // 8px
	xl: "0.75rem", // 12px
	"2xl": "1rem", // 16px
	"3xl": "1.5rem", // 24px
	full: "9999px",
};

export const shadows = {
	sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
	base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
	md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
	lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
	xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
	"2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
	inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
	none: "none",
};

export const transitions = {
	fast: "150ms ease-in-out",
	normal: "250ms ease-in-out",
	slow: "350ms ease-in-out",
	bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
	ease: "cubic-bezier(0.4, 0, 0.2, 1)",
};

// Theme configuration
export const theme = {
	colors,
	typography,
	spacing,
	borderRadius,
	shadows,
	transitions,
};

export default theme;
