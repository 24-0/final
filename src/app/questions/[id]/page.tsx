'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { saveBookmark, unsaveBookmark, isBookmarked as checkIsBookmarked } from '@/lib/bookmarks'
import { awardPoints, POINTS_CONFIG } from '@/lib/points'
import { format } from 'date-fns'
import { Bookmark } from 'lucide-react'
import toast from 'react-hot-toast'
import PointsDisplay from '@/components/PointsDisplay'

interface Question {
  id: string
  title: string
  content: string
  subject: string | null
  tags: string[] | null
  author_id: string
  created_at: string
  updated_at: string
  profiles?: {
    username: string
    full_name: string
    avatar_url: string | null
  }[]
}

interface Answer {
  id: string
  content: string
  question_id: string
  user_id: string
  upvotes: number
  downvotes: number
  is_accepted: boolean
  created_at: string
  updated_at: string
  profiles?: {
    username: string
    full_name: string
    avatar_url: string | null
  }[]
}

interface AnswerForm {
  content: string
}

interface AIAnswer {
  content: string
  confidence_score?: number
}

export default function QuestionDetailPage() {
  const params = useParams()
  const questionId = params?.id as string
  // Hooks must be called unconditionally
  const [question, setQuestion] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [aiAnswer, setAIAnswer] = useState<AIAnswer | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingAI, setLoadingAI] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AnswerForm>()

  const fetchQuestionAndAnswers = useCallback(async () => {
    try {
      console.log('Fetching question with ID:', questionId)  // Added log
      // Fetch question with author info from profiles table
      const { data: questionData, error: questionError } = await supabase
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
        .eq('id', questionId)
        .single()

      if (questionError) {
        console.error('Error fetching question:', questionError)
        setQuestion(null)
      } else {
        console.log('Fetched question data:', questionData)
        setQuestion(questionData)
      }

      // Fetch bookmark status
      const bookmarked = await checkIsBookmarked(questionId)
      setIsBookmarked(bookmarked)

      // Fetch answers with user profiles relation
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select(`
          *,
          profiles!user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('question_id', questionId)
        .order('created_at', { ascending: true })

      if (answersError) {
        console.error('Error fetching answers:', answersError)
      } else {
        console.log('Fetched answers data:', answersData)
      }
      setAnswers(answersData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load question')
    } finally {
      setLoading(false)
    }
  }, [questionId])

  useEffect(() => {
    fetchQuestionAndAnswers()
  }, [fetchQuestionAndAnswers])

  const toggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await unsaveBookmark(questionId)
        setIsBookmarked(false)
        toast.success('Bookmark removed')
      } else {
        await saveBookmark(questionId)
        setIsBookmarked(true)
        toast.success('Bookmark added')
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to toggle bookmark')
      } else {
        toast.error('Failed to toggle bookmark')
      }
    }
  }

  const onSubmitAnswer = async (data: AnswerForm) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.error('User not authenticated');
        toast.error('You must be logged in to answer')
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be logged in to answer')
        return
      }

      console.log('Authenticated user:', user)

      // Verify question_id and user_id exist
      const { data: questionExists, error: questionError } = await supabase
        .from('questions')
        .select('id')
        .eq('id', questionId)
        .single()

      if (questionError || !questionExists) {
        console.error('Question not found:', questionError)
        toast.error('Question not found. Cannot post answer.')
        return
      }

      const { data: userExists, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (userError || !userExists) {
        console.error('User profile not found in profiles table:', userError)
        toast.error('User profile not found. Cannot post answer.')
        return
      }

      // Check if answer already exists for this user and question
      const { data: existingAnswer } = await supabase
        .from('answers')
        .select('id')
        .eq('question_id', questionId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingAnswer) {
        console.warn('Answer already exists for this user and question')
        toast.error('You have already answered this question.')
        return
      }

      const { data: insertData, error } = await supabase
        .from('answers')
        .insert([
          {
            question_id: questionId,
            user_id: user.id,
            content: data.content,
          }
        ])
        .select()

      if (error) {
        console.error('Insert failed:', error.message);
      } else {
        console.log('Answer posted:', insertData);
        if (insertData && insertData[0]) {
          setAnswers(prev => [...prev, insertData[0]])
          reset()
          toast.success('Answer posted successfully')

          // Award points for answering
          await awardPoints(
            user.id,
            POINTS_CONFIG.ANSWER_QUESTION,
            `Answered question: ${questionId}`,
            { questionId, answerId: insertData[0].id }
          )
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error posting answer:', error)
        toast.error(error.message || 'Failed to post answer')
      } else {
        console.error('Error posting answer:', error)
        toast.error('Failed to post answer')
      }
    }
  }

  const fetchAIAnswer = async () => {
    setLoadingAI(true)
    try {
      if (!question) {
        toast.error('Question data not loaded')
        setLoadingAI(false)
        return
      }
      const response = await fetch('/api/ai-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId,
          questionContent: question.content
        })
      })
      const data = await response.json()
      if (response.ok) {
        setAIAnswer({ content: data.answer, confidence_score: data.confidence_score })
      } else {
        toast.error(data.error || 'Failed to fetch AI answer')
      }
    } catch (error) {
      console.error('Error fetching AI answer:', error)
      toast.error('Error fetching AI answer')
    } finally {
      setLoadingAI(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!question) {
    return <div className="text-center py-8">Question not found</div>
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Points Display */}
      <div className="mb-6 flex justify-end">
        <PointsDisplay showRank={true} size="md" />
      </div>

      {/* Question */}
      <div className="border border-gray-200 rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold mb-4">{question.title}</h1>
        <p className="text-gray-700 mb-4">{question.content}</p>
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-wrap gap-2">
            {question.tags?.map((tag, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                {tag}
              </span>
            ))}
          </div>
          <button onClick={toggleBookmark} className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
            <Bookmark className={isBookmarked ? 'fill-current' : ''} size={20} />
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
        </div>
        <div className="text-sm text-gray-500">
          Asked by Anonymous • {format(new Date(question.created_at), 'MMM d, yyyy')}
          {question.subject && ` • ${question.subject}`}
        </div>
      </div>

      {/* Answers */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">{answers.length} Answer{answers.length !== 1 ? 's' : ''}</h2>
        {answers.length === 0 ? (
          <p className="text-gray-500">No answers yet. Be the first to answer!</p>
        ) : (
          <div className="space-y-4">
            {answers.map((answer) => (
          <div key={answer.id} className="border border-gray-200 rounded-lg p-4 relative">
            <p className="text-gray-700 mb-2">{answer.content}</p>
            <div className="text-sm text-gray-500">
      Answered by Anonymous • {format(new Date(answer.created_at), 'MMM d, yyyy')}
            </div>
            <button
              onClick={fetchAIAnswer}
              disabled={loadingAI}
              className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 disabled:opacity-50"
              title="Get AI-generated answer"
            >
              {loadingAI ? 'Loading...' : 'AI Answer'}
            </button>
          </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Answer Section */}
      {aiAnswer && (
        <div className="border border-purple-600 rounded-lg p-6 mb-8 bg-purple-50">
          <h3 className="text-xl font-semibold mb-4 text-purple-700">AI Generated Answer</h3>
          <p className="text-gray-800">{aiAnswer.content}</p>
          {aiAnswer.confidence_score !== undefined && (
            <p className="text-sm text-purple-600 mt-2">Confidence: {(aiAnswer.confidence_score * 100).toFixed(1)}%</p>
          )}
        </div>
      )}

      {/* Answer Form */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Your Answer</h3>
        <form onSubmit={handleSubmit(onSubmitAnswer)}>
          <textarea
            {...register('content', { required: 'Answer content is required' })}
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            placeholder="Write your answer here..."
          />
          {errors.content && <p className="text-red-500 text-sm mb-4">{errors.content.message}</p>}
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Post Answer
          </button>
        </form>
      </div>
    </div>
  )
}
