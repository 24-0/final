import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - StudyConnect',
  description: 'Sign in or sign up to StudyConnect',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
