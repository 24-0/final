import { NextResponse } from 'next/server';
import { joinGroup } from '@/lib/groupsDatabase';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;
    const userId = user.id;

    // Call joinGroup function which now includes validation
    const data = await joinGroup(groupId, userId);

    return NextResponse.json({
      message: 'Successfully joined group',
      data
    });
  } catch (error: unknown) {
    console.error('Error joining group:', error);
    let message = 'Internal server error';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
