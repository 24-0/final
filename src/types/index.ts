export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  points: number
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  title: string
  description: string
  user_id: string
  subject: string | null
  tags: string[] | null
  upvotes: number
  downvotes: number
  views: number
  is_resolved: boolean
  created_at: string
  updated_at: string
  author?: Profile
}

export interface Answer {
  id: string
  content: string
  question_id: string
  user_id: string
  upvotes: number
  downvotes: number
  is_accepted: boolean
  created_at: string
  updated_at: string
  author?: Profile
}

export interface Vote {
  id: string
  user_id: string
  target_type: 'question' | 'answer'
  target_id: string
  vote_type: 'up' | 'down'
  created_at: string
}

export interface Group {
  id: string
  name: string
  description: string | null
  creator_id: string
  is_private: boolean
  created_at: string
  updated_at: string
  creator?: Profile
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'admin' | 'moderator' | 'member'
  joined_at: string
  user?: Profile
}

export interface Resource {
  id: string
  title: string
  description: string | null
  url: string | null
  group_id: string | null
  uploader_id: string
  tags: string[] | null
  created_at: string
  uploader?: Profile
  group?: Group
}

export interface Comment {
  id: string
  content: string
  target_type: 'question' | 'answer'
  target_id: string
  author_id: string
  created_at: string
  updated_at: string
  author?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: 'answer' | 'vote' | 'comment' | 'group_invite'
  message: string
  is_read: boolean
  created_at: string
  related_id: string | null
}
