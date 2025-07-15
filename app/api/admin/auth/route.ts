import { type NextRequest, NextResponse } from "next/server"
import { sign } from "jsonwebtoken"

// Create device fingerprint from request headers
function createDeviceFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get("user-agent") || ""
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  const acceptLanguage = request.headers.get("accept-language") || ""
  
  // Create a simple fingerprint (you can enhance this further)
  const fingerprint = Buffer.from(`${ip}:${userAgent}:${acceptLanguage}`).toString('base64')
  return fingerprint
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    // Get admin password from environment variables
    const adminPassword = process.env.ADMIN_PASSWORD
    
    if (!adminPassword) {
      return NextResponse.json({
        success: false,
        message: "Admin authentication not configured"
      }, { status: 500 })
    }

    // Verify password
    if (password !== adminPassword) {
      return NextResponse.json({
        success: false,
        message: "Invalid password"
      }, { status: 401 })
    }

    // Create device fingerprint
    const deviceFingerprint = createDeviceFingerprint(request)

    // Generate JWT token with device info
    const secret = process.env.JWT_SECRET || "your-secret-key-change-this"
    const token = sign(
      { 
        role: "admin",
        timestamp: Date.now(),
        deviceFingerprint: deviceFingerprint
      },
      secret,
      { expiresIn: "10m" } // Changed from 24h to 10 minutes
    )

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      token
    })
  } catch (error) {
    console.error("Admin auth error:", error)
    return NextResponse.json({
      success: false,
      message: "Authentication failed"
    }, { status: 500 })
  }
}

// Verify token endpoint
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({
        success: false,
        message: "No token provided"
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const secret = process.env.JWT_SECRET || "your-secret-key-change-this"
    
    try {
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      
      // Create current device fingerprint
      const currentDeviceFingerprint = createDeviceFingerprint(request)
      
      // Verify token is valid, not expired, and from same device
      const isValidRole = decoded.role === "admin"
      const isNotExpired = decoded.timestamp > Date.now() - 10 * 60 * 1000 // 10 minutes
      const isSameDevice = decoded.deviceFingerprint === currentDeviceFingerprint
      
      if (isValidRole && isNotExpired && isSameDevice) {
        return NextResponse.json({
          success: true,
          message: "Token valid"
        })
      } else {
        let errorMessage = "Invalid token"
        if (!isNotExpired) {
          errorMessage = "Token expired"
        } else if (!isSameDevice) {
          errorMessage = "Token not valid for this device"
        }
        
        return NextResponse.json({
          success: false,
          message: errorMessage
        }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: "Invalid token"
      }, { status: 401 })
    }
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json({
      success: false,
      message: "Token verification failed"
    }, { status: 500 })
  }
} 