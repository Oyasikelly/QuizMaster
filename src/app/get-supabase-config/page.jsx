"use client";
import { useEffect, useState } from "react";

export default function GetSupabaseConfig() {
	const [config, setConfig] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Get Supabase URL from environment
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		setConfig({
			url: supabaseUrl,
			key: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : "Not set",
			hasUrl: !!supabaseUrl,
			hasKey: !!supabaseKey,
		});
		setLoading(false);
	}, []);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p>Loading configuration...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen p-8 bg-gray-50">
			<div className="max-w-2xl mx-auto">
				<h1 className="text-3xl font-bold mb-8">Supabase Configuration</h1>

				<div className="bg-white rounded-lg shadow-lg p-6">
					<h2 className="text-xl font-semibold mb-4">Environment Variables</h2>

					<div className="space-y-4">
						<div>
							<strong>NEXT_PUBLIC_SUPABASE_URL:</strong>
							<div className="mt-1">
								{config.hasUrl ? (
									<div className="bg-green-50 border border-green-200 rounded p-3">
										<span className="text-green-800">✅ Set</span>
										<div className="text-sm text-gray-600 mt-1 break-all">
											{config.url}
										</div>
									</div>
								) : (
									<div className="bg-red-50 border border-red-200 rounded p-3">
										<span className="text-red-800">❌ Not set</span>
									</div>
								)}
							</div>
						</div>

						<div>
							<strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>
							<div className="mt-1">
								{config.hasKey ? (
									<div className="bg-green-50 border border-green-200 rounded p-3">
										<span className="text-green-800">✅ Set</span>
										<div className="text-sm text-gray-600 mt-1">
											{config.key}
										</div>
									</div>
								) : (
									<div className="bg-red-50 border border-red-200 rounded p-3">
										<span className="text-red-800">❌ Not set</span>
									</div>
								)}
							</div>
						</div>
					</div>

					{config.hasUrl && config.hasKey ? (
						<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
							<h3 className="font-semibold text-blue-800 mb-2">
								✅ Configuration Ready
							</h3>
							<p className="text-blue-700 text-sm">
								Your Supabase configuration is properly set up. You can now test
								the email notifications.
							</p>
						</div>
					) : (
						<div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
							<h3 className="font-semibold text-yellow-800 mb-2">
								⚠️ Configuration Missing
							</h3>
							<p className="text-yellow-700 text-sm">
								Please set up your Supabase environment variables in .env.local
								file.
							</p>
						</div>
					)}
				</div>

				<div className="mt-8 bg-white rounded-lg shadow-lg p-6">
					<h2 className="text-xl font-semibold mb-4">Next Steps</h2>

					<div className="space-y-3 text-sm">
						<div className="flex items-start space-x-2">
							<span className="text-blue-600 font-bold">1.</span>
							<span>
								Get your Supabase URL and anon key from your Supabase Dashboard
							</span>
						</div>
						<div className="flex items-start space-x-2">
							<span className="text-blue-600 font-bold">2.</span>
							<span>Create .env.local file in your project root with:</span>
						</div>
						<div className="ml-6 bg-gray-100 p-3 rounded font-mono text-xs">
							NEXT_PUBLIC_SUPABASE_URL=your-project-url
							<br />
							NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
						</div>
						<div className="flex items-start space-x-2">
							<span className="text-blue-600 font-bold">3.</span>
							<span>Get Resend API key from resend.com</span>
						</div>
						<div className="flex items-start space-x-2">
							<span className="text-blue-600 font-bold">4.</span>
							<span>Set RESEND_API_KEY in Supabase Edge Functions</span>
						</div>
						<div className="flex items-start space-x-2">
							<span className="text-blue-600 font-bold">5.</span>
							<span>
								Deploy Edge Function: npx supabase functions deploy
								table-notifications
							</span>
						</div>
						<div className="flex items-start space-x-2">
							<span className="text-blue-600 font-bold">6.</span>
							<span>Run database triggers SQL</span>
						</div>
						<div className="flex items-start space-x-2">
							<span className="text-blue-600 font-bold">7.</span>
							<span>Test with: node test-with-credentials.js</span>
						</div>
					</div>
				</div>

				<div className="mt-8">
					<a
						href="/test-db"
						className="text-blue-600 hover:underline">
						→ Test Database Connection
					</a>
				</div>
			</div>
		</div>
	);
}
