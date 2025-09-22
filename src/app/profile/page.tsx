'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import SignOutButton from './SignOutButton'

interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  points: number
}

interface Question {
  id: string
  title: string
  slug: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [savedQuestions, setSavedQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileAndSaved = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('User not logged in')
          setLoading(false)
          return
        }

        // Fetch profile info
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio, points')
          .eq('id', user.id)
          .single()

        if (profileError) {
          setError('Failed to fetch profile')
          setLoading(false)
          return
        }

        setProfile(profileData)

        // Fetch saved questions joined with questions table
        const { data: savedData, error: savedError } = await supabase
          .from('saved_posts')
          .select(`
            question:questions (
              id,
              title,
              slug
            )
          `)
          .eq('user_id', user.id)

        if (savedError) {
          setError('Failed to fetch saved questions')
          setLoading(false)
          return
        }

        const questions = savedData?.map((item: unknown) => (item as { question: Question }).question) || []
        setSavedQuestions(questions)
      } catch (err) {
        setError('Unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProfileAndSaved()
  }, [])

  if (loading) {
    return <div className="p-6 text-center">Loading profile...</div>
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>
  }

  if (!profile) {
    return <div className="p-6 text-center">No profile found.</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center space-x-4 mb-8">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={`${profile.full_name}'s avatar`}
            className="w-20 h-20 rounded-full object-cover"
            width={80}
            height={80}
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xl font-bold">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{profile.full_name}</h1>
          <p className="text-gray-600">@{profile.username}</p>
          <p className="mt-2">Points: <span className="font-semibold">{profile.points}</span></p>
          {profile.bio && <p className="mt-2 text-gray-700">{profile.bio}</p>}
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Saved Questions</h2>
        {savedQuestions.length === 0 ? (
          <p>You have no saved questions.</p>
        ) : (
          <ul className="space-y-3">
            {savedQuestions.map((q) => (
              <li key={q.id}>
                <Link href={`/questions/${q.id}`} className="text-blue-600 hover:underline">
                  {q.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Account</h2>
        <div>
          <SignOutButton />
        </div>
      </section>
    </div>
  )
}
