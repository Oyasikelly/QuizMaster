// =============================================================================
// SUPABASE EDGE FUNCTION - DENO RUNTIME
// =============================================================================
//
// ⚠️  EXPECTED TYPESCRIPT ERRORS:
// This file uses Deno-specific imports and globals that are not recognized
// by the Node.js/Next.js TypeScript environment. These errors are expected
// and will not affect the function when deployed to Supabase Edge Functions.
//
// Expected errors:
// - Cannot find module 'https://deno.land/std@0.168.0/http/server.ts'
// - Cannot find module 'https://esm.sh/@supabase/supabase-js@2'
// - Parameter 'req' implicitly has an 'any' type
// - 'error' is of type 'unknown'
//
// ✅  SOLUTION: These errors are resolved when the function runs in Deno
// =============================================================================

// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
// Note: TypeScript errors for Deno imports are expected in Next.js environment
// This file is designed to run in Deno runtime, not Node.js
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Deno global type declaration for TypeScript
declare const Deno: {
	env: {
		get(key: string): string | undefined;
	};
};

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

interface QuizResult {
	student_id: string;
	quiz_id: string;
	score: number;
	submitted_at: string;
}

interface UserProfile {
	id: string;
	email?: string;
	name?: string;
	updated_at?: string;
}

interface TableUpdate {
	table_name: string;
	operation: "INSERT" | "UPDATE" | "DELETE";
	data: QuizResult | UserProfile;
	old_data?: any;
}

serve(async (req: Request) => {
	// Handle CORS preflight requests
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		// Parse the request body
		const body: TableUpdate = await req.json();

		console.log("Received table update:", body);

		// Validate required fields
		if (!body.table_name || !body.operation || !body.data) {
			return new Response(
				JSON.stringify({ error: "Missing required fields" }),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				}
			);
		}

		// Create Supabase client
		const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
		const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

		const supabase = createClient(supabaseUrl, supabaseServiceKey);

		// Process based on table type
		if (body.table_name === "quiz_results") {
			await handleQuizResult(body.data as QuizResult, body.operation);
		} else if (body.table_name === "users_profile") {
			await handleUserProfile(body.data as UserProfile, body.operation);
		} else {
			return new Response(JSON.stringify({ error: "Unsupported table" }), {
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		// Send email notification
		await sendEmailNotification(body);

		// Return success response
		return new Response(
			JSON.stringify({
				success: true,
				message: `${body.table_name} ${body.operation} processed successfully`,
				data: body,
			}),
			{
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			}
		);
	} catch (error: unknown) {
		console.error("Function error:", error);

		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";

		return new Response(
			JSON.stringify({
				error: "Internal server error",
				details: errorMessage,
			}),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			}
		);
	}
});

// Handle quiz results
async function handleQuizResult(data: QuizResult, operation: string) {
	console.log(`Processing quiz result ${operation}:`, data);

	// Here you can add specific logic for quiz results
	// For example: analytics, scoring, etc.

	if (operation === "INSERT") {
		// New quiz result submitted
		console.log(
			`New quiz result: Student ${data.student_id} scored ${data.score} on quiz ${data.quiz_id}`
		);
	} else if (operation === "UPDATE") {
		// Quiz result updated
		console.log(
			`Quiz result updated: Student ${data.student_id} on quiz ${data.quiz_id}`
		);
	} else if (operation === "DELETE") {
		// Quiz result deleted
		console.log(
			`Quiz result deleted: Student ${data.student_id} on quiz ${data.quiz_id}`
		);
	}
}

// Handle user profile updates
async function handleUserProfile(data: UserProfile, operation: string) {
	console.log(`Processing user profile ${operation}:`, data);

	// Here you can add specific logic for user profiles
	// For example: user registration, profile updates, etc.

	if (operation === "INSERT") {
		// New user profile created
		console.log(`New user profile: ${data.name} (${data.email})`);
	} else if (operation === "UPDATE") {
		// User profile updated
		console.log(`User profile updated: ${data.name} (${data.email})`);
	} else if (operation === "DELETE") {
		// User profile deleted
		console.log(`User profile deleted: ${data.name} (${data.email})`);
	}
}

// Send email notification
async function sendEmailNotification(update: TableUpdate) {
	try {
		// You can integrate with email services like:
		// - SendGrid
		// - Mailgun
		// - AWS SES
		// - Resend

		const emailData = {
			to: "admin@yourdomain.com", // Replace with your admin email
			subject: `${update.table_name} ${update.operation} Notification`,
			body: `
				Table: ${update.table_name}
				Operation: ${update.operation}
				Data: ${JSON.stringify(update.data, null, 2)}
				Time: ${new Date().toISOString()}
			`,
		};

		console.log("Email notification data:", emailData);

		// Example: Send email using a service
		// const response = await fetch('https://api.resend.com/emails', {
		//   method: 'POST',
		//   headers: {
		//     'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
		//     'Content-Type': 'application/json'
		//   },
		//   body: JSON.stringify(emailData)
		// });

		// For now, just log the email data
		console.log("Email notification would be sent:", emailData);
	} catch (error) {
		console.error("Email notification error:", error);
	}
}
