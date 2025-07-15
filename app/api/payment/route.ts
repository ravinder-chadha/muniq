import { type NextRequest, NextResponse } from "next/server"
import { db, type Payment } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    const requiredFields = ['registrationId', 'paymentId', 'amount']
    const missingFields = requiredFields.filter(field => !data[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        }, 
        { status: 400 }
      )
    }

    // Check if registration exists
    try {
      const registration = await db.getRegistration(data.registrationId)
      if (!registration) {
        return NextResponse.json(
          { 
            success: false, 
            message: "Registration not found" 
          }, 
          { status: 404 }
        )
      }
    } catch (error) {
      console.error("Error checking registration:", error)
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid registration ID" 
        }, 
        { status: 400 }
      )
    }

    // Check if payment already exists for this registration
    try {
      const existingPayment = await db.getPaymentByRegistration(data.registrationId)
      if (existingPayment) {
        return NextResponse.json(
          { 
            success: false, 
            message: "Payment already exists for this registration" 
          }, 
          { status: 409 }
        )
      }
    } catch (error) {
      // If error is not "not found", then it's a real error
      console.error("Error checking existing payment:", error)
    }

    // Transform payment data to match database schema
    const paymentData: Payment = {
      registration_id: data.registrationId,
      payment_id: data.paymentId,
      order_id: data.orderId || null,
      signature: data.signature || null,
      amount: parseFloat(data.amount),
      currency: data.currency || 'INR',
      status: 'completed' // Since this is called after successful payment
    }

    // Save to database
    const payment = await db.createPayment(paymentData)

    console.log("Payment saved successfully:", payment.id)

    return NextResponse.json({
      success: true,
      message: "Payment saved successfully",
      data: {
        id: payment.id,
        registrationId: payment.registration_id,
        paymentId: payment.payment_id,
        amount: payment.amount,
        status: payment.status
      }
    })
  } catch (error) {
    console.error("Error saving payment:", error)
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      switch (error.code) {
        case '23505': // Unique constraint violation
          return NextResponse.json(
            { 
              success: false, 
              message: "Payment already exists for this registration" 
            }, 
            { status: 409 }
          )
        case '23503': // Foreign key constraint violation
          return NextResponse.json(
            { 
              success: false, 
              message: "Invalid registration ID" 
            }, 
            { status: 400 }
          )
        default:
          return NextResponse.json(
            { 
              success: false, 
              message: "Database error occurred. Please try again." 
            }, 
            { status: 500 }
          )
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to save payment. Please try again." 
      }, 
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve payment information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const registrationId = searchParams.get('registrationId')
    const paymentId = searchParams.get('paymentId')

    if (!registrationId && !paymentId) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Either registrationId or paymentId is required" 
        }, 
        { status: 400 }
      )
    }

    let payment
    if (paymentId) {
      payment = await db.getPayment(paymentId)
    } else if (registrationId) {
      payment = await db.getPaymentByRegistration(registrationId)
    }

    if (!payment) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Payment not found" 
        }, 
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: payment
    })
  } catch (error) {
    console.error("Error fetching payment:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch payment information" 
      }, 
      { status: 500 }
    )
  }
} 