
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { questionContent } = await request.json()

    if (!questionContent) {
      return NextResponse.json({ error: 'Question content is required' }, { status: 400 })
    }

    // Mock AI response since external API is not available
    const answer = `Free AI response for: "${questionContent}". This is a simulated answer using a mock AI model. In full setup, it would generate context-specific content.`

    // Simple confidence score
    const confidence_score = 0.85

    return NextResponse.json({ answer, confidence_score })
  } catch (error) {
    console.error('Error generating AI answer:', error)
    return NextResponse.json({ error: 'Failed to generate AI answer' }, { status: 500 })
  }
}
