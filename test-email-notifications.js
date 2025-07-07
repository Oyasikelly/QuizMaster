// Simple test script to verify email notifications
// Run with: node test-email-notifications.js

const https = require("https");

// Configuration - Update these with your actual values
const SUPABASE_URL =
	process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const SUPABASE_ANON_KEY =
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";

console.log("🧪 Testing Email Notifications...");
console.log("📧 Supabase URL:", SUPABASE_URL);
console.log("🔑 Using anon key:", SUPABASE_ANON_KEY ? "✅ Set" : "❌ Not set");

// Test quiz result data
const testQuizResult = {
	table_name: "quiz_results",
	operation: "INSERT",
	data: {
		student_id: "test-student-" + Date.now(),
		score: 85,
		total_questions: 100,
		timestamp: new Date().toISOString(),
	},
};

// Test user profile data
const testUserProfile = {
	table_name: "users_profile",
	operation: "UPDATE",
	data: {
		id: "test-user-" + Date.now(),
		email: "test@example.com",
		name: "Test User",
		updated_at: new Date().toISOString(),
	},
};

function testEdgeFunction(testData) {
	return new Promise((resolve, reject) => {
		const postData = JSON.stringify(testData);

		// Extract hostname from URL
		const url = new URL(SUPABASE_URL);
		const hostname = url.hostname;

		const options = {
			hostname: hostname,
			port: 443,
			path: "/functions/v1/table-notifications",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Content-Length": Buffer.byteLength(postData),
				Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
				apikey: SUPABASE_ANON_KEY,
			},
		};

		console.log(`\n📤 Sending ${testData.table_name} ${testData.operation}...`);
		console.log("📋 Data:", JSON.stringify(testData, null, 2));

		const req = https.request(options, (res) => {
			console.log(`📥 Status: ${res.statusCode}`);

			let data = "";
			res.on("data", (chunk) => {
				data += chunk;
			});

			res.on("end", () => {
				console.log("📨 Response:", data);
				try {
					const parsed = JSON.parse(data);
					console.log("✅ Parsed response:", parsed);
					resolve(parsed);
				} catch (e) {
					console.log("⚠️ Raw response (not JSON):", data);
					resolve({ raw: data });
				}
			});
		});

		req.on("error", (e) => {
			console.error("❌ Request error:", e);
			reject(e);
		});

		req.write(postData);
		req.end();
	});
}

async function runTests() {
	try {
		console.log("\n🎯 Test 1: Quiz Result Notification");
		await testEdgeFunction(testQuizResult);

		console.log("\n🎯 Test 2: User Profile Notification");
		await testEdgeFunction(testUserProfile);

		console.log("\n✅ Tests completed!");
		console.log("📧 Check your email for notifications");
		console.log("📊 Check Supabase Edge Function logs for details");
	} catch (error) {
		console.error("❌ Test failed:", error);
	}
}

// Generate curl commands for manual testing
function generateCurlCommands() {
	console.log("\n🔄 Manual Test Commands:");
	console.log("=====================================");

	console.log("\n1. Test Quiz Result:");
	console.log(
		`curl -X POST '${SUPABASE_URL}/functions/v1/table-notifications' \\`
	);
	console.log(`  -H 'Authorization: Bearer ${SUPABASE_ANON_KEY}' \\`);
	console.log(`  -H 'apikey: ${SUPABASE_ANON_KEY}' \\`);
	console.log(`  -H 'Content-Type: application/json' \\`);
	console.log(`  -d '${JSON.stringify(testQuizResult)}'`);

	console.log("\n2. Test User Profile:");
	console.log(
		`curl -X POST '${SUPABASE_URL}/functions/v1/table-notifications' \\`
	);
	console.log(`  -H 'Authorization: Bearer ${SUPABASE_ANON_KEY}' \\`);
	console.log(`  -H 'apikey: ${SUPABASE_ANON_KEY}' \\`);
	console.log(`  -H 'Content-Type: application/json' \\`);
	console.log(`  -d '${JSON.stringify(testUserProfile)}'`);

	console.log("\n=====================================");
}

// Check if environment variables are set
if (!SUPABASE_URL || SUPABASE_URL === "https://your-project.supabase.co") {
	console.error("❌ Please set NEXT_PUBLIC_SUPABASE_URL environment variable");
	process.exit(1);
}

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === "your-anon-key") {
	console.error(
		"❌ Please set NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable"
	);
	process.exit(1);
}

// Run tests
runTests();

// Generate curl commands
generateCurlCommands();
