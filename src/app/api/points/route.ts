import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/points - Get current user's points
export async function GET() {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('points, username, full_name')
      .eq('id', session.user.id)
      .single()

    if (error) {
      console.error('Error fetching user points:', error)
      return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 })
    }

    return NextResponse.json({
      points: profile.points || 0,
      username: profile.username,
      full_name: profile.full_name
    })
  } catch (error) {
    console.error('Error in points API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/points - Award points to user
export async function POST(request: NextRequest) {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { points, reason } = await request.json()

    if (typeof points !== 'number' || points <= 0) {
      return NextResponse.json({ error: 'Invalid points value' }, { status: 400 })
    }

    // Get current points
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', session.user.id)
      .single()

    const newPoints = (currentProfile?.points || 0) + points

    // Update points
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ points: newPoints })
      .eq('id', session.user.id)

    if (updateError) {
      console.error('Error updating points:', updateError)
      return NextResponse.json({ error: 'Failed to update points' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      points: newPoints,
      awarded: points,
      reason
    })
  } catch (error) {
    console.error('Error in points API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
