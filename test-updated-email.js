// Test script for updated email notifications with user names
const https = require("https");

const SUPABASE_URL = "https://YOUR_SUPABASE_URL.supabase.co";
const SUPABASE_ANON_KEY =
	"***REMOVED***";

console.log("🧪 Testing Updated Email Notifications with User Names...");

// Test quiz result with a realistic student ID
const testQuizResult = {
	table_name: "quiz_results",
	operation: "INSERT",
	data: {
		student_id: "test-user-with-name", // This should match a user in your database
		score: 92,
		total_questions: 100,
		timestamp: new Date().toISOString(),
	},
};

function testEdgeFunction(testData) {
	return new Promise((resolve, reject) => {
		const postData = JSON.stringify(testData);
		const url = new URL(SUPABASE_URL);

		const options = {
			hostname: url.hostname,
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

		console.log("📤 Sending test notification with user name lookup...");
		console.log("📋 Data:", JSON.stringify(testData, null, 2));
		console.log(
			"🔍 The function will now try to fetch the user name from the database..."
		);

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

					if (parsed.success) {
						console.log("🎉 Email notification sent successfully!");
						console.log(
							"📧 Check your email for the updated notification with user name"
						);
					}

					resolve(parsed);
				} catch (e) {
					console.log("⚠️ Raw response:", data);
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

async function runTest() {
	try {
		console.log("📝 Note: This test uses a sample student ID.");
		console.log(
			"💡 For real testing, use an actual user ID from your database."
		);
		console.log("");

		await testEdgeFunction(testQuizResult);

		console.log("\n✅ Test completed!");
		console.log("📧 Check your email for the updated notification");
		console.log(
			'🔍 The email should now include the user name (or "Unknown User" if not found)'
		);
	} catch (error) {
		console.error("❌ Test failed:", error);
	}
}

// Instructions for manual deployment
console.log("📋 To deploy the updated Edge Function:");
console.log("1. Go to your Supabase Dashboard");
console.log("2. Navigate to Edge Functions");
console.log("3. Upload the updated table-notifications function");
console.log("4. Or use the Supabase CLI if available");
console.log("");

runTest();
