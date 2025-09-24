import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({ 
      success: true, 
      message: "Generate API is working!"
    })
  } catch (error) {
    return NextResponse.json({ 
      error: "Test failed" 
    }, { status: 500 })
  }
}

export const runtime = 'nodejs'
