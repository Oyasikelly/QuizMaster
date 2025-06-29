import React from "react";
import { cn } from "../../lib/utils";

// Heading Component
const Heading = React.forwardRef(
	({ level = 1, children, className, variant = "default", ...props }, ref) => {
		const baseClasses = "font-bold tracking-tight";

		const variants = {
			default: "text-gray-900 dark:text-gray-100",
			primary: "text-indigo-700 dark:text-indigo-300",
			secondary: "text-purple-700 dark:text-purple-300",
			muted: "text-gray-600 dark:text-gray-400",
			white: "text-white",
		};

		const sizes = {
			1: "text-4xl md:text-5xl lg:text-6xl",
			2: "text-3xl md:text-4xl lg:text-5xl",
			3: "text-2xl md:text-3xl lg:text-4xl",
			4: "text-xl md:text-2xl lg:text-3xl",
			5: "text-lg md:text-xl lg:text-2xl",
			6: "text-base md:text-lg lg:text-xl",
		};

		const Component = `h${level}`;

		return (
			<Component
				ref={ref}
				className={cn(baseClasses, sizes[level], variants[variant], className)}
				{...props}>
				{children}
			</Component>
		);
	}
);
Heading.displayName = "Heading";

// Text Component
const Text = React.forwardRef(
	(
		{
			children,
			className,
			variant = "body",
			size = "base",
			weight = "normal",
			...props
		},
		ref
	) => {
		const baseClasses = "leading-relaxed";

		const variants = {
			body: "text-gray-700 dark:text-gray-300",
			muted: "text-gray-600 dark:text-gray-400",
			primary: "text-indigo-700 dark:text-indigo-300",
			secondary: "text-purple-700 dark:text-purple-300",
			success: "text-green-700 dark:text-green-300",
			warning: "text-yellow-700 dark:text-yellow-300",
			error: "text-red-700 dark:text-red-300",
			white: "text-white",
		};

		const sizes = {
			xs: "text-xs",
			sm: "text-sm",
			base: "text-base",
			lg: "text-lg",
			xl: "text-xl",
			"2xl": "text-2xl",
		};

		const weights = {
			thin: "font-thin",
			light: "font-light",
			normal: "font-normal",
			medium: "font-medium",
			semibold: "font-semibold",
			bold: "font-bold",
			extrabold: "font-extrabold",
		};

		return (
			<p
				ref={ref}
				className={cn(
					baseClasses,
					variants[variant],
					sizes[size],
					weights[weight],
					className
				)}
				{...props}>
				{children}
			</p>
		);
	}
);
Text.displayName = "Text";

// Label Component
const Label = React.forwardRef(
	(
		{ children, className, variant = "default", size = "base", ...props },
		ref
	) => {
		const baseClasses = "font-medium";

		const variants = {
			default: "text-gray-900 dark:text-gray-100",
			muted: "text-gray-600 dark:text-gray-400",
			primary: "text-indigo-700 dark:text-indigo-300",
			secondary: "text-purple-700 dark:text-purple-300",
			required: "text-red-600 dark:text-red-400",
		};

		const sizes = {
			sm: "text-sm",
			base: "text-base",
			lg: "text-lg",
		};

		return (
			<label
				ref={ref}
				className={cn(baseClasses, variants[variant], sizes[size], className)}
				{...props}>
				{children}
			</label>
		);
	}
);
Label.displayName = "Label";

// Caption Component
const Caption = React.forwardRef(
	({ children, className, variant = "muted", ...props }, ref) => {
		const baseClasses = "text-xs font-medium";

		const variants = {
			muted: "text-gray-500 dark:text-gray-400",
			primary: "text-indigo-600 dark:text-indigo-400",
			secondary: "text-purple-600 dark:text-purple-400",
			success: "text-green-600 dark:text-green-400",
			warning: "text-yellow-600 dark:text-yellow-400",
			error: "text-red-600 dark:text-red-400",
		};

		return (
			<span
				ref={ref}
				className={cn(baseClasses, variants[variant], className)}
				{...props}>
				{children}
			</span>
		);
	}
);
Caption.displayName = "Caption";

// Quote Component
const Quote = React.forwardRef(
	({ children, className, variant = "default", ...props }, ref) => {
		const baseClasses = "italic border-l-4 pl-4";

		const variants = {
			default:
				"border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300",
			primary:
				"border-indigo-300 text-indigo-700 dark:border-indigo-600 dark:text-indigo-300",
			secondary:
				"border-purple-300 text-purple-700 dark:border-purple-600 dark:text-purple-300",
		};

		return (
			<blockquote
				ref={ref}
				className={cn(baseClasses, variants[variant], className)}
				{...props}>
				{children}
			</blockquote>
		);
	}
);
Quote.displayName = "Quote";

// Code Component
const Code = React.forwardRef(
	({ children, className, variant = "inline", ...props }, ref) => {
		const baseClasses = "font-mono";

		const variants = {
			inline:
				"bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-sm",
			block:
				"bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 rounded-lg text-sm block w-full",
		};

		const Component = variant === "block" ? "pre" : "code";

		return (
			<Component
				ref={ref}
				className={cn(baseClasses, variants[variant], className)}
				{...props}>
				{children}
			</Component>
		);
	}
);
Code.displayName = "Code";

// Link Component
const Link = React.forwardRef(
	(
		{ children, className, variant = "primary", underline = true, ...props },
		ref
	) => {
		const baseClasses = "transition-colors duration-200 hover:underline";

		const variants = {
			primary:
				"text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300",
			secondary:
				"text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300",
			muted:
				"text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300",
			white: "text-white hover:text-gray-200",
		};

		return (
			<a
				ref={ref}
				className={cn(
					baseClasses,
					variants[variant],
					underline && "underline",
					className
				)}
				{...props}>
				{children}
			</a>
		);
	}
);
Link.displayName = "Link";

export { Heading, Text, Label, Caption, Quote, Code, Link };
