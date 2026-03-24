import { withAuth } from "next-auth/middleware";

const adminOnlyPrefixes = ["/admin", "/kindergartens", "/users", "/limits", "/suspicious"];
const staffOrDirectorPrefixes = ["/director", "/transactions"];
const parentOnlyPrefixes = ["/parent", "/children", "/parent-app"];

export default withAuth(
  function middleware() {},
  {
    callbacks: {
      authorized: ({ req, token }) => {
        if (!token) return false;

        const role = token.role as string;
        const pathname = req.nextUrl.pathname;

        if (adminOnlyPrefixes.some((prefix) => pathname.startsWith(prefix))) {
          return role === "district_admin";
        }

        if (staffOrDirectorPrefixes.some((prefix) => pathname.startsWith(prefix))) {
          return role === "district_admin" || role === "kindergarten_director" || role === "staff";
        }

        if (parentOnlyPrefixes.some((prefix) => pathname.startsWith(prefix))) {
          return role === "parent";
        }

        if (["/clubs", "/enrollments", "/invoices", "/payments"].some((prefix) => pathname.startsWith(prefix))) {
          return ["district_admin", "kindergarten_director", "staff", "parent"].includes(role);
        }

        return true;
      }
    }
  }
);

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
    "/children/:path*",
    "/parent-app/:path*"
  ]
};
