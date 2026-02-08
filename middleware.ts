import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

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

    // 5c. Protect Role-Specific Routes (Strict Mode)

    // Admin Route Protection
    if (path.startsWith("/admin") && role !== "admin") {
        // Redirect to their own dashboard
        if (role === "teacher") url.pathname = "/teacher";
        else if (role === "student") url.pathname = "/student";
        else url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // Teacher Route Protection
    if (path.startsWith("/teacher")) {
        if (role === "teacher") return response; // Allowed

        // If Admin tries to access Teacher dashboard, redirect to Admin dashboard
        if (role === "admin") {
            url.pathname = "/admin";
            return NextResponse.redirect(url);
        }

        // If Student tries to access Teacher dashboard, redirect to Student dashboard
        if (role === "student") {
            url.pathname = "/student";
            return NextResponse.redirect(url);
        }

        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // Student Route Protection
    if (path.startsWith("/student")) {
        if (role === "student") return response; // Allowed

        // If Admin tries to access Student dashboard, redirect to Admin dashboard
        if (role === "admin") {
            url.pathname = "/admin"; // Admin has their own view
            return NextResponse.redirect(url);
        }

        // If Teacher tries to access Student dashboard, redirect to Teacher dashboard
        if (role === "teacher") {
            url.pathname = "/teacher";
            return NextResponse.redirect(url);
        }

        url.pathname = "/login";
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
