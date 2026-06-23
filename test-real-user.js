// Test script to show how real user names work
const https = require("https");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔍 How Real User Names Work in Email Notifications");
console.log("==================================================");

console.log("\n📋 How it works:");
console.log("1. When a student completes a quiz, their student_id is saved");
console.log(
	"2. The Edge Function looks up this student_id in users_profile table"
);
console.log("3. It finds the user's name and includes it in the email");
console.log('4. If no user is found, it shows "Unknown User"');

console.log("\n🎯 In Real Application:");
console.log("- Student logs in with their account");
console.log("- Their user ID is used as student_id when they take a quiz");
console.log("- Email notification shows their actual name");

console.log("\n📊 Test Scenarios:");

// Test 1: Unknown user (like our previous test)
const testUnknownUser = {
	table_name: "quiz_results",
	operation: "INSERT",
	data: {
		student_id: "fake-user-id-that-does-not-exist",
		score: 85,
		total_questions: 100,
		timestamp: new Date().toISOString(),
	},
};

// Test 2: Real user (you would use an actual user ID from your database)
const testRealUser = {
	table_name: "quiz_results",
	operation: "INSERT",
	data: {
		student_id: "REAL_USER_ID_FROM_YOUR_DATABASE", // Replace with actual user ID
		score: 95,
		total_questions: 100,
		timestamp: new Date().toISOString(),
	},
};

function testEdgeFunction(testData, description) {
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

		console.log(`\n📤 Testing: ${description}`);
		console.log(`📋 Student ID: ${testData.data.student_id}`);

		const req = https.request(options, (res) => {
			console.log(`📥 Status: ${res.statusCode}`);

			let data = "";
			res.on("data", (chunk) => {
				data += chunk;
			});

			res.on("end", () => {
				try {
					const parsed = JSON.parse(data);
					if (parsed.success) {
						console.log("✅ Email sent successfully!");
						console.log("📧 Check your email for the notification");
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

async function runTests() {
	try {
		// Test with unknown user (should show "Unknown User")
		await testEdgeFunction(testUnknownUser, "Unknown User Test");

		console.log("\n💡 To test with a real user:");
		console.log("1. Check your users_profile table for actual user IDs");
		console.log(
			'2. Replace "REAL_USER_ID_FROM_YOUR_DATABASE" with an actual user ID'
		);
		console.log("3. Run the test again to see the real user name in the email");

		console.log("\n📊 Database Check:");
		console.log(
			"You can check your users_profile table in Supabase Dashboard to see:"
		);
		console.log("- What user IDs exist");
		console.log("- What names are stored");
		console.log("- Use one of those IDs for testing");
	} catch (error) {
		console.error("❌ Test failed:", error);
	}
}

runTests();
