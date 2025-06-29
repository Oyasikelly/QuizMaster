import React from "react";
import { cn } from "../../lib/utils";

// Color System Component
const ColorSystem = ({ className, ...props }) => {
	return (
		<div
			className={cn(
				"grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4",
				className
			)}
			{...props}>
			{/* Primary Colors */}
			<div className="space-y-2">
				<h3 className="text-sm font-semibold text-gray-900">Primary</h3>
				<div className="space-y-1">
					<div className="h-8 bg-indigo-50 rounded border"></div>
					<div className="h-8 bg-indigo-100 rounded border"></div>
					<div className="h-8 bg-indigo-200 rounded border"></div>
					<div className="h-8 bg-indigo-300 rounded border"></div>
					<div className="h-8 bg-indigo-400 rounded border"></div>
					<div className="h-8 bg-indigo-500 rounded border"></div>
					<div className="h-8 bg-indigo-600 rounded border"></div>
					<div className="h-8 bg-indigo-700 rounded border"></div>
					<div className="h-8 bg-indigo-800 rounded border"></div>
					<div className="h-8 bg-indigo-900 rounded border"></div>
				</div>
			</div>

			{/* Secondary Colors */}
			<div className="space-y-2">
				<h3 className="text-sm font-semibold text-gray-900">Secondary</h3>
				<div className="space-y-1">
					<div className="h-8 bg-purple-50 rounded border"></div>
					<div className="h-8 bg-purple-100 rounded border"></div>
					<div className="h-8 bg-purple-200 rounded border"></div>
					<div className="h-8 bg-purple-300 rounded border"></div>
					<div className="h-8 bg-purple-400 rounded border"></div>
					<div className="h-8 bg-purple-500 rounded border"></div>
					<div className="h-8 bg-purple-600 rounded border"></div>
					<div className="h-8 bg-purple-700 rounded border"></div>
					<div className="h-8 bg-purple-800 rounded border"></div>
					<div className="h-8 bg-purple-900 rounded border"></div>
				</div>
			</div>

			{/* Success Colors */}
			<div className="space-y-2">
				<h3 className="text-sm font-semibold text-gray-900">Success</h3>
				<div className="space-y-1">
					<div className="h-8 bg-green-50 rounded border"></div>
					<div className="h-8 bg-green-100 rounded border"></div>
					<div className="h-8 bg-green-200 rounded border"></div>
					<div className="h-8 bg-green-300 rounded border"></div>
					<div className="h-8 bg-green-400 rounded border"></div>
					<div className="h-8 bg-green-500 rounded border"></div>
					<div className="h-8 bg-green-600 rounded border"></div>
					<div className="h-8 bg-green-700 rounded border"></div>
					<div className="h-8 bg-green-800 rounded border"></div>
					<div className="h-8 bg-green-900 rounded border"></div>
				</div>
			</div>

			{/* Warning Colors */}
			<div className="space-y-2">
				<h3 className="text-sm font-semibold text-gray-900">Warning</h3>
				<div className="space-y-1">
					<div className="h-8 bg-yellow-50 rounded border"></div>
					<div className="h-8 bg-yellow-100 rounded border"></div>
					<div className="h-8 bg-yellow-200 rounded border"></div>
					<div className="h-8 bg-yellow-300 rounded border"></div>
					<div className="h-8 bg-yellow-400 rounded border"></div>
					<div className="h-8 bg-yellow-500 rounded border"></div>
					<div className="h-8 bg-yellow-600 rounded border"></div>
					<div className="h-8 bg-yellow-700 rounded border"></div>
					<div className="h-8 bg-yellow-800 rounded border"></div>
					<div className="h-8 bg-yellow-900 rounded border"></div>
				</div>
			</div>

			{/* Error Colors */}
			<div className="space-y-2">
				<h3 className="text-sm font-semibold text-gray-900">Error</h3>
				<div className="space-y-1">
					<div className="h-8 bg-red-50 rounded border"></div>
					<div className="h-8 bg-red-100 rounded border"></div>
					<div className="h-8 bg-red-200 rounded border"></div>
					<div className="h-8 bg-red-300 rounded border"></div>
					<div className="h-8 bg-red-400 rounded border"></div>
					<div className="h-8 bg-red-500 rounded border"></div>
					<div className="h-8 bg-red-600 rounded border"></div>
					<div className="h-8 bg-red-700 rounded border"></div>
					<div className="h-8 bg-red-800 rounded border"></div>
					<div className="h-8 bg-red-900 rounded border"></div>
				</div>
			</div>

			{/* Neutral Colors */}
			<div className="space-y-2">
				<h3 className="text-sm font-semibold text-gray-900">Neutral</h3>
				<div className="space-y-1">
					<div className="h-8 bg-gray-50 rounded border"></div>
					<div className="h-8 bg-gray-100 rounded border"></div>
					<div className="h-8 bg-gray-200 rounded border"></div>
					<div className="h-8 bg-gray-300 rounded border"></div>
					<div className="h-8 bg-gray-400 rounded border"></div>
					<div className="h-8 bg-gray-500 rounded border"></div>
					<div className="h-8 bg-gray-600 rounded border"></div>
					<div className="h-8 bg-gray-700 rounded border"></div>
					<div className="h-8 bg-gray-800 rounded border"></div>
					<div className="h-8 bg-gray-900 rounded border"></div>
				</div>
			</div>
		</div>
	);
};

