"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Brain,
	Home,
	User,
	LogOut,
	BarChart2,
	Bot,
	Menu as MenuIcon,
	X as CloseIcon,
} from "lucide-react";
import { FaUserCircle } from "react-icons/fa";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/enhanced-button";
import { useRouter } from "next/navigation";

// Helper for performance color/icon
const getPerformanceColor = (percent) => {
	if (percent >= 80) return "from-green-500 to-emerald-600";
	if (percent >= 60) return "from-yellow-500 to-orange-500";
	return "from-red-500 to-pink-600";
};
const getPerformanceIcon = (percent) => {
	if (percent >= 80) return <BarChart2 className="w-6 h-6 text-green-500" />;
	if (percent >= 60) return <BarChart2 className="w-6 h-6 text-yellow-500" />;
	return <BarChart2 className="w-6 h-6 text-red-500" />;
};

const DESKTOP_MENU = [
	{ href: "/", icon: <Home className="w-6 h-6" />, label: "Home" },
	{
		href: null,
		icon: <Bot className="w-6 h-6" />,
		label: "Chat with AI coming soon..",
	},
	{
		href: "/student/profile",
		icon: <User className="w-6 h-6" />,
		label: "Profile",
	},
	{
		href: null,
		icon: <BarChart2 className="w-6 h-6 text-purple-500" />,
		label: "Performance",
		isPerformance: true,
	},
	{
		href: null,
		icon: <LogOut className="w-6 h-6 text-red-500" />,
		label: "Logout",
		isLogout: true,
	},
];

