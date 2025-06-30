import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
	const res = NextResponse.next();

	const publicUrls = ["/resetpassword"];

	if (publicUrls.includes(req.nextUrl.pathname)) {
		return res;
	}

	const supabase = createMiddlewareClient({ req, res });

	// Get the session from Supabase
	const {
		data: { session },
	} = await supabase.auth.getSession();

	const { pathname } = req.nextUrl;

	// Exclude certain paths from authentication
	const excludedPaths = ["/authenticate", "/favicon.ico", "/api", "/_next"];
	if (excludedPaths.some((path) => pathname.startsWith(path))) {
		// If user is authenticated and tries to access /authenticate, redirect to home
		if (pathname.startsWith("/authenticate") && session) {
			const homeUrl = req.nextUrl.clone();
			homeUrl.pathname = "/";
			return NextResponse.redirect(homeUrl);
		}
		return res;
	}

	// Redirect unauthenticated users to the authentication page
	if (!session) {
		const redirectUrl = req.nextUrl.clone();
		redirectUrl.pathname = "/authenticate";
		return NextResponse.redirect(redirectUrl);
	}

	// Allow authenticated users to access their requested route
	return res;
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
