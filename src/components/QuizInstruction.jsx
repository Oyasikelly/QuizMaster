import React from "react";

export default function QuizInstructions() {
	return (
		<div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl mt-10 text-gray-800">
			<h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
				Welcome to QuizMaster!
			</h1>

			<p className="text-lg mb-4 text-center">
				Get ready to test your knowledge in a fun, fast, and fair way.
			</p>

			<div className="space-y-6">
				<section>
					<h2 className="text-2xl font-semibold text-purple-600 mb-2">
						Getting Started
					</h2>
					<ul className="list-disc list-inside space-y-2">
						<li>
							<strong>Sign Up First:</strong> Create an account using your email
							address. A verification email will be sent to you immediately.
						</li>
						<li>
							<strong>Verify Your Email:</strong> Click the confirmation link
							sent by Supabase in your email to activate your account.
						</li>
						<li>
							<strong>Log In:</strong> After verifying, return and log in using
							your email and password. Save your login details for future
							access.
						</li>
					</ul>
				</section>

				<section>
					<h2 className="text-2xl font-semibold text-purple-600 mb-2">
						Using the App
					</h2>
					<ul className="list-disc list-inside space-y-2">
						<li>Once logged in, you’ll be taken to your quiz dashboard.</li>
						<li>
							Select the number of questions and time duration for your quiz.
						</li>
						<li>
							Start your quiz when ready. Answer carefully and manage your time
							wisely.
						</li>
					</ul>
				</section>

				<section>
					<h2 className="text-2xl font-semibold text-purple-600 mb-2">
						Important Notes
					</h2>
					<ul className="list-disc list-inside space-y-2">
						<li>The quiz auto-submits when the timer runs out.</li>
						<li>
							You’ll instantly see your score, correct answers, and your
							selected options.
						</li>
						<li>Your results are safely stored with Supabase.</li>
					</ul>
				</section>

				<section>
					<h2 className="text-2xl font-semibold text-red-600 mb-2">
						Submission Window
					</h2>
					<p>
						The quiz is available today from <strong>8:30 PM to 9:30 PM</strong>
						. After 9:30 PM, submissions will be disabled — no exceptions.
					</p>
				</section>

				<section>
					<h2 className="text-2xl font-semibold text-green-600 mb-2">
						After the Quiz
					</h2>
					<p>
						Once your quiz is complete, you’ll be redirected back to the home
						screen. Only one submission is allowed per user.
					</p>
				</section>
			</div>
		</div>
	);
}
