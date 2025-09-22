'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getGroupById, getGroupMembers, joinGroup, leaveGroup, isUserMember, Group, GroupMessage, addGroupMessage, getGroupMessages } from '@/lib/groupsDatabase'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import type { User } from '@supabase/supabase-js'

interface GroupMember {
  id: string
  user_id: string
  joined_at: string
  profiles: {
    id: string
    username: string
    full_name: string
  }[]
}

export default function GroupDetailsPage() {
  const params = useParams() as { id: string }
  const groupId = params.id

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [joining, setJoining] = useState(false)

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)

        const grp = await getGroupById(groupId)
        setGroup(grp)

        const mems = await getGroupMembers(groupId)
        setMembers(mems)

        if (currentUser) {
          const member = await isUserMember(groupId, currentUser.id)
          setIsMember(member)
        }
      } catch (error) {
        console.error('Error fetching group data:', error)
        toast.error('Failed to load group')
      } finally {
        setLoading(false)
      }
    }

    if (groupId) {
      fetchData()
    }
  }, [groupId])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const msgs = await getGroupMessages(groupId);
        setMessages(msgs);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      }
    };

    if (groupId) {
      fetchMessages();
    }
  }, [groupId]);

  const handleJoinLeave = async () => {
    if (!user) return

    setJoining(true)
    try {
      if (isMember) {
        await leaveGroup(groupId, user.id)
        setIsMember(false)
        toast.success('Left group successfully')
      } else {
        await joinGroup(groupId, user.id)
        setIsMember(true)
        toast.success('Joined group successfully')
      }

      // Refresh members
      const mems = await getGroupMembers(groupId)
      setMembers(mems)
    } catch (error) {
      console.error('Error updating membership:', error)
      toast.error('Failed to update membership')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto p-6 text-center">Loading group...</div>
  }

  if (!group) {
    return <div className="max-w-4xl mx-auto p-6 text-center">Group not found.</div>
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !file) {
      toast.error('Please enter a message or select a file');
      return;
    }
    if (!user) {
      toast.error('You must be logged in to send messages');
      return;
    }
    setSending(true);
    try {
      let fileUrl = '';
      let fileName = '';
      if (file) {
        // Upload file to Supabase storage
        const fileExt = file.name.split('.').pop();
        const filePath = `${groupId}/${Date.now()}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage
          .from('group-messages')
          .upload(filePath, file);
        if (uploadError) {
          throw uploadError;
        }
        fileUrl = data?.path || '';
        fileName = file.name;
      }

      await addGroupMessage({
        group_id: groupId,
        user_id: user.id,
        username: user.user_metadata?.username || 'Unknown',
        message: newMessage.trim() || undefined,
        file_url: fileUrl || undefined,
        file_name: fileName || undefined,
      });

      setNewMessage('');
      setFile(null);

      // Refresh messages
      const msgs = await getGroupMessages(groupId);
      setMessages(msgs);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
            <p className="text-gray-600 mb-3">{group.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className={`px-2 py-1 rounded text-xs ${group.is_private ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {group.is_private ? 'Private' : 'Public'}
              </span>
              <span>{members.length} member{members.length !== 1 ? 's' : ''}</span>
              <span>Created {format(new Date(group.created_at!), 'MMM d, yyyy')}</span>
            </div>
          </div>
          {user && (
            <button
              onClick={handleJoinLeave}
              disabled={joining}
              className={`px-4 py-2 rounded-md font-medium ${
                isMember
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {joining ? 'Processing...' : isMember ? 'Leave Group' : 'Join Group'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Group Discussion</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto mb-4 border border-gray-300 rounded p-4 bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="mb-3">
                <div className="text-sm font-semibold">{msg.username}</div>
                <div className="text-gray-700">{msg.message}</div>
                {msg.file_url && (
                  <a href={supabase.storage.from('group-messages').getPublicUrl(msg.file_url).data.publicUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    {msg.file_name || 'File'}
                  </a>
                )}
                <div className="text-xs text-gray-400">{format(new Date(msg.created_at!), 'MMM d, yyyy h:mm a')}</div>
              </div>
            ))
          )}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isMember || sending}
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            disabled={!isMember || sending}
            aria-label="Upload file"
          />
          <button
            onClick={handleSendMessage}
            disabled={!isMember || sending}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Members ({members.length})</h2>
        {members.length === 0 ? (
          <p className="text-gray-500">No members yet.</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const profile = member.profiles?.[0];
              const displayName = profile?.full_name || profile?.username || 'Unknown User';
              const initials = displayName.charAt(0).toUpperCase();

              return (
                <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                    {initials}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{displayName}</p>
                    {profile?.username && <p className="text-sm text-gray-500">@{profile.username}</p>}
                  </div>
                  <div className="text-sm text-gray-500">
                    Joined {format(new Date(member.joined_at), 'MMM d, yyyy')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}
