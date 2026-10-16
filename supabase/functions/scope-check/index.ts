// =============================================================================
// SUPABASE EDGE FUNCTION - DENO RUNTIME (see table-notifications/index.ts
// for the same note on expected TypeScript errors in this Next.js repo)
// =============================================================================
//
// Guards against a repeat of the production data leak found and fixed on
// 2026-10-16 (PROJECT_HANDOFF.md, commit 5549c42): a correctly-scoped
// province_admin session got back every province's students/quiz results
// instead of just its own, traced to an inconsistency in Supabase's own
// gateway infrastructure rather than anything in this project's SQL.
//
// Signs in as a dedicated, non-human monitoring account (scripts/
// create-monitor-account.js, scoped to Province 23 — never a real admin's
// login) and calls the exact same get_scoped_students()/
// get_scoped_quiz_results() RPCs the real app depends on. Any row whose
// org_id falls outside the monitor's own expected scope is a leak. On a
// leak: records full details in scope_check_failures and emails an alert
// via the Resend integration already used by table-notifications.
//
// Scheduled via pg_cron (see the schedule_scope_check migration).
// Can also be called manually to self-test:
//   curl -X POST https://<project>.supabase.co/functions/v1/scope-check \
//     -H "Authorization: Bearer <anon-or-service-key>"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
	env: {
		get(key: string): string | undefined;
	};
};

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
		const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
		const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
		const monitorEmail = Deno.env.get("SCOPE_MONITOR_EMAIL")!;
		const monitorPassword = Deno.env.get("SCOPE_MONITOR_PASSWORD")!;

		// A fresh client signed in as the real monitor session — this has to
		// be a genuine authenticated login, not the service role, since the
		// bug this guards against is specifically about whether RLS/the
		// gateway correctly scopes a REAL session, which the service role
		// (which bypasses RLS entirely) could never reveal.
		const asMonitor = createClient(supabaseUrl, anonKey);
		const { data: signInData, error: signInError } = await asMonitor.auth.signInWithPassword({
			email: monitorEmail,
			password: monitorPassword,
		});
		if (signInError || !signInData.session) {
			throw new Error("Monitor sign-in failed: " + (signInError?.message || "no session"));
		}

		const { data: expectedOrgIds, error: scopeError } = await asMonitor.rpc("my_scoped_org_ids");
		if (scopeError) throw new Error("my_scoped_org_ids() failed: " + scopeError.message);

		const { data: students, error: studentsError } = await asMonitor.rpc("get_scoped_students");
		if (studentsError) throw new Error("get_scoped_students() failed: " + studentsError.message);

		const { data: quizResults, error: quizError } = await asMonitor.rpc("get_scoped_quiz_results");
		if (quizError) throw new Error("get_scoped_quiz_results() failed: " + quizError.message);

		const expectedSet = new Set(expectedOrgIds || []);
		const leakedStudentOrgIds = [...new Set((students || []).map((s: { org_id: string }) => s.org_id))].filter(
			(id) => id && !expectedSet.has(id)
		);
		const leakedQuizOrgIds = [...new Set((quizResults || []).map((q: { org_id: string }) => q.org_id))].filter(
			(id) => id && !expectedSet.has(id)
		);
		const leakedOrgIds = [...new Set([...leakedStudentOrgIds, ...leakedQuizOrgIds])];

		const result = {
			checked_at: new Date().toISOString(),
			expected_org_ids: expectedOrgIds || [],
			student_count: (students || []).length,
			quiz_result_count: (quizResults || []).length,
			leaked_org_ids: leakedOrgIds,
			passed: leakedOrgIds.length === 0,
		};

		console.log("Scope check result:", JSON.stringify(result));

		if (!result.passed) {
			const asService = createClient(supabaseUrl, serviceKey);
			await asService.from("scope_check_failures").insert({
				expected_org_ids: result.expected_org_ids,
				leaked_org_ids: result.leaked_org_ids,
				details: result,
			});
			await sendAlertEmail(result);
		}

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Scope check error:", message);
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	}
});

async function sendAlertEmail(result: Record<string, unknown>) {
	try {
		const resendApiKey = Deno.env.get("RESEND_API_KEY");
		if (!resendApiKey) {
			console.error("RESEND_API_KEY not found — cannot send scope-leak alert email.");
			return;
		}

		const response = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${resendApiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from: "QuizMaster <onboarding@resend.dev>",
				to: ["quizmasterofficial2024@gmail.com"],
				subject: "URGENT: QuizMaster cross-province data leak detected",
				html: `
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
						<h2 style="color: #dc2626;">Cross-province data leak detected</h2>
						<p>The automated scope check just found data from provinces outside the
						monitor account's own scope — the same kind of leak fixed on 2026-10-16.</p>
						<pre style="background:#f8fafc; padding:16px; border-radius:8px; overflow:auto;">${JSON.stringify(
							result,
							null,
							2
						)}</pre>
						<p>Check the <code>scope_check_failures</code> table for the full history.</p>
					</div>
				`,
			}),
		});

		if (!response.ok) {
			console.error("Resend API error:", response.status, await response.text());
		}
	} catch (error) {
		console.error("Alert email error:", error);
	}
}
