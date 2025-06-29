import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

// Enhanced button variants
const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				// Default variants
				default:
					"bg-primary text-primary-foreground shadow hover:bg-primary/90 focus-visible:ring-primary",
				destructive:
					"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive",
				outline:
					"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
				secondary:
					"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 focus-visible:ring-secondary",
				ghost:
					"hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
				link: "text-primary underline-offset-4 hover:underline focus-visible:ring-ring",

				// Quiz-specific variants
				quiz: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:from-indigo-700 hover:to-purple-700 focus-visible:ring-indigo-500",
				success:
					"bg-green-600 text-white shadow-lg hover:bg-green-700 focus-visible:ring-green-500",
				warning:
					"bg-yellow-600 text-white shadow-lg hover:bg-yellow-700 focus-visible:ring-yellow-500",
				info: "bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus-visible:ring-blue-500",

				// Gradient variants
				gradientPrimary:
					"bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:from-indigo-600 hover:to-purple-600 focus-visible:ring-indigo-500",
				gradientSecondary:
					"bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg hover:from-pink-600 hover:to-rose-600 focus-visible:ring-pink-500",
				gradientSuccess:
					"bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:from-green-600 hover:to-emerald-600 focus-visible:ring-green-500",

				// Soft variants
				softPrimary:
					"bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 focus-visible:ring-indigo-500",
				softSecondary:
					"bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 focus-visible:ring-purple-500",
				softSuccess:
					"bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 focus-visible:ring-green-500",
				softWarning:
					"bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 focus-visible:ring-yellow-500",
				softError:
					"bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 focus-visible:ring-red-500",
			},
			size: {
				xs: "h-7 px-2 text-xs",
				sm: "h-8 px-3 text-xs",
				default: "h-9 px-4 py-2",
				lg: "h-11 px-8 text-base",
				xl: "h-12 px-10 text-lg",
				icon: "h-9 w-9",
				iconSm: "h-8 w-8",
				iconLg: "h-11 w-11",
			},
			rounded: {
				default: "rounded-md",
				full: "rounded-full",
				lg: "rounded-lg",
				xl: "rounded-xl",
				none: "rounded-none",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
			rounded: "default",
		},
	}
);

// Main Button Component
const Button = React.forwardRef(
	(
		{
			className,
			variant,
			size,
			rounded,
			asChild = false,
			loading = false,
			leftIcon,
			rightIcon,
			children,
			...props
		},
		ref
	) => {
		const Comp = asChild ? Slot : "button";

		return (
			<Comp
				className={cn(buttonVariants({ variant, size, rounded, className }))}
				ref={ref}
				disabled={loading || props.disabled}
				{...props}>
				{loading && (
					<svg
						className="animate-spin -ml-1 mr-2 h-4 w-4"
						fill="none"
						viewBox="0 0 24 24">
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
				)}
				{!loading && leftIcon && leftIcon}
				{children}
				{!loading && rightIcon && rightIcon}
			</Comp>
		);
	}
);
Button.displayName = "Button";

// Icon Button Component
const IconButton = React.forwardRef(
	(
		{
			className,
			variant = "ghost",
			size = "icon",
			rounded = "default",
			icon,
			...props
		},
		ref
	) => {
		return (
			<Button
				ref={ref}
				variant={variant}
				size={size}
				rounded={rounded}
				className={className}
				{...props}>
				{icon}
			</Button>
		);
	}
);
IconButton.displayName = "IconButton";

// Floating Action Button
const FloatingButton = React.forwardRef(
	(
		{
			className,
			variant = "quiz",
			size = "lg",
			rounded = "full",
			icon,
			children,
			...props
		},
		ref
	) => {
		return (
			<Button
				ref={ref}
				variant={variant}
				size={size}
				rounded={rounded}
				className={cn(
					"fixed bottom-6 right-6 shadow-2xl hover:scale-110 transition-transform",
					className
				)}
				{...props}>
				{icon}
				{children}
			</Button>
		);
	}
);
FloatingButton.displayName = "FloatingButton";

// Quiz Action Button (Specialized for quiz interactions)
const QuizButton = React.forwardRef(
	(
		{
			className,
			variant = "quiz",
			size = "lg",
			rounded = "lg",
			children,
			...props
		},
		ref
	) => {
		return (
			<Button
				ref={ref}
				variant={variant}
				size={size}
				rounded={rounded}
				className={cn("font-semibold text-lg", className)}
				{...props}>
				{children}
			</Button>
		);
	}
);
QuizButton.displayName = "QuizButton";

// Social Button (for social media integration)
const SocialButton = React.forwardRef(
	({ className, platform = "default", icon, children, ...props }, ref) => {
		const platformVariants = {
			facebook: "bg-blue-600 hover:bg-blue-700 text-white",
			google: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
			twitter: "bg-sky-500 hover:bg-sky-600 text-white",
			github: "bg-gray-900 hover:bg-gray-800 text-white",
			default: "bg-gray-600 hover:bg-gray-700 text-white",
		};

		return (
			<Button
				ref={ref}
				variant="default"
				size="lg"
				rounded="lg"
				className={cn(
					platformVariants[platform],
					"w-full justify-center",
					className
				)}
				{...props}>
				{icon}
				{children}
			</Button>
		);
	}
);
SocialButton.displayName = "SocialButton";

// Toggle Button
const ToggleButton = React.forwardRef(
	(
		{
			className,
			active = false,
			variant = "outline",
			size = "default",
			children,
			...props
		},
		ref
	) => {
		return (
			<Button
				ref={ref}
				variant={active ? "default" : variant}
				size={size}
				className={cn(
					active && "bg-primary text-primary-foreground",
					className
				)}
				{...props}>
				{children}
			</Button>
		);
	}
);
ToggleButton.displayName = "ToggleButton";

export {
	Button,
	buttonVariants,
	IconButton,
	FloatingButton,
	QuizButton,
	SocialButton,
	ToggleButton,
};
