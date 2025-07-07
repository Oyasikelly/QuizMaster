import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
	const res = NextResponse.next();
	const supabase = createMiddlewareClient({ req, res });

	// Get the current user
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// Check if user is authenticated
	if (!user) {
		// Redirect to login if accessing protected routes
		if (
			req.nextUrl.pathname.startsWith("/admin") ||
			req.nextUrl.pathname.startsWith("/student")
		) {
			return NextResponse.redirect(new URL("/authenticate", req.url));
		}
		return res;
	}

	// For admin routes, check if user is admin
	if (req.nextUrl.pathname.startsWith("/admin")) {
		try {
			const { data: profile } = await supabase
				.from("users_profile")
				.select("role")
				.eq("id", user.id)
				.single();

			if (!profile || profile.role !== "admin") {
				// Redirect to access denied or home page
				return NextResponse.redirect(new URL("/", req.url));
			}
		} catch (error) {
			console.error("Error checking admin role:", error);
			return NextResponse.redirect(new URL("/", req.url));
		}
	}

	// For student routes, check if user is student
	if (req.nextUrl.pathname.startsWith("/student")) {
		try {
			const { data: profile } = await supabase
				.from("users_profile")
				.select("role")
				.eq("id", user.id)
				.single();

			if (!profile || profile.role !== "student") {
				// Redirect to access denied or home page
				return NextResponse.redirect(new URL("/", req.url));
			}
		} catch (error) {
			console.error("Error checking student role:", error);
			return NextResponse.redirect(new URL("/", req.url));
		}
	}

	return res;
}

export const config = {
	matcher: ["/admin/:path*", "/student/:path*", "/authenticate/:path*"],
};
