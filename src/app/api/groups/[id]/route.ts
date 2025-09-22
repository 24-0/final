import { NextResponse } from 'next/server';
import { getGroupById } from '@/lib/groupsDatabase';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const group = await getGroupById(params.id);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    return NextResponse.json({ group });
  } catch (error: unknown) {
    console.error('Error fetching group:', error);
    let message = 'Internal server error';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
