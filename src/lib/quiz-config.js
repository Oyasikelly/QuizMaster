// Quiz Configuration for Real Quiz Period
export const QUIZ_CONFIG = {
	// Practice Mode Settings (Flexible)
	PRACTICE: {
		time: 30, // Default practice time
		questions: 20, // Default practice questions
	},
};

// Get quiz settings from database
export const getQuizSettingsFromDB = async (supabase) => {
	try {
		console.log("🔍 Fetching quiz settings from database...");
		console.log(
			"🔍 Supabase client:",
			supabase ? "Available" : "Not available"
		);

		const { data, error } = await supabase
			.from("quiz_settings")
			.select("*")
			.single();

		if (error) {
			console.error("❌ Database error:", error);
			throw error;
		}

		console.log("📊 Quiz settings from database:", data);

		const settings = {
			REAL_QUIZ: {
				time: data.time || 60,
				questions: data.questions || 100,
				startTime: data.start_time,
				endTime: data.end_time,
				isActive: data.is_active || false,
			},
			PRACTICE: {
				time: 30,
				questions: 20,
			},
		};

		console.log("📋 Processed settings:", settings);
		return settings;
	} catch (error) {
		console.error("Error loading quiz settings:", error);
		// Return default settings if database is not available
		return {
			REAL_QUIZ: {
				time: 60,
				questions: 100,
				startTime: "2024-01-15T20:00:00Z",
				endTime: "2024-01-15T21:00:00Z",
				isActive: false,
			},
			PRACTICE: {
				time: 30,
				questions: 20,
			},
		};
	}
};

// Check if real quiz is currently active
export const isRealQuizActive = async (supabase) => {
	try {
		console.log("🔍 Checking if real quiz is active...");
		const settings = await getQuizSettingsFromDB(supabase);

		console.log("🎯 Quiz active setting:", settings.REAL_QUIZ.isActive);
		if (!settings.REAL_QUIZ.isActive) {
			console.log("❌ Quiz is not active in database");
			return false;
		}

		const now = new Date();
		const startTime = new Date(settings.REAL_QUIZ.startTime);
		const endTime = new Date(settings.REAL_QUIZ.endTime);

		console.log("🕐 Current time:", now.toISOString());
		console.log("📅 Start time:", startTime.toISOString());
		console.log("📅 End time:", endTime.toISOString());

		const isInRange = now >= startTime && now <= endTime;
		console.log("⏰ Is current time in quiz range:", isInRange);

		return isInRange;
	} catch (error) {
		console.error("Error checking quiz status:", error);
		return false;
	}
};

// Check if user has already taken the real quiz
export const hasUserTakenRealQuiz = async (supabase, userId) => {
	try {
		const settings = await getQuizSettingsFromDB(supabase);
		const { data, error } = await supabase
			.from("quiz_results")
			.select("timestamp")
			.eq("student_id", userId)
			.gte("timestamp", settings.REAL_QUIZ.startTime)
			.lte("timestamp", settings.REAL_QUIZ.endTime)
			.limit(1);

		if (error) {
			console.error("Error checking quiz history:", error);
			return false;
		}

		return data && data.length > 0;
	} catch (error) {
		console.error("Error checking quiz history:", error);
		return false;
	}
};

// Get quiz settings based on current state
export const getQuizSettings = async (supabase, isRealQuiz) => {
	try {
		const settings = await getQuizSettingsFromDB(supabase);
		if (isRealQuiz) {
			return {
				time: settings.REAL_QUIZ.time,
				questions: settings.REAL_QUIZ.questions,
				isRealQuiz: true,
			};
		} else {
			return {
				time: settings.PRACTICE.time,
				questions: settings.PRACTICE.questions,
				isRealQuiz: false,
			};
		}
	} catch (error) {
		console.error("Error getting quiz settings:", error);
		return {
			time: 30,
			questions: 20,
			isRealQuiz: false,
		};
	}
};
