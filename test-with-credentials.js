// Auto-generated test script with your credentials
const https = require("https");

const SUPABASE_URL = "https://YOUR_SUPABASE_URL.supabase.co";
const SUPABASE_ANON_KEY =
	"***REMOVED***";

console.log("🧪 Testing Email Notifications with your credentials...");

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

		console.log("📤 Sending test notification...");
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
		await testEdgeFunction(testQuizResult);
		console.log("\n✅ Test completed!");
		console.log("📧 Check your email for notifications");
	} catch (error) {
		console.error("❌ Test failed:", error);
	}
}

runTest();
