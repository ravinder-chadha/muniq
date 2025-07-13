import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Here you would typically save to your database
    // For now, we'll just log the data and return success
    console.log("Registration data received:", data)

    // You can add database logic here
    // Example with a hypothetical database:
    // await db.registrations.create({ data })

    return NextResponse.json({
      success: true,
      message: "Registration saved successfully",
      data,
    })
  } catch (error) {
    console.error("Error saving registration:", error)
    return NextResponse.json({ success: false, message: "Failed to save registration" }, { status: 500 })
  }
}