// Color Badge Component
const ColorBadge = React.forwardRef(
	(
		{
			color = "primary",
			variant = "solid",
			size = "default",
			className,
			children,
			...props
		},
		ref
	) => {
		const colorVariants = {
			primary: {
				solid: "bg-indigo-600 text-white",
				soft: "bg-indigo-50 text-indigo-700 border border-indigo-200",
				outline: "border border-indigo-600 text-indigo-600 bg-transparent",
			},
			secondary: {
				solid: "bg-purple-600 text-white",
				soft: "bg-purple-50 text-purple-700 border border-purple-200",
				outline: "border border-purple-600 text-purple-600 bg-transparent",
			},
			success: {
				solid: "bg-green-600 text-white",
				soft: "bg-green-50 text-green-700 border border-green-200",
				outline: "border border-green-600 text-green-600 bg-transparent",
			},
			warning: {
				solid: "bg-yellow-600 text-white",
				soft: "bg-yellow-50 text-yellow-700 border border-yellow-200",
				outline: "border border-yellow-600 text-yellow-600 bg-transparent",
			},
			error: {
				solid: "bg-red-600 text-white",
				soft: "bg-red-50 text-red-700 border border-red-200",
				outline: "border border-red-600 text-red-600 bg-transparent",
			},
			neutral: {
				solid: "bg-gray-600 text-white",
				soft: "bg-gray-50 text-gray-700 border border-gray-200",
				outline: "border border-gray-600 text-gray-600 bg-transparent",
			},
		};

		const sizeVariants = {
			sm: "px-2 py-1 text-xs",
			default: "px-3 py-1 text-sm",
			lg: "px-4 py-2 text-base",
		};

		return (
			<span
				ref={ref}
				className={cn(
					"inline-flex items-center justify-center font-medium rounded-full",
					colorVariants[color]?.[variant] || colorVariants.primary.solid,
					sizeVariants[size],
					className
				)}
				{...props}>
				{children}
			</span>
		);
	}
);
ColorBadge.displayName = "ColorBadge";

// Gradient Background Component
const GradientBackground = React.forwardRef(
	({ gradient = "primary", className, children, ...props }, ref) => {
		const gradientVariants = {
			primary: "bg-gradient-to-r from-indigo-500 to-purple-500",
			secondary: "bg-gradient-to-r from-pink-500 to-rose-500",
			success: "bg-gradient-to-r from-green-500 to-emerald-500",
			warning: "bg-gradient-to-r from-yellow-500 to-orange-500",
			error: "bg-gradient-to-r from-red-500 to-pink-500",
			sunset: "bg-gradient-to-r from-orange-500 to-pink-500",
			ocean: "bg-gradient-to-r from-blue-500 to-cyan-500",
			forest: "bg-gradient-to-r from-green-500 to-teal-500",
			royal: "bg-gradient-to-r from-purple-500 to-indigo-500",
			fire: "bg-gradient-to-r from-red-500 to-yellow-500",
		};

		return (
			<div
				ref={ref}
				className={cn(
					gradientVariants[gradient] || gradientVariants.primary,
					className
				)}
				{...props}>
				{children}
			</div>
		);
	}
);
GradientBackground.displayName = "GradientBackground";

// Color Palette Component
const ColorPalette = ({ colors = [], className, ...props }) => {
	return (
		<div
			className={cn(
				"grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4",
				className
			)}
			{...props}>
			{colors.map((color, index) => (
				<div
					key={index}
					className="space-y-2">
					<div
						className="h-16 rounded-lg border shadow-sm"
						style={{ backgroundColor: color.value }}></div>
					<div className="text-center">
						<p className="text-sm font-medium text-gray-900">{color.name}</p>
						<p className="text-xs text-gray-500">{color.value}</p>
					</div>
				</div>
			))}
		</div>
	);
};

// Theme Switcher Component
const ThemeSwitcher = React.forwardRef(
	({ currentTheme = "light", onThemeChange, className, ...props }, ref) => {
		const themes = [
			{ id: "light", name: "Light", icon: "☀️" },
			{ id: "dark", name: "Dark", icon: "🌙" },
			{ id: "auto", name: "Auto", icon: "🔄" },
		];

		return (
			<div
				ref={ref}
				className={cn("flex space-x-2", className)}
				{...props}>
				{themes.map((theme) => (
					<button
						key={theme.id}
						onClick={() => onThemeChange?.(theme.id)}
						className={cn(
							"px-3 py-2 rounded-md text-sm font-medium transition-colors",
							currentTheme === theme.id
								? "bg-indigo-600 text-white"
								: "bg-gray-100 text-gray-700 hover:bg-gray-200"
						)}>
						<span className="mr-2">{theme.icon}</span>
						{theme.name}
					</button>
				))}
			</div>
		);
	}
);
ThemeSwitcher.displayName = "ThemeSwitcher";

export {
	ColorSystem,
	ColorBadge,
	GradientBackground,
	ColorPalette,
	ThemeSwitcher,
};
