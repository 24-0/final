'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import HeaderWithPoints from '@/components/HeaderWithPoints'

// Helper function to generate slug
const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 50);
};

const handleSubmitQuestion = async (questionData: { title: string; description: string; subject: string; tags: string[] }) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User not authenticated:', userError);
      throw new Error('User not authenticated');
    }

    // Make sure user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found. Creating profile...');

      // Create profile if it doesn't exist
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          username: user.email,
          full_name: user.user_metadata?.full_name || user.email
        }]);

      if (createProfileError) {
        console.error('Failed to create profile:', createProfileError);
        throw createProfileError;
      }
    }

    // Submit question with correct field names
    const { data, error } = await supabase
      .from('questions')
      .insert([
        {
          title: questionData.title,
          content: questionData.description, // Map description to content
          subject: questionData.subject,
          tags: questionData.tags || [],
          author_id: user.id,
          slug: generateSlug(questionData.title) // You'll need this function
        }
      ])
      .select();

    if (error) {
      console.error('Error creating question:', error);
      throw error;
    } else {
      console.log('Question created successfully:', data);
      return data[0]; // Return the created question
    }

  } catch (err) {
    console.error('Unexpected error:', err);
    throw err;
  }
};

interface QuestionForm {
  title: string
  description: string
  subject: string
  tags: string
}

export default function AskPageWithPoints() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<QuestionForm>()

  const onSubmit = async (data: QuestionForm) => {
    setLoading(true)
    try {
      const tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag)

      const question = await handleSubmitQuestion({
        title: data.title,
        description: data.description,
        subject: data.subject,
        tags
      })

      toast.success('Question posted successfully')

      // Wait briefly to ensure DB consistency before redirecting
      await new Promise(resolve => setTimeout(resolve, 500))

      const questionId = question.id?.toString() ?? ''
      router.push(`/questions/${questionId}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to post question')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <HeaderWithPoints />
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Ask a Question</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">Title</label>
            <input
              id="title"
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What's your question?"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">Description</label>
            <textarea
              id="description"
              {...register('description', { required: 'Description is required' })}
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provide more details..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-2">Subject</label>
            <input
              id="subject"
              type="text"
              {...register('subject')}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Mathematics, Physics, Computer Science"
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-2">Tags</label>
            <input
              id="tags"
              type="text"
              {...register('tags')}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Comma-separated tags, e.g., algebra, calculus, homework"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Posting...' : 'Post Question'}
          </button>
        </form>
      </div>
    </div>
  )
}
