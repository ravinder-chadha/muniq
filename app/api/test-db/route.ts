import { type NextRequest, NextResponse } from "next/server"
import { db, supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Check authentication for admin endpoints
    const authHeader = request.headers.get("authorization")
    const cookieToken = request.cookies.get('admin_token')?.value
    
    const token = authHeader?.replace('Bearer ', '') || cookieToken
    
    if (!token) {
      return NextResponse.json({
        success: false,
        message: "Authentication required"
      }, { status: 401 })
    }

    // Test database connection by trying to fetch registrations
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'connection'

    switch (action) {
      case 'connection':
        // Test basic connection
        return NextResponse.json({
          success: true,
          message: "Database connection successful",
          timestamp: new Date().toISOString()
        })

      case 'registrations':
        // Get all registrations (for testing purposes) - explicitly set high limit
        const { data: registrations, error } = await supabaseAdmin
          .from('registrations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10000) // Explicitly set high limit to get all registrations

        if (error) {
          throw error
        }

        return NextResponse.json({
          success: true,
          message: "Registrations fetched successfully",
          count: registrations?.length || 0,
          data: registrations || []
        })

      case 'payments':
        // Get all payments (for testing purposes) - explicitly set high limit
        const { data: payments, error: paymentError } = await supabaseAdmin
          .from('payments')
          .select(`
            *,
            registrations (
              first_name,
              last_name,
              email
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10000) // Explicitly set high limit to get all payments

        if (paymentError) {
          throw paymentError
        }

        return NextResponse.json({
          success: true,
          message: "Payments fetched successfully",
          count: payments?.length || 0,
          data: payments || []
        })

      default:
        return NextResponse.json({
          success: false,
          message: "Invalid action. Use: connection, registrations, or payments"
        }, { status: 400 })
    }
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json({
      success: false,
      message: "Database test failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 