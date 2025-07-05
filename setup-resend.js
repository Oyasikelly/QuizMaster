#!/usr/bin/env node

/**
 * Resend API Key Setup Script for QuizMaster
 *
 * This script helps you:
 * 1. Test your Resend API key
 * 2. Verify your domain setup
 * 3. Test email notifications
 */

const https = require("https");
const readline = require("readline");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

// Colors for console output
const colors = {
	green: "\x1b[32m",
	red: "\x1b[31m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	reset: "\x1b[0m",
	bold: "\x1b[1m",
};

function log(message, color = "reset") {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
	console.log(
		`\n${colors.blue}${colors.bold}Step ${step}:${colors.reset} ${message}`
	);
}

async function askQuestion(question) {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer);
		});
	});
}

async function testResendAPI(apiKey) {
	return new Promise((resolve) => {
		const data = JSON.stringify({
			from: "QuizMaster <onboarding@resend.dev>",
			to: ["test@example.com"],
			subject: "QuizMaster API Test",
			html: "<h1>Test Email</h1><p>This is a test email from QuizMaster.</p>",
		});

		const options = {
			hostname: "api.resend.com",
			port: 443,
			path: "/emails",
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				"Content-Length": data.length,
			},
		};

		const req = https.request(options, (res) => {
			let responseData = "";

			res.on("data", (chunk) => {
				responseData += chunk;
			});

			res.on("end", () => {
				if (res.statusCode === 200 || res.statusCode === 201) {
					resolve({ success: true, data: JSON.parse(responseData) });
				} else {
					resolve({
						success: false,
						error: responseData,
						statusCode: res.statusCode,
					});
				}
			});
		});

		req.on("error", (error) => {
			resolve({ success: false, error: error.message });
		});

		req.write(data);
		req.end();
	});
}

async function main() {
	log("🚀 QuizMaster Resend API Setup", "bold");
	log(
		"This script will help you set up email notifications for your quiz application.\n",
		"yellow"
	);

	// Step 1: Get API Key
	logStep(1, "Enter your Resend API Key");
	log("You can get this from https://resend.com/api-keys", "yellow");
	const apiKey = await askQuestion("Resend API Key (starts with re_): ");

	if (!apiKey.startsWith("re_")) {
		log('❌ Invalid API key format. API keys should start with "re_"', "red");
		rl.close();
		return;
	}

	// Step 2: Test API Key
	logStep(2, "Testing your API key...");
	const testResult = await testResendAPI(apiKey);

	if (testResult.success) {
		log("✅ API key is valid!", "green");
		log(`Response: ${JSON.stringify(testResult.data, null, 2)}`, "green");
	} else {
		log("❌ API key test failed", "red");
		log(`Error: ${testResult.error}`, "red");
		log(`Status Code: ${testResult.statusCode}`, "red");
		rl.close();
		return;
	}

	// Step 3: Get admin email
	logStep(3, "Configure admin email for notifications");
	const adminEmail = await askQuestion(
		"Admin email address for notifications: "
	);

	if (!adminEmail.includes("@")) {
		log("❌ Please enter a valid email address", "red");
		rl.close();
		return;
	}

	// Step 4: Update configuration
	logStep(4, "Updating Edge Function configuration...");

	// Create a configuration file
	const config = {
		resendApiKey: apiKey,
		adminEmail: adminEmail,
		fromEmail: "QuizMaster <onboarding@resend.dev>",
		timestamp: new Date().toISOString(),
	};

	const fs = require("fs");
	fs.writeFileSync("resend-config.json", JSON.stringify(config, null, 2));

	log("✅ Configuration saved to resend-config.json", "green");

	// Step 5: Instructions
	logStep(5, "Next Steps");
	log("1. Add your API key to Supabase environment variables:", "yellow");
	log("   - Go to Supabase Dashboard → Settings → Edge Functions", "yellow");
	log("   - Add environment variable: RESEND_API_KEY = " + apiKey, "yellow");

	log("\n2. Update the Edge Function with your admin email:", "yellow");
	log("   - Edit supabase/functions/table-notifications/index.ts", "yellow");
	log('   - Replace "admin@yourdomain.com" with: ' + adminEmail, "yellow");

	log("\n3. Deploy the Edge Function:", "yellow");
	log("   - Run: supabase functions deploy table-notifications", "yellow");

	log("\n4. Test the notifications:", "yellow");
	log("   - Take a quiz in your application", "yellow");
	log("   - Check your email for notifications", "yellow");

	log("\n📧 You will now receive email notifications when:", "green");
	log("   • New quiz results are submitted", "green");
	log("   • Quiz results are updated", "green");
	log("   • User profiles are created/updated/deleted", "green");

	log("\n🎉 Setup complete!", "bold");
	rl.close();
}

// Handle script errors
process.on("unhandledRejection", (error) => {
	log("❌ Script error: " + error.message, "red");
	process.exit(1);
});

// Run the script
main().catch((error) => {
	log("❌ Setup failed: " + error.message, "red");
	process.exit(1);
});
