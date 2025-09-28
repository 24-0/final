import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { questionContent } = await request.json()

    if (!questionContent) {
      return NextResponse.json({ error: 'Question content is required' }, { status: 400 })
    }

    const prompt = `Provide a helpful, accurate answer to the following question. Keep the answer concise but informative:\n\n${questionContent}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    })

    const answer = completion.choices[0]?.message?.content?.trim() || 'No answer generated'

    // Simple confidence score (in production, could use more sophisticated logic)
    const confidence_score = 0.85

    return NextResponse.json({ answer, confidence_score })
  } catch (error) {
    console.error('Error generating AI answer:', error)
    return NextResponse.json({ error: 'Failed to generate AI answer' }, { status: 500 })
  }
}
