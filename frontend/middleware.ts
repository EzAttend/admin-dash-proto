import { NextRequest, NextResponse } from "next/server";

const protectedPaths = [
    "/dashboard",
    "/classes",
    "/subjects",
    "/rooms",
    "/students",
    "/teachers",
    "/timetable",
    "/upload",
    "/jobs",
];

const authPaths = ["/sign-in", "/sign-up"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const sessionCookie = request.cookies.get("ez_admin.session_token");
    const isAuthenticated = !!sessionCookie?.value;

    const isProtected = protectedPaths.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
    );
    if (isProtected && !isAuthenticated) {
        const signInUrl = new URL("/sign-in", request.url);
        signInUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signInUrl);
    }

    const isAuthPage = authPaths.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
    );
    if (isAuthPage && isAuthenticated) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
