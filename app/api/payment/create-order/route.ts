import { NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "INR", registrationId, customerDetails } = await request.json()

    // Validate required fields
    if (!amount || !registrationId) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Amount and registration ID are required" 
        }, 
        { status: 400 }
      )
    }

    // Create order options
    const orderOptions = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `${registrationId.slice(-8)}_${Date.now().toString().slice(-6)}`, // Unique receipt (max 40 chars)
      payment_capture: 1, // Auto capture payment
      notes: {
        registration_id: registrationId,
        customer_name: customerDetails?.name || "MUNIQ Participant",
        customer_email: customerDetails?.email || "",
        customer_contact: customerDetails?.contact || "",
        workshop: "MUNIQ Beginner Workshop"
      }
    }

    // Create order with Razorpay
    const order = await razorpay.orders.create(orderOptions)

    console.log("Razorpay order created:", order.id)

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        registrationId,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID // Send key ID for frontend
      }
    })

  } catch (error) {
    console.error("Error creating Razorpay order:", error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to create payment order. Please try again.",
        error: process.env.NODE_ENV === 'development' ? error : undefined
      }, 
      { status: 500 }
    )
  }
} 