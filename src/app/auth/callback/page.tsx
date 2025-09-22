'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          toast.error('Authentication failed')
          router.push('/auth/signin')
          return
        }

        if (data.session) {
          // Create or update user profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.session.user.id,
              username: data.session.user.user_metadata?.full_name?.toLowerCase().replace(/\s+/g, '') || null,
              full_name: data.session.user.user_metadata?.full_name || null,
              avatar_url: data.session.user.user_metadata?.avatar_url || null,
            })

          if (profileError) {
            console.error('Profile creation error:', profileError)
          }

          toast.success('Welcome to StudyConnect!')
          router.push('/dashboard')
        } else {
          router.push('/auth/signin')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        toast.error('Authentication failed')
        router.push('/auth/signin')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  )
}
