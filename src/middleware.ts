import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Check for the auth token cookie that the backend sets
  const token = request.cookies.get('auth_token')?.value;

  // If there's no token, redirect to the login page
  if (!token) {
    // Save the URL they tried to access to redirect them back (optional enhancement)
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If token exists, allow the request to proceed
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  // Apply middleware to these routes only
  matcher: [
    '/admin/:path*',
    '/scanner/:path*'
  ],
};
