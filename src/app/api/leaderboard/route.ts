import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/leaderboard - Get top users by points
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (limit > 100) {
      return NextResponse.json({ error: 'Limit cannot exceed 100' }, { status: 400 })
    }

    // Get top users by points
    const { data: leaderboard, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, points, avatar_url, created_at')
      .order('points', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }

    // Add rank to each user
    const leaderboardWithRank = leaderboard.map((user, index) => ({
      ...user,
      rank: offset + index + 1
    }))

    // Get total count for pagination
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      leaderboard: leaderboardWithRank,
      total: count,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error in leaderboard API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
