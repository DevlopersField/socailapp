export type Platform = 'instagram' | 'linkedin' | 'twitter' | 'pinterest' | 'dribbble' | 'gmb' | 'reddit';
export type ContentType = 'case-study' | 'knowledge' | 'design' | 'trend' | 'promotion';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          platforms: Platform[];
          scheduled_at: string;
          status: PostStatus;
          content_type: ContentType;
          content: Record<string, { caption: string; hashtags: string[] }>;
          media: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at' | 'updated_at' | 'user_id'>;
        Update: Partial<Database['public']['Tables']['posts']['Insert']>;
      };
      analytics: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          platform: Platform;
          published_at: string;
          metrics: {
            impressions: number;
            reach: number;
            likes: number;
            comments: number;
            shares: number;
            saves: number;
            clicks: number;
            engagement_rate: number;
          };
          content_type: ContentType;
          hashtags: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['analytics']['Row'], 'id' | 'created_at' | 'user_id'>;
        Update: Partial<Database['public']['Tables']['analytics']['Insert']>;
      };
      platform_connections: {
        Row: {
          id: string;
          user_id: string;
          platform: Platform;
          access_token: string;
          refresh_token: string | null;
          token_expires_at: string | null;
          account_name: string | null;
          account_id: string | null;
          connected_at: string;
          status: 'connected' | 'expired' | 'disconnected';
        };
        Insert: Omit<Database['public']['Tables']['platform_connections']['Row'], 'id' | 'connected_at' | 'user_id'>;
        Update: Partial<Database['public']['Tables']['platform_connections']['Insert']>;
      };
      oauth_credentials: {
        Row: {
          id: string;
          user_id: string;
          platform: Platform;
          client_id: string;
          client_secret: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['oauth_credentials']['Row'], 'id' | 'created_at' | 'updated_at' | 'user_id'>;
        Update: Partial<Database['public']['Tables']['oauth_credentials']['Insert']>;
      };
      trends: {
        Row: {
          id: string;
          source: 'google' | 'reddit' | 'twitter';
          keyword: string;
          volume: number | null;
          trend_score: number;
          category: string | null;
          url: string | null;
          fetched_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trends']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['trends']['Insert']>;
      };
      scheduled_jobs: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          platform: Platform;
          scheduled_at: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          result: Record<string, unknown> | null;
          created_at: string;
          processed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['scheduled_jobs']['Row'], 'id' | 'created_at' | 'user_id'>;
        Update: Partial<Database['public']['Tables']['scheduled_jobs']['Insert']>;
      };
    };
  };
}

// Helper types
export type Post = Database['public']['Tables']['posts']['Row'];
export type PostInsert = Database['public']['Tables']['posts']['Insert'];
export type Analytics = Database['public']['Tables']['analytics']['Row'];
export type PlatformConnection = Database['public']['Tables']['platform_connections']['Row'];
export type Trend = Database['public']['Tables']['trends']['Row'];
export type ScheduledJob = Database['public']['Tables']['scheduled_jobs']['Row'];
