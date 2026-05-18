import { withAuth } from "next-auth/middleware";

// Explicit function export taake Next.js compiler khush rahay
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Yahan wahi purana matcher block hai jo pori app lock kar raha hai
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};
