import { NextResponse } from 'next/server';
import { getGroupMessages, addGroupMessage } from '@/lib/groupsDatabase';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const messages = await getGroupMessages(params.id);
    return NextResponse.json({ messages });
  } catch (error: unknown) {
    console.error('Error fetching group messages:', error);
    let message = 'Internal server error';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Fetch username from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    const username = profileError || !profileData ? 'Unknown' : profileData.username;

    const messageData = {
      group_id: params.id,
      user_id: user.id,
      username,
      message: body.message,
      file_url: body.file_url,
      file_name: body.file_name,
    };

    const newMessage = await addGroupMessage(messageData);
    return NextResponse.json({ message: newMessage });
  } catch (error: unknown) {
    console.error('Error adding group message:', error);
    let message = 'Internal server error';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
