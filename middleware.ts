import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
    // 1. Create Supabase client and update session
    const { supabase, response } = createClient(request);

    // 2. Get the user from the session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 3. Define protected routes and public assets
    const path = request.nextUrl.pathname;

    // Exclude static assets and auth endpoints from protection
    if (
        path.startsWith("/_next") ||
        path.startsWith("/static") ||
        path.includes(".") || // files like favicon.ico, sitemap.xml
        path.startsWith("/auth")
    ) {
        return response;
    }

    // 4. Handle Unauthenticated Users
    if (!user) {
        // Allow access to login page
        if (path === "/login") {
            return response;
        }
        // Redirect to login for key protected routes (or all others)
        // For now, let's protect everything except login
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // 5. Handle Authenticated Users (RBAC)
    // Fetch user profile to get the role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const role = profile?.role;
    const url = request.nextUrl.clone();

    // 5a. Redirect from Login if already logged in
    if (path === "/login") {
        if (role === "admin") url.pathname = "/admin";
        else if (role === "teacher") url.pathname = "/teacher";
        else if (role === "student") url.pathname = "/student";
        else url.pathname = "/"; // Fallback
        return NextResponse.redirect(url);
    }

    // 5b. Redirect from Root to Dashboard
    if (path === "/") {
        if (role === "admin") url.pathname = "/admin";
        else if (role === "teacher") url.pathname = "/teacher";
        else if (role === "student") url.pathname = "/student";
        return NextResponse.redirect(url);
    }

    // 5c. Protect Role-Specific Routes
    if (path.startsWith("/admin") && role !== "admin") {
        // Redirect unauthorized access to their own dashboard
        if (role === "teacher") url.pathname = "/teacher";
        else if (role === "student") url.pathname = "/student";
        else url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    if (path.startsWith("/teacher") && role !== "teacher" && role !== "admin") {
        // Allow admins to view teacher pages? Plan said maybe. 
        // Let's strict block for now unless admin needs to debug. 
        // Update: Plan says "Teacher -> /teacher OR admin". I'll allow admin for now.
        // Wait, if I allow admin, where do they get redirected if they hit /teacher home? 
        // Valid requirement: Admin might want to see what teacher sees.
        // But strictly, Admin dashboard is /admin.
        // Let's stick to strict separation first.
        if (role === "admin") return response; // Allow admin

        if (role === "student") url.pathname = "/student";
        else url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    if (path.startsWith("/student") && role !== "student" && role !== "admin") {
        if (role === "admin") return response; // Allow admin

        if (role === "teacher") url.pathname = "/teacher";
        else url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
