"use client";

import { motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { FaUser, FaEnvelope, FaGraduationCap } from "react-icons/fa";

// component
import SelectTime from "../components/SelectTime";

const Introduction = ({ category }) => {
	const [userData, setUserData] = useState([]);
	const [name, setName] = useState({
		name: "",
	});
	useEffect(() => {
		async function getUser() {
			const { data, error } = await supabase.auth.getUser();
			const user_email = data?.user?.email;
			const { data: userData, error: userError } = await supabase
				.from("users_profile")
				.select("email, name, class, denomination") // Select multiple columns
				.eq("email", user_email);

			if (userData) {
				setUserData(userData);

				const [userName, ...others] = userData;
				setName({
					name: userName.name,
				});
				console.log(name);
			}
			if (userError) console.error(userError);
		}

		getUser();
	}, []);

	return (
		<div className="flex flex-col items-center pt-10 pb-16 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-800 px-4 sm:px-8 py-6">
			{/* Animated Background Elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
				<div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
			</div>

			{/* Main Content */}
			<motion.div
				initial={{ opacity: 0, y: 50 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
				className="relative z-10 text-center max-w-4xl w-full mt-8">
				{/* <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-8 mb-8"> */}
				<h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
					Welcome{" "}
					<span className="text-blue-600 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
						{name.name}
					</span>
				</h1>
				{/* <p className="text-base md:text-lg lg:text-xl mb-6 leading-relaxed text-gray-700">
					This quiz tests your knowledge on various topics, from life
					experiences to Bible lessons, principles, and faith. Challenge your
					intellect and learn along the way!
				</p> */}
				{/* </div> */}

				<div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-8">
					<Suspense
						fallback={
							<div className="text-center text-gray-600">Loading Quiz...</div>
						}>
						{SelectTime ? (
							<SelectTime />
						) : (
							<div className="text-red-500">
								Unable to load the timer component.
							</div>
						)}
					</Suspense>
				</div>
			</motion.div>
		</div>
	);
};

export default Introduction;
