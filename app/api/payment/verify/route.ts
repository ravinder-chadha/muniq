import { NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"
import crypto from "crypto"
import { db, type Payment } from "@/lib/supabase"

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: NextRequest) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      registrationId 
    } = await request.json()

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !registrationId) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Missing required payment verification fields" 
        }, 
        { status: 400 }
      )
    }

    // Verify payment signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      console.error("Payment signature verification failed")
      return NextResponse.json(
        { 
          success: false, 
          message: "Payment verification failed. Invalid signature." 
        }, 
        { status: 400 }
      )
    }

    // Fetch payment details from Razorpay to get amount
    let paymentDetails
    try {
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id)
    } catch (error) {
      console.error("Error fetching payment details:", error)
      return NextResponse.json(
        { 
          success: false, 
          message: "Failed to fetch payment details from Razorpay" 
        }, 
        { status: 500 }
      )
    }

    // Check if registration exists
    try {
      const registration = await db.getRegistration(registrationId)
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
      const existingPayment = await db.getPaymentByRegistration(registrationId)
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

    // Save verified payment to database
    const paymentData: Payment = {
      registration_id: registrationId,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      signature: razorpay_signature,
      amount: Number(paymentDetails.amount) / 100, // Convert from paise to rupees
      currency: paymentDetails.currency,
      status: 'completed'
    }

    const payment = await db.createPayment(paymentData)

    console.log("Payment verified and saved successfully:", payment.id)

    return NextResponse.json({
      success: true,
      message: "Payment verified and saved successfully",
      data: {
        id: payment.id,
        registrationId: payment.registration_id,
        paymentId: payment.payment_id,
        orderId: payment.order_id,
        amount: payment.amount,
        status: payment.status,
        verified: true
      }
    })

  } catch (error) {
    console.error("Error verifying payment:", error)
    
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
        message: "Payment verification failed. Please contact support.",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      }, 
      { status: 500 }
    )
  }
} 