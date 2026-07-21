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
          role: 'influencer' | 'brand'
          full_name: string
          email: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'influencer' | 'brand'
          full_name: string
          email: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'influencer' | 'brand'
          full_name?: string
          email?: string
          avatar_url?: string | null
          created_at?: string
        }
      }
      influencers: {
        Row: {
          id: string
          user_id: string
          platform: string
          niche: string
          followers_count: number
          engagement_rate: number
          bio: string | null
          location: string | null
          instagram_url: string | null
          youtube_url: string | null
          tiktok_url: string | null
          is_public: boolean
          instagram_connected: boolean
          instagram_business_id: string | null
          instagram_username: string | null
          // instagram_access_token is intentionally omitted — SELECT revoked from client roles
          instagram_token_expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: string
          niche: string
          followers_count: number
          engagement_rate: number
          bio?: string | null
          location?: string | null
          instagram_url?: string | null
          youtube_url?: string | null
          tiktok_url?: string | null
          is_public?: boolean
          instagram_connected?: boolean
          instagram_business_id?: string | null
          instagram_username?: string | null
          instagram_access_token?: string | null
          instagram_token_expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: string
          niche?: string
          followers_count?: number
          engagement_rate?: number
          bio?: string | null
          location?: string | null
          instagram_url?: string | null
          youtube_url?: string | null
          tiktok_url?: string | null
          is_public?: boolean
          instagram_connected?: boolean
          instagram_business_id?: string | null
          instagram_username?: string | null
          instagram_access_token?: string | null
          instagram_token_expires_at?: string | null
          created_at?: string
        }
      }
      brands: {
        Row: {
          id: string
          user_id: string
          company_name: string
          industry: string
          website: string | null
          logo: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          industry: string
          website?: string | null
          logo?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          industry?: string
          website?: string | null
          logo?: string | null
          description?: string | null
          created_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          brand_id: string
          title: string
          description: string
          budget: number
          deadline: string
          status: 'requested' | 'accepted' | 'rejected' | 'in_progress' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          title: string
          description: string
          budget: number
          deadline: string
          status?: 'requested' | 'accepted' | 'rejected' | 'in_progress' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          title?: string
          description?: string
          budget?: number
          deadline?: string
          status?: 'requested' | 'accepted' | 'rejected' | 'in_progress' | 'completed'
          created_at?: string
        }
      }
      campaign_requests: {
        Row: {
          id: string
          campaign_id: string
          brand_id: string
          influencer_id: string
          status: 'requested' | 'accepted' | 'rejected'
          message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          brand_id: string
          influencer_id: string
          status?: 'requested' | 'accepted' | 'rejected'
          message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          brand_id?: string
          influencer_id?: string
          status?: 'requested' | 'accepted' | 'rejected'
          message?: string | null
          created_at?: string
        }
      }
      campaign_notes: {
        Row: {
          id: string
          campaign_id: string
          sender_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          sender_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          sender_id?: string
          message?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          read: boolean
          type: string
          link: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          read?: boolean
          type: string
          link?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          read?: boolean
          type?: string
          link?: string | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'influencer' | 'brand'
      campaign_status: 'requested' | 'accepted' | 'rejected' | 'in_progress' | 'completed'
      request_status: 'requested' | 'accepted' | 'rejected'
    }
  }
}
