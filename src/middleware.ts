import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
	const res = NextResponse.next();
	const supabase = createMiddlewareClient({ req, res });

	// Only check for session, not DB profile
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session) {
		if (
			req.nextUrl.pathname.startsWith("/admin") ||
			req.nextUrl.pathname.startsWith("/student")
		) {
			return NextResponse.redirect(new URL("/authenticate", req.url));
		}
		return res;
	}

	return res;
}

export const config = {
	matcher: ["/admin/:path*", "/student/:path*", "/authenticate/:path*"],
};
