'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { addMessage, getMessagesByCountry, CommunityMessage } from '@/lib/communityDatabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useSupabase } from '@/components/providers/SupabaseProvider';

export default function CommunityPage() {
  const { session, loading } = useSupabase();
  const router = useRouter();

  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [country, setCountry] = useState('Global');
  const [posting, setPosting] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await getMessagesByCountry(country === 'Global' ? '' : country);
      setMessages(data || []);
    } catch {
      toast.error('Failed to load messages');
    }
  }, [country]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  async function handlePostMessage() {
    if (!session) {
      toast.error('You must be signed in to post messages');
      router.push('/auth/signin?redirect=/community');
      return;
    }
    if (!messageText.trim()) {
      toast.error('Message cannot be empty');
      return;
    }
    setPosting(true);
    try {
      // Moderate message
      const modResponse = await fetch('/api/community-moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });
      const modResult = await modResponse.json();
      if (modResult.flagged) {
        toast.error('Message flagged by moderation');
        setPosting(false);
        return;
      }

      const newMessage: CommunityMessage = {
        user_id: session.user.id,
        username: session.user.user_metadata?.full_name || session.user.email || 'Anonymous',
        country: country === 'Global' ? '' : country,
        message: messageText.trim(),
      };
      await addMessage(newMessage);
      setMessageText('');
      fetchMessages();
      toast.success('Message posted');
    } catch {
      toast.error('Failed to post message');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Community Messages</h1>
      <div className="mb-4">
        <label htmlFor="country" className="block mb-1 font-semibold">Select Country</label>
        <select
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="border rounded p-2 w-full max-w-xs"
        >
          <option value="Global">Global</option>
          <option value="USA">USA</option>
          <option value="India">India</option>
          <option value="UK">UK</option>
          <option value="Canada">Canada</option>
          {/* Add more countries as needed */}
        </select>
      </div>
      <div className="mb-4">
        <textarea
          rows={3}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Write your message here..."
          className="border rounded p-2 w-full"
          disabled={posting || loading}
        />
        <button
          onClick={handlePostMessage}
          disabled={posting || loading}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {posting ? 'Posting...' : 'Post Message'}
        </button>
      </div>
      <div>
        {messages.length === 0 ? (
          <p>No messages found for {country}.</p>
        ) : (
          <ul className="space-y-4">
            {messages.map((msg) => (
              <li key={msg.id} className="border rounded p-3 bg-gray-50">
                <p className="font-semibold">{msg.username} <span className="text-sm text-gray-500">({msg.country || 'Global'})</span></p>
                <p>{msg.message}</p>
                <p className="text-xs text-gray-400">{msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
