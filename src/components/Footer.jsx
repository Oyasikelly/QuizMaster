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
					<p className="text-gray-700 self-center text-center md:text-right text-sm md:text-base leading-relaxed">
						<span className="block mb-1">
							&copy; 2024{" "}
							<span className="font-bold text-blue-700">QuizMaster</span>. All
							rights reserved.
						</span>
						<span className="block mb-1">
							Developed by{" "}
							<span className="font-semibold text-purple-600">
								Kelscode Agency
							</span>
						</span>
						<span className="block">
							Contact:&nbsp;
							<a
								href="mailto:oyasikelly28@gmail.com"
								className="text-blue-600 hover:underline font-medium transition-colors">
								oyasikelly28@gmail.com
							</a>
							&nbsp;|&nbsp;
							<a
								href="tel:+2349068318254"
								className="text-blue-600 hover:underline font-medium transition-colors">
								+234 9068 318 254
							</a>
						</span>
					</p>
				</div>
			</div>
		</footer>
	);
}
