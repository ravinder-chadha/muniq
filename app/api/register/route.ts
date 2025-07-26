import { type NextRequest, NextResponse } from "next/server"
import { db, type Registration } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'standard', 'munExperience']
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

    // Note: Multiple registrations from same email are now allowed

    // Transform form data to match database schema
    const registrationData: Registration = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      contact: data.contact || null,
      dob: data.dob || null,
      standard: data.standard,
      institution: data.institution || null,
      mun_experience: data.munExperience,
      workshop_slot: '4-6pm' // All new registrations go to the new slot
    }

    // Save to database
    const registration = await db.createRegistration(registrationData)

    console.log("Registration saved successfully:", registration.id)

    return NextResponse.json({
      success: true,
      message: "Registration saved successfully",
      data: {
        id: registration.id,
        email: registration.email,
        firstName: registration.first_name,
        lastName: registration.last_name
      }
    })
  } catch (error) {
    console.error("Error saving registration:", error)
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      switch (error.code) {
        case '23502': // Not null constraint violation
          return NextResponse.json(
            { 
              success: false, 
              message: "Missing required information. Please check all mandatory fields." 
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
        message: "Failed to save registration. Please try again." 
      }, 
      { status: 500 }
    )
  }
}
