import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = await openai.moderations.create({
      input: message,
    });

    const results = response.results[0];
    const flagged = results.flagged;

    return NextResponse.json({ flagged });
  } catch (error) {
    console.error('Moderation API error:', error);
    return NextResponse.json({ error: 'Moderation failed' }, { status: 500 });
  }
}
