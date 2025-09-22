import { NextResponse } from 'next/server';
import { getGroups, createGroup } from '@/lib/groupsDatabase';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Get user from auth
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groups = await getGroups(user?.id);
    return NextResponse.json({ groups });
  } catch (error: unknown) {
    console.error('Error fetching groups:', error);
    let message = 'Internal server error';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const groupData = {
      name: body.name,
      description: body.description,
      is_private: body.is_private || false,
      created_by: user.id,
    };

    const newGroup = await createGroup(groupData);
    return NextResponse.json({ group: newGroup });
  } catch (error: unknown) {
    console.error('Error creating group:', error);
    let message = 'Internal server error';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
