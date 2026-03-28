export type Platform = 'instagram' | 'linkedin' | 'twitter' | 'pinterest' | 'dribbble' | 'gmb';
export type ContentType = 'case-study' | 'knowledge' | 'design' | 'trend' | 'promotion';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export interface Post {
  id: string;
  title: string;
  platforms: Platform[];
  scheduledAt: string;
  status: PostStatus;
  contentType: ContentType;
  content: Partial<Record<Platform, { caption: string; hashtags: string[] }>>;
  media: string[];
  createdAt: string;
}

export interface AnalyticsEntry {
  id: string;
  postId: string;
  platform: Platform;
  publishedAt: string;
  metrics: {
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    engagementRate: number;
  };
  contentType: ContentType;
  hashtags: string[];
}

export interface ScheduleData {
  posts: Post[];
}

export interface AnalyticsData {
  posts: AnalyticsEntry[];
  summary: {
    totalPosts: number;
    avgEngagementRate: number;
    bestPlatform: Platform;
    bestContentType: ContentType;
    bestPostingTime: string;
    bestDay: string;
    topHashtags: string[];
  };
}
