import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Questions - StudyConnect',
  description: 'Browse and search questions from the StudyConnect community',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function QuestionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
