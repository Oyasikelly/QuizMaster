// Debug script to test quiz_settings table connection
// Run this with: node debug-quiz-settings.js

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error("❌ Missing Supabase environment variables");
	console.log("Please check your .env.local file");
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugQuizSettings() {
	console.log("🔍 Debugging quiz_settings table...");
	console.log("📡 Supabase URL:", supabaseUrl);
	console.log("🔑 Supabase Key:", supabaseKey ? "Present" : "Missing");

	try {
		console.log("\n📊 Testing database connection...");

		// Test basic connection
		const { data: testData, error: testError } = await supabase
			.from("quiz_settings")
			.select("count")
			.limit(1);

		if (testError) {
			console.error("❌ Database connection failed:", testError);
			return;
		}

		console.log("✅ Database connection successful");

		// Check if table exists and has data
		console.log("\n📋 Checking quiz_settings table...");
		const { data, error } = await supabase
			.from("quiz_settings")
			.select("*")
			.single();

		if (error) {
			console.log("❌ Error fetching settings:", error);

			if (error.code === "PGRST116") {
				console.log("📝 No settings found - table might be empty");

				// Try to create default settings
				console.log("🛠️  Creating default settings...");
				const { data: newData, error: insertError } = await supabase
					.from("quiz_settings")
					.insert({
						id: 1,
						is_active: false,
						time: 60,
						questions: 100,
						start_time: null,
						end_time: null,
						practice_mode: false,
					})
					.select()
					.single();

				if (insertError) {
					console.error("❌ Error creating default settings:", insertError);
				} else {
					console.log("✅ Default settings created:", newData);
				}
			}
		} else {
			console.log("✅ Settings found:", data);
		}
	} catch (err) {
		console.error("❌ Unexpected error:", err);
	}
}

debugQuizSettings();
