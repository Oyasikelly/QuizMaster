// Auto-generated test script with your credentials
const https = require("https");

const SUPABASE_URL = "https://eubroxxcchuozvpcwbdv.supabase.co";
const SUPABASE_ANON_KEY =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1YnJveHhjY2h1b3p2cGN3YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NDAxODgsImV4cCI6MjA1MTUxNjE4OH0.l48Pw0Jr1rUaHO-9eKt988yOZH8ovEwqu5BvZTrYjCc";

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
