// Test script to simulate table updates and trigger email notifications
// Run this with: node test-table-notifications.js

const https = require("https");

// =============================================================================
// GET YOUR SUPABASE CREDENTIALS:
// 1. Go to your Supabase Dashboard
// 2. Click on "Settings" → "API"
// 3. Copy your "Project URL" and "anon public" key
// 4. Replace the values below
// =============================================================================

// Replace with your actual Supabase project URL and anon key
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Test data for quiz_results table
const testQuizResult = {
	table_name: "quiz_results",
	operation: "INSERT",
	data: {
		student_id: "test-student-123",
		quiz_id: "adults-quiz-001",
		score: 85,
		submitted_at: new Date().toISOString(),
	},
};

// Test data for users_profile table
const testUserProfile = {
	table_name: "users_profile",
	operation: "UPDATE",
	data: {
		id: "user-123",
		email: "test@example.com",
		name: "John Doe",
		updated_at: new Date().toISOString(),
	},
};

// Function to make the POST request
function testFunction(tableUpdate) {
	const postData = JSON.stringify(tableUpdate);

	const options = {
		hostname: SUPABASE_URL.replace("https://", ""),
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

	const req = https.request(options, (res) => {
		console.log(`Status: ${res.statusCode}`);
		console.log(`Headers: ${JSON.stringify(res.headers)}`);

		let data = "";
		res.on("data", (chunk) => {
			data += chunk;
		});

		res.on("end", () => {
			console.log("Response:", data);
			try {
				const parsed = JSON.parse(data);
				console.log("Parsed response:", parsed);
			} catch (e) {
				console.log("Raw response (not JSON):", data);
			}
		});
	});

	req.on("error", (e) => {
		console.error("Request error:", e);
	});

	req.write(postData);
	req.end();
}

// Alternative: Test with curl command
function generateCurlCommand(tableUpdate) {
	const curlCommand = `curl -X POST '${SUPABASE_URL}/functions/v1/table-notifications' \\
  -H 'Authorization: Bearer ${SUPABASE_ANON_KEY}' \\
  -H 'apikey: ${SUPABASE_ANON_KEY}' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(tableUpdate)}'`;

	console.log(`\n=== CURL COMMAND FOR ${tableUpdate.table_name} ===`);
	console.log(curlCommand);
	console.log("============================================\n");
}

console.log("Testing Table Notifications Function...");

// Test quiz_results table update
console.log("1. Testing quiz_results INSERT:");
console.log("Test data:", testQuizResult);
generateCurlCommand(testQuizResult);

// Test users_profile table update
console.log("2. Testing users_profile UPDATE:");
console.log("Test data:", testUserProfile);
generateCurlCommand(testUserProfile);

// Uncomment the lines below to actually make the requests
// testFunction(testQuizResult);
// testFunction(testUserProfile);
