import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export const signUp = async (email: string, password: string, username: string) => {
  try {
    // Step 1: Create auth user first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return { error: authError };
    }

    // Step 2: Only create profile if auth was successful
    if (authData.user && authData.user.id) {
      // Before inserting profile, check authentication
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('Current user after signup:', user);
      console.log('User ID:', user?.id);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,  // This must match exactly
          username: username,
          // Don't include email here - it's in auth.users
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return { error: profileError };
      }

      return { success: true, user: authData.user, profile: profileData };
    }
  } catch (error) {
    console.error('Signup error:', error);
    return { error: error };
  }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) {
    console.error('SignIn error:', error)
    throw error
  }
  return data
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  if (error) {
    console.error('Google SignIn error:', error)
    throw error
  }
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('SignOut error:', error)
    throw error
  }
}

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getCurrentUserWithProfile = async () => {
  // Get current auth user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Get profile data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    user: user,           // Contains email, id, etc.
    profile: profile      // Contains username, full_name, etc.
  }
}

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  })
  if (error) throw error
}

export const updatePassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({
    password
  })
  if (error) throw error
}

export const updateProfile = async (updates: {
  username?: string
  full_name?: string
  avatar_url?: string
  bio?: string
}) => {
  const { data, error } = await supabase.auth.updateUser({
    data: updates
  })
  if (error) throw error
  return data
}

export const resendConfirmation = async (email: string) => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })
  if (error) throw error
}
