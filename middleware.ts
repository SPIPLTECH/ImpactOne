import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "dev_secret_change_me"
);

type Role = "ALC" | "Intern" | "Mentor" | "DCU" | "MRCU" | "SuperAdmin";

const ROLE_DASHBOARD: Record<Role, string> = {
  ALC: "/dashboard",
  Intern: "/dashboard",
  Mentor: "/mentor-dashboard",
  DCU: "/dcu/dashboard",
  MRCU: "/mrcu/dashboard",
  SuperAdmin: "/admin/dashboard",
};

// Which roles are allowed on which protected path prefixes.
const ROUTE_ROLE_MAP: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/dashboard", roles: ["ALC", "Intern"] },
  { prefix: "/checkin", roles: ["ALC", "Intern"] },
  { prefix: "/event", roles: ["ALC", "Intern"] },
  { prefix: "/payments", roles: ["ALC", "Intern"] },
  { prefix: "/mentor-dashboard", roles: ["Mentor"] },
  { prefix: "/dcu", roles: ["DCU"] },
  { prefix: "/mrcu", roles: ["MRCU"] },
  { prefix: "/admin/dashboard", roles: ["SuperAdmin"] },
];

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/admin/login"];

async function getSession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { id: string; username: string; role: Role };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("io_session")?.value;
  const session = await getSession(token);

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Already logged in and visiting a public/login page -> send to their own dashboard
  if (isPublicPath) {
    if (session && ROLE_DASHBOARD[session.role]) {
      return NextResponse.redirect(new URL(ROLE_DASHBOARD[session.role], req.url));
    }
    return NextResponse.next();
  }

  const matchedRoute = ROUTE_ROLE_MAP.find(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/")
  );

  if (matchedRoute) {
    // Not logged in (or invalid/expired session) -> force login
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Logged in but wrong role trying to access someone else's section
    if (!matchedRoute.roles.includes(session.role)) {
      return NextResponse.redirect(new URL(ROLE_DASHBOARD[session.role], req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/checkin/:path*",
    "/event/:path*",
    "/payments/:path*",
    "/mentor-dashboard/:path*",
    "/dcu/:path*",
    "/mrcu/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
    "/forgot-password",
  ],
};