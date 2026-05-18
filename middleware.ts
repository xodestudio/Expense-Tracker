export { default } from "next-auth/middleware";

export const config = {
  // Yahan wo routes define karo jahan login lazmi hai. 
  // Ye regex login aur api routes ke ilawa baqi sab lock kar dega.
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};