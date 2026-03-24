export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/admin/:path*",
    "/director/:path*",
    "/parent/:path*",
    "/clubs/:path*",
    "/enrollments/:path*",
    "/invoices/:path*",
    "/payments/:path*",
    "/transactions/:path*",
    "/limits/:path*",
    "/kindergartens/:path*",
    "/users/:path*",
    "/suspicious/:path*",
    "/children/:path*"
  ]
};
