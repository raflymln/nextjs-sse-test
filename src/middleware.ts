import { NextResponse } from "next/server";

export const config = {
    matcher: ["/login", "/register", "/reset-password", "/resend-verification", "/topup", "/me/:path*", "/c/:path*"],
};

export async function middleware() {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return NextResponse.next();
}
