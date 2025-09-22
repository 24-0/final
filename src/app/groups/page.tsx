'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getGroups, createGroup, Group } from '@/lib/groupsDatabase'
import { getCurrentUser } from '@/lib/auth'
import toast from 'react-hot-toast'
import type { User } from '@supabase/supabase-js'

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_private: false,
  })

  useEffect(() => {
    const fetchUserAndGroups = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        const grps = await getGroups()
        setGroups(grps)
      } catch (error) {
        console.error('Error fetching groups:', error)
        toast.error('Failed to load groups')
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndGroups()
  }, [])

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.name.trim() || !formData.description.trim()) return

    setCreating(true)
    try {
      const newGroup: Group = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_private: formData.is_private,
        created_by: user.id,
      }

      await createGroup(newGroup)
      setFormData({ name: '', description: '', is_private: false })
      setShowCreateForm(false)
      toast.success('Group created successfully!')

      // Refresh groups
      const grps = await getGroups()
      setGroups(grps)
    } catch (error) {
      console.error('Error creating group:', error)
      toast.error('Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto p-6 text-center">Loading groups...</div>
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p>Please sign in to view and create groups.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Study Groups</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancel' : 'Create Group'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Group</h2>
          <form onSubmit={handleCreateGroup}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter group name"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Describe your group"
                required
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_private}
                  onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Private Group</span>
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No groups yet. Be the first to create one!
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-2">{group.name}</h3>
              <p className="text-gray-600 mb-3 line-clamp-2">{group.description}</p>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded ${group.is_private ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {group.is_private ? 'Private' : 'Public'}
                </span>
                <Link
                  href={`/groups/${group.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Group →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
