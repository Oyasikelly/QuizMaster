"use client";

import { motion } from "framer-motion";
import { FaShieldAlt, FaHome, FaArrowLeft } from "react-icons/fa";
import Link from "next/link";

const AccessDenied = () => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5 }}
				className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
				{/* Icon */}
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ delay: 0.2 }}
					className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
					<FaShieldAlt className="text-red-600 text-3xl" />
				</motion.div>

				{/* Title */}
				<motion.h1
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="text-2xl font-bold text-gray-900 mb-4">
					Access Denied
				</motion.h1>

				{/* Message */}
				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="text-gray-600 mb-8">
					You don't have permission to access this page. Please contact your
					administrator if you believe this is an error.
				</motion.p>

				{/* Buttons */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className="space-y-3">
					<Link href="/">
						<button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center space-x-2">
							<FaHome size={16} />
							<span>Go Home</span>
						</button>
					</Link>

					<button
						onClick={() => window.history.back()}
						className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center space-x-2">
						<FaArrowLeft size={16} />
						<span>Go Back</span>
					</button>
				</motion.div>
			</motion.div>
		</div>
	);
};

export default AccessDenied;
