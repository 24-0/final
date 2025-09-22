export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          points: number
          country: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          points?: number
          country?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          points?: number
          country?: string | null
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "profiles_id_fkey"
              columns: ["id"]
              isOneToOne: true
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
      questions: {
        Row: {
      id: string
      title: string
      content: string
      slug: string | null
      author_id: string
      subject: string | null
      tags: string[] | null
      upvotes: number
      downvotes: number
      views: number
      is_resolved: boolean
      answer_limit: number
      created_at: string
      updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          author_id: string
          subject?: string | null
          tags?: string[] | null
          upvotes?: number
          downvotes?: number
          views?: number
          is_resolved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          author_id?: string
          subject?: string | null
          tags?: string[] | null
          upvotes?: number
          downvotes?: number
          views?: number
          is_resolved?: boolean
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "questions_author_id_fkey"
              columns: ["author_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
      answers: {
        Row: {
      id: string
      content: string
      question_id: string
      user_id: string
      upvotes: number
      downvotes: number
      is_accepted: boolean
      created_at: string
      updated_at: string
        }
        Insert: {
          id?: string
          content: string
          question_id: string
          user_id: string
          upvotes?: number
          downvotes?: number
          is_accepted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          question_id?: string
          user_id?: string
          upvotes?: number
          downvotes?: number
          is_accepted?: boolean
          created_at?: string
          updated_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "answers_user_id_fkey"
              columns: ["user_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "answers_question_id_fkey"
              columns: ["question_id"]
              isOneToOne: false
              referencedRelation: "questions"
              referencedColumns: ["id"]
            }
          ]
      }
      votes: {
        Row: {
      id: string
      user_id: string
      target_type: string
      target_id: string
      vote_type: string
      created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_type: string
          target_id: string
          vote_type: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_type?: string
          target_id?: string
          vote_type?: string
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "votes_user_id_fkey"
              columns: ["user_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          is_private: boolean
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_private?: boolean
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_private?: boolean
          created_by?: string
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "groups_created_by_fkey"
              columns: ["created_by"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
      group_memberships: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: string
          joined_at: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: string
          joined_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: string
          joined_at?: string
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "group_memberships_group_id_fkey"
              columns: ["group_id"]
              isOneToOne: false
              referencedRelation: "groups"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "group_memberships_user_id_fkey"
              columns: ["user_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
      group_messages: {
        Row: {
          id: string
          group_id: string
          user_id: string
          username: string
          message: string | null
          file_url: string | null
          file_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          username: string
          message?: string | null
          file_url?: string | null
          file_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          username?: string
          message?: string | null
          file_url?: string | null
          file_name?: string | null
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "group_messages_group_id_fkey"
              columns: ["group_id"]
              isOneToOne: false
              referencedRelation: "groups"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "group_messages_user_id_fkey"
              columns: ["user_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
      group_resources: {
        Row: {
          id: string
          group_id: string
          uploaded_by: string
          resource_url: string
          description: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          group_id: string
          uploaded_by: string
          resource_url: string
          description?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          uploaded_by?: string
          resource_url?: string
          description?: string | null
          uploaded_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "group_resources_group_id_fkey"
              columns: ["group_id"]
              isOneToOne: false
              referencedRelation: "groups"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "group_resources_uploaded_by_fkey"
              columns: ["uploaded_by"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string | null
          url: string | null
          group_id: string | null
          uploader_id: string
          tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          url?: string | null
          group_id?: string | null
          uploader_id: string
          tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          url?: string | null
          group_id?: string | null
          uploader_id?: string
          tags?: string[] | null
          created_at?: string
        }
          Relationships: [
            {
              foreignKeyName: "resources_group_id_fkey"
              columns: ["group_id"]
              isOneToOne: false
              referencedRelation: "groups"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "resources_uploader_id_fkey"
              columns: ["uploader_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
