'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal, Award, Crown, Star } from 'lucide-react'

interface LeaderboardUser {
  id: string
  username: string | null
  full_name: string | null
  points: number
  avatar_url: string | null
  rank: number
}

interface LeaderboardProps {
  limit?: number
  showCurrentUser?: boolean
  className?: string
}

export default function Leaderboard({
  limit = 10,
  className = ''
}: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`/api/leaderboard?limit=${limit}`)
        if (response.ok) {
          const data = await response.json()
          setLeaderboard(data.leaderboard || [])
        } else {
          console.error('Failed to fetch leaderboard:', response.status)
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [limit])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Trophy className="w-6 h-6 text-gray-400" />
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <Award className="w-5 h-5 text-gray-500" />
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500'
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600'
      default:
        return 'bg-gradient-to-r from-blue-500 to-purple-600'
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Leaderboard
        </h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="w-32 h-4 bg-gray-300 rounded mb-1"></div>
                <div className="w-16 h-3 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-yellow-500" />
        Top Contributors
      </h3>

      <div className="space-y-2">
        {leaderboard.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-gray-50"
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold ${getRankColor(user.rank)}`}>
              {user.rank <= 3 ? getRankIcon(user.rank) : `#${user.rank}`}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 truncate">
                  {user.full_name || user.username || 'Anonymous'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span>{user.points.toLocaleString()} pts</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {user.points.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">points</div>
            </div>
          </div>
        ))}
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No users found</p>
        </div>
      )}
    </div>
  )
}
