'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signInWithGoogle, resendConfirmation } from '@/lib/auth'
import toast from 'react-hot-toast'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Signed in successfully')
      router.push('/questions')
    } catch (error: any) {
      if (error.message?.includes('Email not confirmed')) {
        setShowResend(true)
        toast.error('Please confirm your email before signing in. Check your inbox or click "Resend Confirmation" below.')
      } else {
        toast.error(error.message || 'Failed to sign in')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    try {
      await resendConfirmation(email)
      toast.success('Confirmation email sent! Please check your inbox.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend confirmation')
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      // Redirect handled by Supabase
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with Google')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Sign In</h1>
        <label htmlFor="email" className="block mb-2 font-medium">Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-2 border border-gray-300 rounded"
        />
        <label htmlFor="password" className="block mb-2 font-medium">Password</label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 p-2 border border-gray-300 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <div className="mt-4 text-center">
          <span className="text-gray-500">or</span>
        </div>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full mt-4 bg-red-600 text-white py-2 rounded hover:bg-red-700"
        >
          Sign in with Google
        </button>
        {showResend && (
          <button
            type="button"
            onClick={handleResendConfirmation}
            className="w-full mt-4 bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Resend Confirmation Email
          </button>
        )}
      </form>
    </div>
  )
}
