// Verify Edge Function deployment
// Run with: node verify-edge-function.js

const https = require("https");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔍 Verifying Edge Function Deployment...");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	console.error("❌ Environment variables not set");
	console.log("Please set:");
	console.log("- NEXT_PUBLIC_SUPABASE_URL");
	console.log("- NEXT_PUBLIC_SUPABASE_ANON_KEY");
	process.exit(1);
}

function checkFunctionHealth() {
	return new Promise((resolve, reject) => {
		const url = new URL(SUPABASE_URL);

		const options = {
			hostname: url.hostname,
			port: 443,
			path: "/functions/v1/table-notifications",
			method: "GET",
			headers: {
				Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
				apikey: SUPABASE_ANON_KEY,
			},
		};

		console.log("📡 Checking function availability...");

		const req = https.request(options, (res) => {
			console.log(`📊 Status Code: ${res.statusCode}`);

			let data = "";
			res.on("data", (chunk) => {
				data += chunk;
			});

			res.on("end", () => {
				if (res.statusCode === 200) {
					console.log("✅ Function is accessible");
					resolve(true);
				} else if (res.statusCode === 404) {
					console.log("❌ Function not found - may not be deployed");
					resolve(false);
				} else {
					console.log("⚠️ Unexpected response:", res.statusCode);
					console.log("Response:", data);
					resolve(false);
				}
			});
		});

		req.on("error", (e) => {
			console.error("❌ Connection error:", e.message);
			reject(e);
		});

		req.end();
	});
}

function testSimpleNotification() {
	return new Promise((resolve, reject) => {
		const testData = {
			table_name: "test",
			operation: "INSERT",
			data: { test: true },
		};

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

		console.log("🧪 Testing function with simple data...");

		const req = https.request(options, (res) => {
			console.log(`📥 Response Status: ${res.statusCode}`);

			let data = "";
			res.on("data", (chunk) => {
				data += chunk;
			});

			res.on("end", () => {
				console.log("📨 Response:", data);
				try {
					const parsed = JSON.parse(data);
					if (parsed.error) {
						console.log("⚠️ Function returned error:", parsed.error);
					} else {
						console.log("✅ Function is working");
					}
					resolve(parsed);
				} catch (e) {
					console.log("⚠️ Non-JSON response:", data);
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

async function runVerification() {
	try {
		console.log("🔧 Configuration:");
		console.log("- Supabase URL:", SUPABASE_URL);
		console.log("- Anon Key:", SUPABASE_ANON_KEY ? "✅ Set" : "❌ Not set");

		// Check if function is deployed
		const isDeployed = await checkFunctionHealth();

		if (isDeployed) {
			console.log("\n🎯 Function is deployed, testing functionality...");
			await testSimpleNotification();
		} else {
			console.log("\n❌ Function may not be deployed");
			console.log(
				"💡 Try running: npx supabase functions deploy table-notifications"
			);
		}
	} catch (error) {
		console.error("❌ Verification failed:", error);
	}
}

runVerification();
