// Reusable UI Components Index
// This file exports all reusable components for easy importing

// Typography Components
export { Heading, Text, Label, Caption, Quote, Code, Link } from "./typography";

// Button Components
export {
	Button,
	buttonVariants,
	IconButton,
	FloatingButton,
	QuizButton,
	SocialButton,
	ToggleButton,
} from "./enhanced-button";

// Color System Components
export {
	ColorSystem,
	ColorBadge,
	GradientBackground,
	ColorPalette,
	ThemeSwitcher,
} from "./color-system";

// Re-export original button for backward compatibility
export {
	Button as OriginalButton,
	buttonVariants as originalButtonVariants,
} from "./button";
