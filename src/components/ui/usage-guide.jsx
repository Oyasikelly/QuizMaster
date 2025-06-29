import React from "react";
import {
	Heading,
	Text,
	Label,
	Caption,
	Quote,
	Code,
	Link,
	Button,
	IconButton,
	FloatingButton,
	QuizButton,
	SocialButton,
	ToggleButton,
	ColorBadge,
	GradientBackground,
	ColorPalette,
	ThemeSwitcher,
} from "./index";
import {
	FaHeart,
	FaStar,
	FaArrowRight,
	FaHome,
	FaUser,
	FaCog,
} from "react-icons/fa";

// Usage Guide Component
const UsageGuide = () => {
	const [activeTheme, setActiveTheme] = React.useState("light");
	const [toggleState, setToggleState] = React.useState(false);

	const sampleColors = [
		{ name: "Primary Blue", value: "#3b82f6" },
		{ name: "Purple", value: "#8b5cf6" },
		{ name: "Success Green", value: "#10b981" },
		{ name: "Warning Yellow", value: "#f59e0b" },
		{ name: "Error Red", value: "#ef4444" },
		{ name: "Neutral Gray", value: "#6b7280" },
	];

	return (
		<div className="max-w-6xl mx-auto p-8 space-y-12">
			{/* Header */}
			<div className="text-center">
				<Heading
					level={1}
					variant="primary"
					className="mb-4">
					QuizMaster Design System
				</Heading>
				<Text
					variant="muted"
					size="lg">
					A comprehensive collection of reusable components for consistent UI
					design
				</Text>
			</div>

			{/* Typography Section */}
			<section className="space-y-6">
				<Heading
					level={2}
					variant="primary">
					Typography Components
				</Heading>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{/* Headings */}
					<div className="space-y-4">
						<Heading level={3}>Headings</Heading>
						<div className="space-y-2">
							<Heading level={1}>Heading 1</Heading>
							<Heading level={2}>Heading 2</Heading>
							<Heading level={3}>Heading 3</Heading>
							<Heading level={4}>Heading 4</Heading>
							<Heading level={5}>Heading 5</Heading>
							<Heading level={6}>Heading 6</Heading>
						</div>
					</div>

					{/* Text Variants */}
					<div className="space-y-4">
						<Heading level={3}>Text Variants</Heading>
						<div className="space-y-2">
							<Text variant="body">Body text - Default text style</Text>
							<Text variant="muted">Muted text - Secondary information</Text>
							<Text variant="primary">Primary text - Important content</Text>
							<Text variant="success">Success text - Positive feedback</Text>
							<Text variant="warning">Warning text - Caution messages</Text>
							<Text variant="error">Error text - Error messages</Text>
						</div>
					</div>
				</div>

				{/* Labels and Captions */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div className="space-y-4">
						<Heading level={3}>Labels</Heading>
						<div className="space-y-2">
							<Label>Default Label</Label>
							<Label variant="primary">Primary Label</Label>
							<Label variant="required">Required Field *</Label>
						</div>
					</div>

					<div className="space-y-4">
						<Heading level={3}>Captions</Heading>
						<div className="space-y-2">
							<Caption>Default caption</Caption>
							<Caption variant="primary">Primary caption</Caption>
							<Caption variant="success">Success caption</Caption>
						</div>
					</div>
				</div>

				{/* Quote and Code */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div className="space-y-4">
						<Heading level={3}>Quotes</Heading>
						<Quote>
							"The best way to predict the future is to invent it." - Alan Kay
						</Quote>
						<Quote variant="primary">
							"Design is not just what it looks like and feels like. Design is
							how it works." - Steve Jobs
						</Quote>
					</div>

					<div className="space-y-4">
						<Heading level={3}>Code</Heading>
						<Code variant="inline">const greeting = "Hello World";</Code>
						<Code variant="block">
							{`function greet(name) {
  return \`Hello, \${name}!\`;
}`}
						</Code>
					</div>
				</div>

				{/* Links */}
				<div className="space-y-4">
					<Heading level={3}>Links</Heading>
					<div className="space-y-2">
						<Link
							href="#"
							variant="primary">
							Primary Link
						</Link>
						<Link
							href="#"
							variant="secondary">
							Secondary Link
						</Link>
						<Link
							href="#"
							variant="muted">
							Muted Link
						</Link>
						<Link
							href="#"
							variant="white"
							className="bg-gray-800 px-4 py-2 rounded">
							White Link on Dark Background
						</Link>
					</div>
				</div>
			</section>

			{/* Button Section */}
			<section className="space-y-6">
				<Heading
					level={2}
					variant="primary">
					Button Components
				</Heading>

				{/* Standard Buttons */}
				<div className="space-y-4">
					<Heading level={3}>Standard Buttons</Heading>
					<div className="flex flex-wrap gap-4">
						<Button variant="default">Default</Button>
						<Button variant="secondary">Secondary</Button>
						<Button variant="outline">Outline</Button>
						<Button variant="ghost">Ghost</Button>
						<Button variant="link">Link</Button>
						<Button variant="destructive">Destructive</Button>
					</div>
				</div>

				{/* Quiz-Specific Buttons */}
				<div className="space-y-4">
					<Heading level={3}>Quiz-Specific Buttons</Heading>
					<div className="flex flex-wrap gap-4">
						<QuizButton>Start Quiz</QuizButton>
						<Button variant="quiz">Quiz Variant</Button>
						<Button variant="success">Correct Answer</Button>
						<Button variant="warning">Time Warning</Button>
						<Button variant="info">Information</Button>
					</div>
				</div>

				{/* Gradient Buttons */}
				<div className="space-y-4">
					<Heading level={3}>Gradient Buttons</Heading>
					<div className="flex flex-wrap gap-4">
						<Button variant="gradientPrimary">Primary Gradient</Button>
						<Button variant="gradientSecondary">Secondary Gradient</Button>
						<Button variant="gradientSuccess">Success Gradient</Button>
					</div>
				</div>

				{/* Soft Buttons */}
				<div className="space-y-4">
					<Heading level={3}>Soft Buttons</Heading>
					<div className="flex flex-wrap gap-4">
						<Button variant="softPrimary">Soft Primary</Button>
						<Button variant="softSecondary">Soft Secondary</Button>
						<Button variant="softSuccess">Soft Success</Button>
						<Button variant="softWarning">Soft Warning</Button>
						<Button variant="softError">Soft Error</Button>
					</div>
				</div>

				{/* Button Sizes */}
				<div className="space-y-4">
					<Heading level={3}>Button Sizes</Heading>
					<div className="flex flex-wrap items-center gap-4">
						<Button size="xs">Extra Small</Button>
						<Button size="sm">Small</Button>
						<Button size="default">Default</Button>
						<Button size="lg">Large</Button>
						<Button size="xl">Extra Large</Button>
					</div>
				</div>

				{/* Icon Buttons */}
				<div className="space-y-4">
					<Heading level={3}>Icon Buttons</Heading>
					<div className="flex flex-wrap gap-4">
						<IconButton
							icon={<FaHeart />}
							variant="ghost"
						/>
						<IconButton
							icon={<FaStar />}
							variant="outline"
						/>
						<IconButton
							icon={<FaHome />}
							variant="default"
						/>
						<IconButton
							icon={<FaUser />}
							variant="secondary"
						/>
						<IconButton
							icon={<FaCog />}
							variant="ghost"
							size="iconLg"
						/>
					</div>
				</div>

				{/* Specialized Buttons */}
				<div className="space-y-4">
					<Heading level={3}>Specialized Buttons</Heading>
					<div className="flex flex-wrap gap-4">
						<SocialButton
							platform="google"
							icon={<FaUser />}>
							Sign in with Google
						</SocialButton>
						<SocialButton
							platform="facebook"
							icon={<FaHeart />}>
							Connect Facebook
						</SocialButton>
						<ToggleButton
							active={toggleState}
							onClick={() => setToggleState(!toggleState)}>
							Toggle {toggleState ? "On" : "Off"}
						</ToggleButton>
					</div>
				</div>

				{/* Loading States */}
				<div className="space-y-4">
					<Heading level={3}>Loading States</Heading>
					<div className="flex flex-wrap gap-4">
						<Button loading>Loading...</Button>
						<Button
							loading
							variant="quiz">
							Processing...
						</Button>
						<Button
							loading
							variant="outline">
							Saving...
						</Button>
					</div>
				</div>
			</section>

			{/* Color System Section */}
			<section className="space-y-6">
				<Heading
					level={2}
					variant="primary">
					Color System
				</Heading>

				{/* Color Badges */}
				<div className="space-y-4">
					<Heading level={3}>Color Badges</Heading>
					<div className="flex flex-wrap gap-4">
						<ColorBadge
							color="primary"
							variant="solid">
							Primary
						</ColorBadge>
						<ColorBadge
							color="primary"
							variant="soft">
							Primary Soft
						</ColorBadge>
						<ColorBadge
							color="primary"
							variant="outline">
							Primary Outline
						</ColorBadge>
						<ColorBadge
							color="success"
							variant="solid">
							Success
						</ColorBadge>
						<ColorBadge
							color="warning"
							variant="solid">
							Warning
						</ColorBadge>
						<ColorBadge
							color="error"
							variant="solid">
							Error
						</ColorBadge>
					</div>
				</div>

				{/* Gradient Backgrounds */}
				<div className="space-y-4">
					<Heading level={3}>Gradient Backgrounds</Heading>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<GradientBackground
							gradient="primary"
							className="p-6 rounded-lg text-white">
							<Heading
								level={4}
								variant="white">
								Primary Gradient
							</Heading>
							<Text variant="white">Beautiful gradient background</Text>
						</GradientBackground>
						<GradientBackground
							gradient="sunset"
							className="p-6 rounded-lg text-white">
							<Heading
								level={4}
								variant="white">
								Sunset Gradient
							</Heading>
							<Text variant="white">Warm and inviting</Text>
						</GradientBackground>
						<GradientBackground
							gradient="ocean"
							className="p-6 rounded-lg text-white">
							<Heading
								level={4}
								variant="white">
								Ocean Gradient
							</Heading>
							<Text variant="white">Cool and calming</Text>
						</GradientBackground>
					</div>
				</div>

				{/* Color Palette */}
				<div className="space-y-4">
					<Heading level={3}>Color Palette</Heading>
					<ColorPalette colors={sampleColors} />
				</div>

				{/* Theme Switcher */}
				<div className="space-y-4">
					<Heading level={3}>Theme Switcher</Heading>
					<ThemeSwitcher
						currentTheme={activeTheme}
						onThemeChange={setActiveTheme}
					/>
				</div>
			</section>

			{/* Usage Examples */}
			<section className="space-y-6">
				<Heading
					level={2}
					variant="primary">
					Usage Examples
				</Heading>

				{/* Quiz Card Example */}
				<div className="space-y-4">
					<Heading level={3}>Quiz Card Example</Heading>
					<div className="bg-white rounded-lg shadow-lg p-6 border">
						<div className="flex items-center justify-between mb-4">
							<Heading level={4}>Bible Knowledge Quiz</Heading>
							<ColorBadge
								color="success"
								variant="soft">
								Easy
							</ColorBadge>
						</div>
						<Text
							variant="muted"
							className="mb-4">
							Test your knowledge of biblical stories and teachings with this
							comprehensive quiz.
						</Text>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Caption variant="primary">10 questions</Caption>
								<Caption variant="muted">• 5 minutes</Caption>
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm">
									Preview
								</Button>
								<QuizButton size="sm">Start Quiz</QuizButton>
							</div>
						</div>
					</div>
				</div>

				{/* Navigation Example */}
				<div className="space-y-4">
					<Heading level={3}>Navigation Example</Heading>
					<div className="bg-gray-50 rounded-lg p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<Heading
									level={5}
									variant="primary">
									QuizMaster
								</Heading>
								<nav className="flex items-center gap-4">
									<Link
										href="#"
										variant="muted">
										Home
									</Link>
									<Link
										href="#"
										variant="muted">
										Quizzes
									</Link>
									<Link
										href="#"
										variant="muted">
										Leaderboard
									</Link>
									<Link
										href="#"
										variant="muted">
										Profile
									</Link>
								</nav>
							</div>
							<div className="flex items-center gap-2">
								<IconButton
									icon={<FaUser />}
									variant="ghost"
								/>
								<Button
									variant="primary"
									size="sm">
									Sign In
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* Form Example */}
				<div className="space-y-4">
					<Heading level={3}>Form Example</Heading>
					<div className="bg-white rounded-lg shadow-lg p-6 border max-w-md">
						<Heading
							level={4}
							className="mb-4">
							Create New Quiz
						</Heading>
						<form className="space-y-4">
							<div>
								<Label
									variant="required"
									className="block mb-2">
									Quiz Title
								</Label>
								<input
									type="text"
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
									placeholder="Enter quiz title"
								/>
							</div>
							<div>
								<Label className="block mb-2">Description</Label>
								<textarea
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
									rows={3}
									placeholder="Enter quiz description"
								/>
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									className="flex-1">
									Cancel
								</Button>
								<Button
									variant="primary"
									className="flex-1">
									Create Quiz
								</Button>
							</div>
						</form>
					</div>
				</div>
			</section>

			{/* Floating Action Button */}
			<FloatingButton
				icon={<FaArrowRight />}
				onClick={() => alert("Floating button clicked!")}>
				Quick Action
			</FloatingButton>
		</div>
	);
};

export default UsageGuide;
