import { supabase } from './supabase';
import type { Post, PostInsert, Analytics, PlatformConnection, Trend, ScheduledJob } from './database.types';

// ==================== POSTS ====================

export async function getPosts(filters?: { status?: string; platform?: string; contentType?: string }) {
  let query = supabase.from('posts').select('*').order('scheduled_at', { ascending: true });
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.platform) query = query.contains('platforms', [filters.platform]);
  if (filters?.contentType) query = query.eq('content_type', filters.contentType);
  const { data, error } = await query;
  if (error) throw error;
  return data as Post[];
}

export async function getPostById(id: string) {
  const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Post;
}

export async function createPost(post: PostInsert) {
  const { data, error } = await supabase.from('posts').insert(post).select().single();
  if (error) throw error;
  return data as Post;
}

export async function updatePost(id: string, updates: Partial<PostInsert>) {
  const { data, error } = await supabase.from('posts').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Post;
}

export async function deletePost(id: string) {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}

export async function getUpcomingPosts(limit = 5) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .in('status', ['scheduled', 'draft'])
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data as Post[];
}

export async function getPostsByDateRange(start: string, end: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .gte('scheduled_at', start)
    .lte('scheduled_at', end)
    .order('scheduled_at', { ascending: true });
  if (error) throw error;
  return data as Post[];
}

// ==================== ANALYTICS ====================

export async function getAnalytics() {
  const { data, error } = await supabase.from('analytics').select('*').order('published_at', { ascending: false });
  if (error) throw error;
  return data as Analytics[];
}

export async function addAnalyticsEntry(entry: Omit<Analytics, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('analytics').insert(entry).select().single();
  if (error) throw error;
  return data as Analytics;
}

export async function getAnalyticsSummary() {
  const entries = await getAnalytics();
  if (!entries.length) return null;

  const totalImpressions = entries.reduce((s, e) => s + (e.metrics?.impressions || 0), 0);
  const totalReach = entries.reduce((s, e) => s + (e.metrics?.reach || 0), 0);
  const avgER = entries.reduce((s, e) => s + (e.metrics?.engagement_rate || 0), 0) / entries.length;

  // Best platform
  const platformMap: Record<string, { total: number; count: number }> = {};
  entries.forEach(e => {
    if (!platformMap[e.platform]) platformMap[e.platform] = { total: 0, count: 0 };
    platformMap[e.platform].total += e.metrics?.engagement_rate || 0;
    platformMap[e.platform].count++;
  });
  const bestPlatform = Object.entries(platformMap)
    .map(([p, v]) => ({ platform: p, avgER: v.total / v.count }))
    .sort((a, b) => b.avgER - a.avgER)[0]?.platform || 'instagram';

  return {
    totalPosts: entries.length,
    totalImpressions,
    totalReach,
    avgEngagementRate: Math.round(avgER * 100) / 100,
    bestPlatform,
    entries,
  };
}

// ==================== PLATFORM CONNECTIONS ====================

export async function getConnections() {
  const { data, error } = await supabase.from('platform_connections').select('*');
  if (error) throw error;
  return data as PlatformConnection[];
}

export async function upsertConnection(connection: Omit<PlatformConnection, 'id' | 'connected_at'>) {
  const { data, error } = await supabase
    .from('platform_connections')
    .upsert(connection, { onConflict: 'platform' })
    .select()
    .single();
  if (error) throw error;
  return data as PlatformConnection;
}

export async function deleteConnection(platform: string) {
  const { error } = await supabase.from('platform_connections').delete().eq('platform', platform);
  if (error) throw error;
}

// ==================== TRENDS ====================

export async function getTrends(source?: string) {
  let query = supabase.from('trends').select('*').order('trend_score', { ascending: false });
  if (source) query = query.eq('source', source);
  // Only get trends fetched in last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  query = query.gte('fetched_at', oneDayAgo);
  const { data, error } = await query;
  if (error) throw error;
  return data as Trend[];
}

export async function saveTrends(trends: Omit<Trend, 'id'>[]) {
  const { data, error } = await supabase.from('trends').insert(trends).select();
  if (error) throw error;
  return data as Trend[];
}

export async function clearOldTrends() {
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from('trends').delete().lt('fetched_at', twoDaysAgo);
  if (error) throw error;
}

// ==================== SCHEDULED JOBS ====================

export async function getScheduledJobs(status?: string) {
  let query = supabase.from('scheduled_jobs').select('*').order('scheduled_at', { ascending: true });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data as ScheduledJob[];
}

export async function createScheduledJob(job: Omit<ScheduledJob, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('scheduled_jobs').insert(job).select().single();
  if (error) throw error;
  return data as ScheduledJob;
}

export async function processScheduledJobs() {
  // Get all pending jobs that are due
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('scheduled_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', now);
  if (error) throw error;
  return data as ScheduledJob[];
}

export async function updateJobStatus(id: string, status: string, result?: Record<string, unknown>) {
  const { error } = await supabase
    .from('scheduled_jobs')
    .update({ status, result, processed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
