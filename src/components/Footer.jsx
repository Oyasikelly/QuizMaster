import { Brain } from "lucide-react";

export default function Footer() {
	return (
		<footer className="px-6 py-12 bg-white text-gray-800 border-t border-gray-200 rounded-t-3xl">
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col md:flex-row justify-between items-center">
					<div className="flex items-center space-x-2 mb-4 md:mb-0">
						<div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
							<Brain className="w-5 h-5 text-white" />
						</div>
						<span className="text-xl font-bold text-gray-800">QuizMaster</span>
					</div>
					<p className="text-gray-600 self-center text-center md:text-right">
						© 2024 QuizMaster. All rights reserved. Developed with ❤️ by Kelly.
					</p>
				</div>
			</div>
		</footer>
	);
}
