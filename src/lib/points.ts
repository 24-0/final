import { supabase } from './supabase'

// Points configuration
export const POINTS_CONFIG = {
  // Question actions
  ASK_QUESTION: 5,
  QUESTION_UPVOTE: 2,
  QUESTION_DOWNVOTE: -1,

  // Answer actions
  ANSWER_QUESTION: 10,
  ANSWER_UPVOTE: 3,
  ANSWER_DOWNVOTE: -1,
  ACCEPTED_ANSWER: 15,

  // Community actions
  JOIN_GROUP: 2,
  CREATE_GROUP: 5,
  UPLOAD_RESOURCE: 3,

  // Daily limits
  DAILY_QUESTION_LIMIT: 50,
  DAILY_ANSWER_LIMIT: 100,
} as const

export interface PointsAward {
  points: number
  reason: string
  metadata?: Record<string, unknown>
}

// Award points to a user
export async function awardPoints(
  userId: string,
  points: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; newPoints: number; error?: string }> {
  try {
    if (points <= 0) {
      return { success: false, newPoints: 0, error: 'Points must be positive' }
    }

    // Get current points
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single()

    const newPoints = (currentProfile?.points || 0) + points

    // Update points
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ points: newPoints })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating points:', updateError)
      return { success: false, newPoints: 0, error: 'Failed to update points' }
    }

    // Log the points transaction (optional - for audit trail)
    console.log(`Points awarded: ${points} to user ${userId} for: ${reason}`, metadata)

    return { success: true, newPoints }
  } catch (error) {
    console.error('Error awarding points:', error)
    return { success: false, newPoints: 0, error: 'Internal server error' }
  }
}

// Get user's current points
export async function getUserPoints(userId: string): Promise<number> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single()

    return profile?.points || 0
  } catch (error) {
    console.error('Error getting user points:', error)
    return 0
  }
}

// Get user's rank in leaderboard
export async function getUserRank(userId: string): Promise<number | null> {
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, points')
      .order('points', { ascending: false })

    if (!profiles) return null

    const userIndex = profiles.findIndex(profile => profile.id === userId)
    return userIndex !== -1 ? userIndex + 1 : null
  } catch (error) {
    console.error('Error getting user rank:', error)
    return null
  }
}

// Check if user can perform an action based on daily limits
export async function checkDailyLimit(
  userId: string,
  actionType: 'question' | 'answer',
  currentCount: number
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = actionType === 'question'
    ? POINTS_CONFIG.DAILY_QUESTION_LIMIT
    : POINTS_CONFIG.DAILY_ANSWER_LIMIT

  const allowed = currentCount < limit
  const remaining = Math.max(0, limit - currentCount)

  return { allowed, remaining }
}
