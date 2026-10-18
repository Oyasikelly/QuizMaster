import { Brain } from "lucide-react";

export default function Footer() {
	const year = new Date().getFullYear();
	return (
		<footer className="px-4 sm:px-6 py-12 bg-white text-gray-800 border-t border-gray-200 rounded-t-3xl">
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col md:flex-row justify-between items-center gap-4">
					<div className="flex items-center space-x-2">
						<div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
							<Brain className="w-5 h-5 text-white" />
						</div>
						<span className="font-display text-xl font-bold text-gray-900">QuizMaster</span>
					</div>
					<p className="text-gray-600 self-center text-center md:text-right text-sm md:text-base leading-relaxed">
						<span className="block mb-1">
							&copy; {year} <span className="font-semibold text-brand-700">QuizMaster</span>. All
							rights reserved.
						</span>
						<span className="block mb-1">
							Developed by{" "}
							<span className="font-semibold text-brand-600">Kelscode Agency</span>
						</span>
						<span className="block">
							Contact:&nbsp;
							<a
								href="mailto:oyasikelly28@gmail.com"
								className="text-brand-600 hover:underline font-medium transition-colors">
								oyasikelly28@gmail.com
							</a>
							&nbsp;|&nbsp;
							<a
								href="tel:+2349068318254"
								className="text-brand-600 hover:underline font-medium transition-colors">
								+234 9068 318 254
							</a>
						</span>
					</p>
				</div>
			</div>
		</footer>
	);
}
