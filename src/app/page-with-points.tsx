'use client'

import HeaderWithPoints from '@/components/HeaderWithPoints'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, Trophy, Zap } from 'lucide-react'
import Link from 'next/link'

export default function HomeWithPoints() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <HeaderWithPoints />

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Connect, Learn, and Grow Together
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join the ultimate student Q&A platform where you can ask questions,
            share knowledge, form study groups, and earn rewards for your contributions.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-3">
                Join StudyConnect
              </Button>
            </Link>
            <Link href="/questions">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Browse Questions
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <BookOpen className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Ask & Answer</CardTitle>
              <CardDescription>
                Get help with your studies or share your knowledge with others
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Study Groups</CardTitle>
              <CardDescription>
                Form groups with classmates and collaborate on projects
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Trophy className="h-12 w-12 text-yellow-600 mb-4" />
              <CardTitle>Earn Points</CardTitle>
              <CardDescription>
                Gain reputation and unlock achievements as you contribute
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>AI Assistance</CardTitle>
              <CardDescription>
                Get AI-powered help with your questions and study materials
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-gray-600 mb-6">
            Join thousands of students already using StudyConnect to improve their grades
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="text-lg px-8 py-3">
              Create Your Account
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpen className="h-6 w-6" />
            <span className="text-xl font-bold">StudyConnect</span>
          </div>
          <p className="text-gray-400">
            © 2024 StudyConnect. Empowering students worldwide.
          </p>
        </div>
      </footer>
    </div>
  )
}
