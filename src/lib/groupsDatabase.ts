
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface Group {
  id?: string;
  name: string;
  description?: string;
  is_private?: boolean;
  created_by: string;
  created_at?: string;
}

export interface GroupMembership {
  id?: string;
  group_id: string;
  user_id: string;
  role?: string;
  joined_at?: string;
  created_at?: string;
}

export interface GroupResource {
  id?: string;
  group_id: string;
  uploaded_by: string;
  resource_url: string;
  description?: string;
  uploaded_at?: string;
}

export interface GroupMessage {
  id?: string;
  group_id: string;
  user_id: string;
  username: string;
  message?: string;
  file_url?: string;
  file_name?: string;
  created_at?: string;
}

// Groups CRUD
export async function createGroup(group: Group) {
  const { data, error } = await supabase
    .from('groups')
    .insert([group])
    .select();
  if (error) {
    throw error;
  }
  return data;
}

export async function getGroups(userId?: string) {
  let query = supabase
    .from('groups')
    .select(`
      *,
      group_memberships!inner(user_id, role)
    `)
    .order('created_at', { ascending: false });

  // If user is provided, filter to show only groups they can access
  if (userId) {
    query = query.or(`is_private.eq.false,group_memberships.user_id.eq.${userId}`);
  } else {
    // If no user, only show public groups
    query = query.eq('is_private', false);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return data;
}

export async function getGroupById(id: string) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    throw error;
  }
  return data;
}

// Group Memberships
export async function addGroupMember(membership: GroupMembership) {
  const { data, error } = await supabase
    .from('group_memberships')
    .insert([membership])
    .select();
  if (error) {
    throw error;
  }
  return data;
}

export async function getGroupMembers(groupId: string) {
  const { data, error } = await supabase
    .from('group_memberships')
    .select(`
      id,
      user_id,
      role,
      joined_at,
      profiles!group_memberships_user_id_fkey (
        id,
        username,
        full_name
      )
    `)
    .eq('group_id', groupId);
  if (error) {
    throw error;
  }
  return data;
}

export async function canUserJoinGroup(groupId: string, userId: string): Promise<boolean> {
  // Check if group exists and is public
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('is_private')
    .eq('id', groupId)
    .single();

  if (groupError || !group) {
    return false;
  }

  // If group is public, user can join
  if (!group.is_private) {
    return true;
  }

  // If group is private, check if user is already a member
  return await isUserMember(groupId, userId);
}

export async function joinGroup(groupId: string, userId: string) {
  // First validate that user can join this group
  const canJoin = await canUserJoinGroup(groupId, userId);
  if (!canJoin) {
    throw new Error('Cannot join this group. It may be private or you may not have permission.');
  }

  const membership: GroupMembership = {
    group_id: groupId,
    user_id: userId,
    role: 'member',
  };
  return await addGroupMember(membership);
}

export async function leaveGroup(groupId: string, userId: string) {
  const { error } = await supabase
    .from('group_memberships')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) {
    throw error;
  }
  return;
}

export async function isUserMember(groupId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('group_memberships')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    throw error;
  }
  return !!data;
}

// Group Resources
export async function addGroupResource(resource: GroupResource) {
  const { data, error } = await supabase
    .from('group_resources')
    .insert([resource])
    .select();
  if (error) {
    throw error;
  }
  return data;
}

export async function getGroupResources(groupId: string) {
  const { data, error } = await supabase
    .from('group_resources')
    .select('*')
    .eq('group_id', groupId)
    .order('uploaded_at', { ascending: false });
  if (error) {
    throw error;
  }
  return data;
}

// Group Messages
export async function addGroupMessage(message: GroupMessage) {
  const { data, error } = await supabase
    .from('group_messages')
    .insert([message])
    .select();
  if (error) {
    throw error;
  }
  return data;
}

export async function getGroupMessages(groupId: string) {
  const { data, error } = await supabase
    .from('group_messages')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });
  if (error) {
    throw error;
  }
  return data;
}
