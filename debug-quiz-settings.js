// Debug script to check quiz settings
// Run this in your browser console to see what's happening

const debugQuizSettings = async () => {
	try {
		console.log("🔍 Checking quiz settings...");

		// Get current time
		const now = new Date();
		console.log("🕐 Current time:", now.toISOString());
		console.log("🕐 Current time (local):", now.toString());

		// Check if we can access Supabase
		if (typeof window !== "undefined" && window.supabase) {
			const { data, error } = await window.supabase
				.from("quiz_settings")
				.select("*")
				.single();

			if (error) {
				console.error("❌ Error loading settings:", error);
				return;
			}

			console.log("📊 Quiz Settings from Database:", data);

			// Check if quiz is active
			const isActive = data.is_active;
			console.log("🔒 Quiz Active:", isActive);

			if (isActive && data.start_time && data.end_time) {
				const startTime = new Date(data.start_time);
				const endTime = new Date(data.end_time);

				console.log("⏰ Start Time:", startTime.toString());
				console.log("⏰ End Time:", endTime.toString());
				console.log("⏰ Current Time:", now.toString());

				const isInTimeRange = now >= startTime && now <= endTime;
				console.log("✅ In Quiz Time Range:", isInTimeRange);

				if (isInTimeRange) {
					console.log("🎯 SHOULD BE REAL QUIZ MODE");
				} else {
					console.log("📚 SHOULD BE PRACTICE MODE");
					if (now < startTime) {
						console.log("⏳ Quiz hasn't started yet");
					} else {
						console.log("⏰ Quiz period has ended");
					}
				}
			} else {
				console.log("❌ Quiz is not active or missing time settings");
			}
		} else {
			console.log("❌ Supabase not available in window object");
		}
	} catch (error) {
		console.error("❌ Debug error:", error);
	}
};

// Run the debug function
debugQuizSettings();
