// Setup script for email notifications testing
// This will help you find your Supabase credentials and test the system

const fs = require("fs");
const path = require("path");

console.log("🔧 Email Notifications Setup Helper");
console.log("=====================================");

// Check for .env.local file
const envPath = path.join(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
	console.log("✅ Found .env.local file");
	const envContent = fs.readFileSync(envPath, "utf8");

	// Extract Supabase URL and key
	const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
	const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

	if (urlMatch && keyMatch) {
		const supabaseUrl = urlMatch[1].trim();
		const supabaseKey = keyMatch[1].trim();

		console.log("📋 Found Supabase credentials:");
		console.log("- URL:", supabaseUrl);
		console.log("- Key:", supabaseKey.substring(0, 20) + "...");

		// Create a test script with the actual credentials
		const testScript = `// Auto-generated test script with your credentials
const https = require('https');

const SUPABASE_URL = '${supabaseUrl}';
const SUPABASE_ANON_KEY = '${supabaseKey}';

console.log('🧪 Testing Email Notifications with your credentials...');

const testQuizResult = {
  table_name: 'quiz_results',
  operation: 'INSERT',
  data: {
    student_id: 'test-student-' + Date.now(),
    score: 85,
    total_questions: 100,
    timestamp: new Date().toISOString()
  }
};

function testEdgeFunction(testData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testData);
    const url = new URL(SUPABASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/functions/v1/table-notifications',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': \`Bearer \${SUPABASE_ANON_KEY}\`,
        'apikey': SUPABASE_ANON_KEY
      }
    };

    console.log('📤 Sending test notification...');
    console.log('📋 Data:', JSON.stringify(testData, null, 2));

    const req = https.request(options, (res) => {
      console.log(\`📥 Status: \${res.statusCode}\`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📨 Response:', data);
        try {
          const parsed = JSON.parse(data);
          console.log('✅ Parsed response:', parsed);
          resolve(parsed);
        } catch (e) {
          console.log('⚠️ Raw response:', data);
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request error:', e);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function runTest() {
  try {
    await testEdgeFunction(testQuizResult);
    console.log('\\n✅ Test completed!');
    console.log('📧 Check your email for notifications');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTest();
`;

		fs.writeFileSync("test-with-credentials.js", testScript);
		console.log(
			"\n✅ Created test-with-credentials.js with your actual credentials"
		);
		console.log("💡 Run: node test-with-credentials.js");
	} else {
		console.log("❌ Could not find Supabase credentials in .env.local");
		console.log("Please check your .env.local file contains:");
		console.log("- NEXT_PUBLIC_SUPABASE_URL");
		console.log("- NEXT_PUBLIC_SUPABASE_ANON_KEY");
	}
} else {
	console.log("❌ .env.local file not found");
	console.log("Please create .env.local with your Supabase credentials");
}

console.log("\n📋 Manual Setup Steps:");
console.log("1. Get your Supabase URL and anon key from Supabase Dashboard");
console.log("2. Create .env.local file with:");
console.log("   NEXT_PUBLIC_SUPABASE_URL=your-project-url");
console.log("   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key");
console.log("3. Get Resend API key from resend.com");
console.log("4. Set RESEND_API_KEY in Supabase Edge Functions");
console.log(
	"5. Deploy Edge Function: npx supabase functions deploy table-notifications"
);
console.log("6. Run database triggers SQL");
console.log("7. Test with: node test-with-credentials.js");

console.log("\n🔗 Useful Links:");
console.log("- Supabase Dashboard: https://supabase.com/dashboard");
console.log("- Resend Dashboard: https://resend.com");
console.log("- Edge Functions: https://supabase.com/docs/guides/functions");
