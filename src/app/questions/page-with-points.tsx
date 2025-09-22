'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Search, Bookmark } from 'lucide-react'
import toast from 'react-hot-toast'
import { saveBookmark, unsaveBookmark } from '@/lib/bookmarks'
import { getCurrentUser } from '@/lib/auth'
import HeaderWithPoints from '@/components/HeaderWithPoints'

interface Question {
  id: string
  title: string
  content: string
  author_id: string
  subject: string | null
  tags: string[] | null
  upvotes: number
  downvotes: number
  views: number
  is_resolved: boolean
  created_at: string
  updated_at: string
  profiles?: {
    username: string
    full_name: string
    avatar_url: string | null
  }[]
}

export default function QuestionsPageWithPoints() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [savedQuestionIds, setSavedQuestionIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchQuestions('')
    fetchSavedPosts()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchQuestions = async (term: string) => {
    try {
      let query = supabase
        .from('questions')
        .select(`
          *,
          profiles!author_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })

      if (term) {
        query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedPosts = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        const { data, error } = await supabase
          .from('saved_posts')
          .select('question_id')
          .eq('user_id', user.id)

        if (!error && data) {
          setSavedQuestionIds(new Set(data.map(s => s.question_id)))
        }
      }
    } catch (error) {
      console.error('Error fetching saved posts:', error)
    }
  }

  const toggleBookmark = async (questionId: string) => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        toast.error('You must be logged in to bookmark')
        return
      }
      if (savedQuestionIds.has(questionId)) {
        await unsaveBookmark(questionId)
        setSavedQuestionIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(questionId)
          return newSet
        })
        toast.success('Bookmark removed')
      } else {
        await saveBookmark(questionId)
        setSavedQuestionIds(prev => new Set(prev).add(questionId))
        toast.success('Bookmark added')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to toggle bookmark'
      toast.error(message)
    }
  }

  if (loading) {
    return (
      <div>
        <HeaderWithPoints />
        <div className="text-center py-8">Loading questions...</div>
      </div>
    )
  }

  return (
    <div>
      <HeaderWithPoints />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Questions</h1>
          <Link
            href="/ask"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Ask Question
          </Link>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No questions yet. Be the first to ask!
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <Link href={`/questions/${question.id}`}>
                  <h2 className="text-xl font-semibold text-blue-600 hover:text-blue-800 mb-2">
                    {question.title}
                  </h2>
                </Link>
                <p className="text-gray-600 mb-3 line-clamp-2">
                  {question.content}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {question.tags?.map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Asked by Anonymous • {format(new Date(question.created_at), 'MMM d, yyyy')}
                    {question.subject && ` • ${question.subject}`}
                  </div>
                  <button onClick={() => toggleBookmark(question.id)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                    <Bookmark className={savedQuestionIds.has(question.id) ? 'fill-current' : ''} size={20} />
                    {savedQuestionIds.has(question.id) ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
