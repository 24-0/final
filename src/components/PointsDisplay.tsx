'use client'

import { useEffect, useState } from 'react'
import { Trophy, Star, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PointsDisplayProps {
  showRank?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface UserPoints {
  points: number
  rank?: number
  username?: string
  full_name?: string
}

export default function PointsDisplay({
  showRank = false,
  size = 'md',
  className = ''
}: PointsDisplayProps) {
  const [userPoints, setUserPoints] = useState<UserPoints>({ points: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserPoints = async () => {
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        // Fetch user points directly from Supabase
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('points, username, full_name')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching user points:', error)
          return
        }

        setUserPoints({
          points: profile.points || 0,
          username: profile.username,
          full_name: profile.full_name
        })
      } catch (error) {
        console.error('Error fetching user points:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserPoints()
  }, [])

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${sizeClasses[size]} ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <div className="w-16 h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${sizeClasses[size]} ${className}`}>
      <div className="flex items-center gap-1 text-yellow-600">
        <Star size={iconSizes[size]} className="fill-current" />
        <span className="font-semibold">{userPoints.points.toLocaleString()}</span>
      </div>

      {showRank && userPoints.rank && (
        <div className="flex items-center gap-1 text-purple-600">
          <Trophy size={iconSizes[size]} />
          <span className="font-medium">#{userPoints.rank}</span>
        </div>
      )}

      <div className="flex items-center gap-1 text-green-600">
        <TrendingUp size={iconSizes[size]} />
        <span className="text-xs">pts</span>
      </div>
    </div>
  )
}
