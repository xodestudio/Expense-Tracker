import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Yahan hum strictly aik async function export kar rahe hain jiska naam "middleware" hai.
// Next.js ka compiler yahi chahta tha.
export async function middleware(request: NextRequest) {
  // Request se NextAuth ka JWT token nikalna
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Agar user logged in nahi hai, to usay login page par redirect karo
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Agar token hai, to user ko aage janay do
  return NextResponse.next();
}

// Routes lock karne ka config wahi purana rahega
export const config = {
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};