import { supabase } from './supabase'

export const saveBookmark = async (questionId: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('saved_posts')
    .insert({ user_id: user.id, question_id: questionId })

  if (error) throw error
}

export const unsaveBookmark = async (questionId: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('saved_posts')
    .delete()
    .eq('user_id', user.id)
    .eq('question_id', questionId)

  if (error) throw error
}

export const isBookmarked = async (questionId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('saved_posts')
    .select('id')
    .eq('user_id', user.id)
    .eq('question_id', questionId)
    .maybeSingle()

  if (error) throw error
  return !!data
}
