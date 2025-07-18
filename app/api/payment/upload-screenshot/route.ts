import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin, db, type Payment } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('screenshot') as File
    const registrationId = formData.get('registrationId') as string

    if (!file) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No screenshot file provided" 
        }, 
        { status: 400 }
      )
    }

    if (!registrationId) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Registration ID is required" 
        }, 
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Please upload a valid image file" 
        }, 
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { 
          success: false, 
          message: "File size must be less than 10MB" 
        }, 
        { status: 400 }
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

    // Convert file to buffer for upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `payment-screenshots/${registrationId}-${Date.now()}.${fileExtension}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('payment-screenshots')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return NextResponse.json(
        { 
          success: false, 
          message: "Failed to upload screenshot. Please try again." 
        }, 
        { status: 500 }
      )
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabaseAdmin.storage
      .from('payment-screenshots')
      .getPublicUrl(fileName)

    // Create payment record with screenshot
    const paymentData: Payment = {
      registration_id: registrationId,
      payment_id: `qr_${Date.now()}_${registrationId.slice(-8)}`,
      amount: 11,
      currency: 'INR',
      status: 'completed', // Automatically mark as completed for QR payments
      payment_screenshot_url: urlData.publicUrl,
      payment_method: 'qr_code'
    }

    const payment = await db.createPayment(paymentData)

    console.log("Payment with screenshot saved successfully:", payment.id)

    return NextResponse.json({
      success: true,
      message: "Payment screenshot uploaded and payment confirmed successfully",
      data: {
        id: payment.id,
        registrationId: payment.registration_id,
        paymentId: payment.payment_id,
        amount: payment.amount,
        status: payment.status,
        screenshotUrl: payment.payment_screenshot_url,
        paymentMethod: payment.payment_method
      }
    })

  } catch (error) {
    console.error("Error processing screenshot upload:", error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to process screenshot upload. Please try again." 
      }, 
      { status: 500 }
    )
  }
} 