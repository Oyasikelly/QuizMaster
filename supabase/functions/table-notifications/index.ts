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
	score: number;
	total_questions: number;
	timestamp: string;
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
			`New quiz result: Student ${data.student_id} scored ${data.score}/${
				data.total_questions
			} (${Math.round((data.score / data.total_questions) * 100)}%)`
		);
	} else if (operation === "UPDATE") {
		// Quiz result updated
		console.log(
			`Quiz result updated: Student ${data.student_id} scored ${data.score}/${data.total_questions}`
		);
	} else if (operation === "DELETE") {
		// Quiz result deleted
		console.log(`Quiz result deleted: Student ${data.student_id}`);
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
		const resendApiKey = Deno.env.get("RESEND_API_KEY");

		if (!resendApiKey) {
			console.error("RESEND_API_KEY not found in environment variables");
			return;
		}

		// Create Supabase client for database queries
		const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
		const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
		const supabase = createClient(supabaseUrl, supabaseServiceKey);

		// Prepare email content based on table and operation
		let subject = "";
		let htmlContent = "";

		if (update.table_name === "quiz_results") {
			const quizData = update.data as QuizResult;

			// Fetch user's name from the database
			let userName = "Unknown User";
			try {
				const { data: userData, error } = await supabase
					.from("users_profile")
					.select("name, email")
					.eq("id", quizData.student_id)
					.single();

				if (!error && userData) {
					userName = userData.name || userData.email || "Unknown User";
				}
			} catch (error) {
				console.log("Could not fetch user name, using default");
			}

			subject = `Quiz Result ${update.operation} - ${userName}`;
			htmlContent = `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #2563eb;">🎯 Quiz Result ${update.operation}</h2>
					<div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<h3 style="color: #1e293b; margin-top: 0;">Student Details:</h3>
						<ul style="color: #475569;">
							<li><strong>👤 Student Name:</strong> ${userName}</li>
							<li><strong>🆔 Student ID:</strong> ${quizData.student_id}</li>
							<li><strong>📊 Score:</strong> ${quizData.score}/${
				quizData.total_questions
			}</li>
							<li><strong>📈 Percentage:</strong> ${Math.round(
								(quizData.score / quizData.total_questions) * 100
							)}%</li>
							<li><strong>⏰ Submitted:</strong> ${new Date(
								quizData.timestamp
							).toLocaleString()}</li>
						</ul>
					</div>
					<div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
						<h4 style="color: #1e40af; margin-top: 0;">📋 Performance Summary</h4>
						<p style="color: #1e40af; margin-bottom: 0;">
							${userName} completed a quiz with ${quizData.score} correct answers out of ${
				quizData.total_questions
			} questions.
						</p>
					</div>
					<p style="color: #64748b; font-size: 14px;">
						This notification was sent automatically when a student completed a quiz.
					</p>
				</div>
			`;
		} else if (update.table_name === "users_profile") {
			const userData = update.data as UserProfile;
			subject = `User Profile ${update.operation} - ${
				userData.name || userData.email
			}`;
			htmlContent = `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #2563eb;">👤 User Profile ${update.operation}</h2>
					<div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<h3 style="color: #1e293b; margin-top: 0;">User Details:</h3>
						<ul style="color: #475569;">
							<li><strong>🆔 User ID:</strong> ${userData.id}</li>
							<li><strong>👤 Name:</strong> ${userData.name || "N/A"}</li>
							<li><strong>📧 Email:</strong> ${userData.email || "N/A"}</li>
							<li><strong>⏰ Updated:</strong> ${
								userData.updated_at
									? new Date(userData.updated_at).toLocaleString()
									: "N/A"
							}</li>
						</ul>
					</div>
					<p style="color: #64748b; font-size: 14px;">
						This notification was sent automatically when a user profile was updated.
					</p>
				</div>
			`;
		}

		// Send email using Resend API
		const response = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${resendApiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from: "QuizMaster <onboarding@resend.dev>", // Using sandbox domain (no verification needed)
				to: ["quizmasterofficial2024@gmail.com"], // Admin email for notifications
				subject: subject,
				html: htmlContent,
			}),
		});

		if (!response.ok) {
			const errorData = await response.text();
			console.error("Resend API error:", response.status, errorData);
		} else {
			const result = await response.json();
			console.log("Email sent successfully:", result);
		}
	} catch (error) {
		console.error("Email notification error:", error);
	}
}