export default function MenuBar() {
	const [userData, setUserData] = useState(null);
	const [showLogout, setShowLogout] = useState(false);
	const [quizPerf, setQuizPerf] = useState(null);
	const [open, setOpen] = useState(false);
	const [hovered, setHovered] = useState(null);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const router = useRouter();

	// Close mobile menu when screen size changes to desktop
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 768 && open) {
				setOpen(false);
			}
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [open]);

	// Fetch user info
	useEffect(() => {
		async function getUser() {
			const { data } = await supabase.auth.getUser();
			const user_email = data?.user?.email;
			if (!user_email) return;
			const { data: userData } = await supabase
				.from("users_profile")
				.select("email, name, class, denomination")
				.eq("email", user_email);
			if (userData && userData.length > 0) setUserData(userData[0]);
		}
		getUser();
	}, []);

	// Fetch quiz performance from localStorage
	useEffect(() => {
		try {
			const quizResults = localStorage.getItem("quizResults");
			if (quizResults) {
				const { answers, questions } = JSON.parse(quizResults);
				const correct = answers.filter(
					(a, i) => a === questions[i].answer
				).length;
				setQuizPerf({
					correct,
					total: questions.length,
					percent: Math.round((correct / questions.length) * 100),
				});
			}
		} catch (e) {
			setQuizPerf(null);
		}
	}, []);

	// Logout logic
	const handleLogout = async () => {
		setIsLoggingOut(true);
		setShowLogout(false);

		try {
			const { error } = await supabase.auth.signOut();
			if (!error) {
				// Add a small delay to show the overlay animation
				setTimeout(() => {
					window.location.href = "/authenticate";
				}, 1500);
			} else {
				setIsLoggingOut(false);
			}
		} catch (error) {
			setIsLoggingOut(false);
		}
	};

	// Handle navigation
	const handleNavigation = (href) => {
		if (href) {
			router.push(href);
			setOpen(false);
		}
	};

	// Handle home navigation based on user class
	const handleHomeNavigation = () => {
		router.push("/student/home");

		setOpen(false);
	};

	// Side menu animation variants (for mobile)
	const sideVariants = {
		closed: { x: "100%", opacity: 0 },
		open: {
			x: 0,
			opacity: 1,
			transition: { type: "spring", stiffness: 300, damping: 30 },
		},
	};

	return (
		<>
			{/* Hamburger Button (top-right for mobile) */}
			<button
				className="fixed top-5 right-5 z-[100] p-2 rounded-full bg-white/70 shadow-lg backdrop-blur-md border border-white/40 hover:bg-white/90 transition md:hidden"
				onClick={() => setOpen(true)}
				aria-label="Open menu">
				<MenuIcon className="w-7 h-7 text-blue-600" />
			</button>

			{/* Desktop: Mini vertical bar with hover popout */}
			<div className="hidden md:flex fixed top-1/2 left-4 -translate-y-1/2 z-50 flex-col items-center gap-4 bg-white/60 backdrop-blur-2xl border border-white/40 rounded-2xl shadow-2xl px-2 py-4 glassmorphism">
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}>
					<Brain className="w-8 h-8 text-blue-600 mb-4" />
				</motion.div>
				{DESKTOP_MENU.map((item, idx) => (
					<div
						key={item.label}
						className="relative flex flex-col items-center w-full"
						onMouseEnter={() => setHovered(idx)}
						onMouseLeave={() => setHovered(null)}>
						{/* Icon or button */}
						{item.isPerformance && quizPerf ? (
							<button
								onClick={() => setOpen(true)}
								className="p-2 rounded-full hover:bg-blue-100 transition flex items-center justify-center"
								aria-label={item.label}>
								{item.icon}
							</button>
						) : item.isLogout ? (
							<button
								onClick={() => setShowLogout(true)}
								className="p-2 rounded-full hover:bg-red-100 transition flex items-center justify-center"
								aria-label={item.label}>
								{item.icon}
							</button>
						) : item.label === "Home" ? (
							<button
								onClick={handleHomeNavigation}
								className="p-2 rounded-full hover:bg-blue-100 transition flex items-center justify-center"
								aria-label={item.label}>
								{item.icon}
							</button>
						) : (
							<button
								onClick={() => handleNavigation(item.href)}
								className="p-2 rounded-full hover:bg-blue-100 transition flex items-center justify-center"
								aria-label={item.label}>
								{item.icon}
							</button>
						)}
						{/* Animated label popout */}
						<AnimatePresence>
							{hovered === idx && (
								<motion.div
									initial={{ opacity: 0, x: 10 }}
									animate={{ opacity: 1, x: 40 }}
									exit={{ opacity: 0, x: 10 }}
									transition={{
										duration: 0.35,
										type: "spring",
										stiffness: 200,
										damping: 20,
									}}
									className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-4 py-2 bg-white/90 shadow-lg rounded-xl border border-white/60 text-gray-800 font-semibold text-sm whitespace-nowrap pointer-events-none select-none">
									{item.label}
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				))}
			</div>

			{/* Side Drawer (Mobile & Desktop expanded) - now slides from right */}
			<AnimatePresence>
				{open && (
					<motion.aside
						initial="closed"
						animate="open"
						exit="closed"
						variants={sideVariants}
						className="fixed top-0 right-0 h-full w-72 max-w-[90vw] z-[200] bg-white/80 backdrop-blur-2xl border-l border-white/40 shadow-2xl flex flex-col py-8 px-6 glassmorphism">
						{/* Close Button - moved to top-right */}
						<button
							className="absolute top-4 right-4 p-2 rounded-full bg-white/70 hover:bg-white/90 border border-white/40 shadow"
							onClick={() => setOpen(false)}
							aria-label="Close menu">
							<CloseIcon className="w-6 h-6 text-blue-600" />
						</button>
						{/* User Info */}
						<div className="flex items-center gap-3 mb-6">
							<div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
								<FaUserCircle className="w-10 h-10 text-white" />
							</div>
							<div className="flex flex-col">
								<span className="text-base font-bold text-gray-800">
									{userData?.name || "User"}
								</span>
								<span className="text-xs text-gray-500">
									{userData?.email || "-"}
								</span>
								{userData?.class && (
									<span className="text-xs text-blue-500 font-semibold">
										{userData.class}
									</span>
								)}
							</div>
						</div>
						{/* Performance Widget */}
						{quizPerf && (
							<div className="flex flex-col items-center mb-8">
								<div
									className={`w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r ${getPerformanceColor(
										quizPerf.percent
									)} shadow-lg mb-1`}
									title={`Last Score: ${quizPerf.correct}/${quizPerf.total}`}>
									<span className="text-2xl font-bold text-white">
										{quizPerf.percent}%
									</span>
								</div>
								<span className="text-xs text-gray-700 font-medium">
									Last Score
								</span>
							</div>
						)}
						{/* Navigation Links */}
						<nav className="flex flex-col gap-3 mb-8">
							<DrawerNavLink
								href="/"
								icon={<Home className="w-5 h-5" />}
								onClick={handleHomeNavigation}>
								Home
							</DrawerNavLink>
							<DrawerNavLink
								href="/"
								icon={<Bot className="w-5 h-5" />}
								onClick={() => handleNavigation("/")}>
								Chat with AI coming out soon..
							</DrawerNavLink>
							<DrawerNavLink
								href="/student/profile"
								icon={<User className="w-5 h-5" />}
								onClick={() => handleNavigation("/student/profile")}>
								Profile
							</DrawerNavLink>
						</nav>
						{/* Logout Button */}
						<Button
							variant="gradientSecondary"
							size="lg"
							rounded="full"
							leftIcon={<LogOut className="w-5 h-5" />}
							onClick={() => setShowLogout(true)}
							className="mt-auto w-full">
							Logout
						</Button>
					</motion.aside>
				)}
			</AnimatePresence>

			{/* Logout Confirmation Modal */}
			<AnimatePresence>
				{showLogout && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[300] flex items-center justify-center bg-black/30 backdrop-blur-sm">
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							transition={{ duration: 0.3 }}
							className="bg-white/90 rounded-3xl shadow-2xl p-8 max-w-xs w-full border border-white/60 flex flex-col items-center text-center">
							<LogOut className="w-10 h-10 text-red-500 mb-2 animate-pulse" />
							<h3 className="text-xl font-bold mb-2 text-gray-800">Log Out?</h3>
							<p className="text-gray-600 mb-6">
								Are you sure you want to log out? <br />
								You'll need to log in again to access your quizzes.
							</p>
							<div className="flex gap-4 w-full">
								<Button
									variant="gradientSecondary"
									size="sm"
									rounded="full"
									className="flex-1"
									onClick={handleLogout}>
									Yes, Log Out
								</Button>
								<Button
									variant="softPrimary"
									size="sm"
									rounded="full"
									className="flex-1"
									onClick={() => setShowLogout(false)}>
									No, Stay
								</Button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Logout Overlay */}
			<AnimatePresence>
				{isLoggingOut && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[400] bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
						{/* Animated Background Elements */}
						<div className="absolute inset-0 overflow-hidden">
							<motion.div
								animate={{
									scale: [1, 1.2, 1],
									rotate: [0, 180, 360],
									opacity: [0.3, 0.6, 0.3],
								}}
								transition={{
									duration: 3,
									repeat: Infinity,
									ease: "easeInOut",
								}}
								className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-xl"
							/>
							<motion.div
								animate={{
									scale: [1.2, 1, 1.2],
									rotate: [360, 180, 0],
									opacity: [0.4, 0.7, 0.4],
								}}
								transition={{
									duration: 4,
									repeat: Infinity,
									ease: "easeInOut",
									delay: 1,
								}}
								className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-r from-pink-400/30 to-orange-400/30 rounded-full blur-xl"
							/>
							<motion.div
								animate={{
									scale: [1, 1.3, 1],
									rotate: [180, 360, 180],
									opacity: [0.2, 0.5, 0.2],
								}}
								transition={{
									duration: 5,
									repeat: Infinity,
									ease: "easeInOut",
									delay: 2,
								}}
								className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-r from-green-400/30 to-blue-400/30 rounded-full blur-xl"
							/>
						</div>

						{/* Main Content */}
						<div className="relative z-10 text-center">
							{/* Logo Animation */}
							<motion.div
								animate={{
									scale: [1, 1.1, 1],
									rotate: [0, 5, -5, 0],
								}}
								transition={{
									duration: 2,
									repeat: Infinity,
									ease: "easeInOut",
								}}
								className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
								<Brain className="w-12 h-12 text-white" />
							</motion.div>

							{/* Loading Text */}
							<motion.h2
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
								className="text-3xl font-bold text-white mb-4">
								Logging Out...
							</motion.h2>

							{/* Progress Bar */}
							<div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden mx-auto mb-6">
								<motion.div
									initial={{ width: 0 }}
									animate={{ width: "100%" }}
									transition={{ duration: 1.5, ease: "easeInOut" }}
									className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full"
								/>
							</div>

							{/* Status Messages */}
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.5 }}
								className="space-y-2">
								<motion.p
									animate={{ opacity: [0.5, 1, 0.5] }}
									transition={{ duration: 1.5, repeat: Infinity }}
									className="text-blue-200 text-sm">
									Securing your session...
								</motion.p>
								<motion.p
									animate={{ opacity: [0.5, 1, 0.5] }}
									transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
									className="text-purple-200 text-sm">
									Clearing local data...
								</motion.p>
								<motion.p
									animate={{ opacity: [0.5, 1, 0.5] }}
									transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
									className="text-pink-200 text-sm">
									Redirecting to login...
								</motion.p>
							</motion.div>

							{/* Floating Particles */}
							<div className="absolute inset-0 pointer-events-none">
								{[...Array(6)].map((_, i) => (
									<motion.div
										key={i}
										animate={{
											y: [0, -20, 0],
											x: [0, Math.random() * 40 - 20, 0],
											opacity: [0, 1, 0],
											scale: [0, 1, 0],
										}}
										transition={{
											duration: 2,
											repeat: Infinity,
											delay: i * 0.3,
											ease: "easeInOut",
										}}
										className="absolute w-2 h-2 bg-white/60 rounded-full"
										style={{
											left: `${20 + i * 15}%`,
											top: `${30 + i * 10}%`,
										}}
									/>
								))}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}

// Drawer nav link
function DrawerNavLink({ href, icon, children, onClick }) {
	return (
		<button
			onClick={onClick}
			className="flex items-center gap-2 px-4 py-3 rounded-xl text-gray-700 font-semibold hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 transition-all duration-200 text-base w-full text-left">
			{icon}
			<span>{children}</span>
		</button>
	);
}
