'use client'

import { useEffect, useState } from 'react'
import { Trophy, Star, TrendingUp } from 'lucide-react'

interface PointsDisplayProps {
  showRank?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface UserPoints {
  points: number
  rank?: number
  username?: string
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
        const response = await fetch('/api/points')
        if (response.ok) {
          const data = await response.json()
          setUserPoints(data)
        }
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
