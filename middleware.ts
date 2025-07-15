import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Create device fingerprint from request headers (same as in auth route)
function createDeviceFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get("user-agent") || ""
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  const acceptLanguage = request.headers.get("accept-language") || ""
  
  // Create a simple fingerprint
  const fingerprint = Buffer.from(`${ip}:${userAgent}:${acceptLanguage}`).toString('base64')
  return fingerprint
}

export function middleware(request: NextRequest) {
  // Check if the request is for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Skip login page
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Check for admin token in cookies
    const token = request.cookies.get('admin_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      // Decode token
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      
      // Create current device fingerprint
      const currentDeviceFingerprint = createDeviceFingerprint(request)
      
      // Verify token is valid, not expired, and from same device
      const isValidRole = decoded.role === "admin"
      const isNotExpired = decoded.timestamp > Date.now() - 10 * 60 * 1000 // 10 minutes
      const isSameDevice = decoded.deviceFingerprint === currentDeviceFingerprint
      
      if (!isValidRole || !isNotExpired || !isSameDevice) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
} 