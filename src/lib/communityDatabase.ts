import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface CommunityMessage {
  id?: string;
  user_id: string;
  username: string;
  country: string;
  message: string;
  created_at?: string;
}

export async function addMessage(message: CommunityMessage) {
  const { data, error } = await supabase
    .from('community_messages')
    .insert([{
      user_id: message.user_id,
      username: message.username,
      country: message.country,
      message: message.message,
    }])
    .select();
  if (error) {
    throw error;
  }
  return data;
}

export async function getMessagesByCountry(country: string) {
  let query = supabase
    .from('community_messages')
    .select('*')
    .order('created_at', { ascending: true });

  if (country && country.trim() !== '') {
    query = query.eq('country', country);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return data;
}
