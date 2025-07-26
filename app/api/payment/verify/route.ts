import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { db, type Payment } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      registrationId,
      courseDetails 
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

    // Verify signature with Razorpay
    const key_secret = process.env.RAZORPAY_KEY_SECRET!
    const generated_signature = crypto
      .createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Payment signature verification failed" 
        }, 
        { status: 400 }
      )
    }

    // Check if payment already exists
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
      // Continue if payment doesn't exist
    }

    // Save payment to database with course information
    const paymentData: Payment = {
      registration_id: registrationId,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      signature: razorpay_signature,
      amount: courseDetails?.price || 0,
      currency: 'INR',
      course_id: courseDetails?.id,
      course_name: courseDetails?.name,
      course_details: courseDetails,
      status: 'completed',
      payment_method: 'razorpay'
    }

    const payment = await db.createPayment(paymentData)

    console.log("Payment verified and saved:", payment.id)

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      data: {
        id: payment.id,
        paymentId: payment.payment_id,
        orderId: payment.order_id,
        amount: payment.amount,
        course: courseDetails,
        status: payment.status
      }
    })

  } catch (error) {
    console.error("Error verifying payment:", error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Payment verification failed. Please contact support." 
      }, 
      { status: 500 }
    )
  }
} 