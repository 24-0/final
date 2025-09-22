import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ask Question - StudyConnect',
  description: 'Post a new question to the StudyConnect community',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function AskLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
