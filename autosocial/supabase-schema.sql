-- AutoSocial Database Schema
-- Run this in Supabase SQL Editor: https://oeflvpelqpxqkqmjxwzw.supabase.co/project/sql

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Posts table
create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  platforms text[] not null default '{}',
  scheduled_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'failed')),
  content_type text not null default 'design' check (content_type in ('case-study', 'knowledge', 'design', 'trend', 'promotion')),
  content jsonb not null default '{}',
  media text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Analytics table
create table if not exists analytics (
  id uuid primary key default uuid_generate_v4(),
  post_id text not null,
  platform text not null,
  published_at timestamptz not null default now(),
  metrics jsonb not null default '{}',
  content_type text not null default 'design',
  hashtags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Platform connections
create table if not exists platform_connections (
  id uuid primary key default uuid_generate_v4(),
  platform text not null unique,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  account_name text,
  account_id text,
  connected_at timestamptz not null default now(),
  status text not null default 'connected' check (status in ('connected', 'expired', 'disconnected'))
);

-- Trends cache
create table if not exists trends (
  id uuid primary key default uuid_generate_v4(),
  source text not null check (source in ('google', 'reddit', 'twitter')),
  keyword text not null,
  volume integer,
  trend_score real not null default 0,
  category text,
  url text,
  fetched_at timestamptz not null default now()
);

-- Scheduled jobs (for the scheduler engine)
create table if not exists scheduled_jobs (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  platform text not null,
  scheduled_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  result jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

-- Indexes
create index if not exists idx_posts_status on posts(status);
create index if not exists idx_posts_scheduled_at on posts(scheduled_at);
create index if not exists idx_analytics_platform on analytics(platform);
create index if not exists idx_analytics_post_id on analytics(post_id);
create index if not exists idx_trends_source on trends(source);
create index if not exists idx_trends_fetched on trends(fetched_at);
create index if not exists idx_scheduled_jobs_status on scheduled_jobs(status);
create index if not exists idx_scheduled_jobs_scheduled on scheduled_jobs(scheduled_at);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

-- Enable Row Level Security (allow all for now — add auth later)
alter table posts enable row level security;
alter table analytics enable row level security;
alter table platform_connections enable row level security;
alter table trends enable row level security;
alter table scheduled_jobs enable row level security;

-- Permissive policies (open access with anon key — production should use auth)
create policy "Allow all on posts" on posts for all using (true) with check (true);
create policy "Allow all on analytics" on analytics for all using (true) with check (true);
create policy "Allow all on platform_connections" on platform_connections for all using (true) with check (true);
create policy "Allow all on trends" on trends for all using (true) with check (true);
create policy "Allow all on scheduled_jobs" on scheduled_jobs for all using (true) with check (true);

-- Seed sample data
insert into posts (title, platforms, scheduled_at, status, content_type, content, media) values
  ('Brand Identity Redesign — Before & After', '{"instagram","linkedin","dribbble"}', '2026-03-29T09:00:00Z', 'scheduled', 'case-study', '{"instagram":{"caption":"We transformed a 12-year-old brand into something bold and future-ready.","hashtags":["#brandidentity","#rebrand","#uidesign"]},"linkedin":{"caption":"Brand evolution is not just cosmetic — it is strategic.","hashtags":["#branding","#caseStudy"]},"dribbble":{"caption":"FinVault brand identity redesign.","hashtags":["#branding","#identity"]}}', '{}'),
  ('5 Web Design Trends Dominating Q2 2026', '{"linkedin","twitter","pinterest"}', '2026-03-30T11:00:00Z', 'scheduled', 'trend', '{"linkedin":{"caption":"The design landscape is shifting fast. Here are 5 trends taking hold.","hashtags":["#webdesign","#designtrends"]},"twitter":{"caption":"Hot take: bento grids are the new hero sections.","hashtags":["#webdesign","#ux"]},"pinterest":{"caption":"Web design trends Q2 2026.","hashtags":["#webdesign","#inspiration"]}}', '{}'),
  ('How We Build Accessible Design Systems', '{"linkedin","twitter"}', '2026-03-31T10:00:00Z', 'scheduled', 'knowledge', '{"linkedin":{"caption":"Accessibility is not a feature — it is a foundation.","hashtags":["#accessibility","#designsystem"]},"twitter":{"caption":"Accessibility-first design systems are not harder to build.","hashtags":["#a11y","#designsystem"]}}', '{}'),
  ('Spring Agency Package — Limited Spots', '{"instagram","linkedin","gmb"}', '2026-04-01T08:00:00Z', 'scheduled', 'promotion', '{"instagram":{"caption":"We are opening 3 spots for our Spring Growth Package.","hashtags":["#webagency","#growbusiness"]},"linkedin":{"caption":"Accepting 3 new clients for Spring Growth Package.","hashtags":["#webagency","#b2b"]},"gmb":{"caption":"Spring Growth Package now available.","hashtags":[]}}', '{}'),
  ('UI Component Showcase — Card Variants', '{"dribbble","pinterest","instagram"}', '2026-04-02T14:00:00Z', 'scheduled', 'design', '{"dribbble":{"caption":"Dark-mode card variants for SaaS client UI kit.","hashtags":["#uikit","#darkmode"]},"pinterest":{"caption":"Dark mode card components.","hashtags":["#uikit","#saasdesign"]},"instagram":{"caption":"Every pixel counts. Card component system.","hashtags":["#uikit","#uidesign"]}}', '{}'),
  ('Motion Design Principles for Web', '{"linkedin","dribbble","twitter"}', '2026-04-05T10:00:00Z', 'draft', 'knowledge', '{"linkedin":{"caption":"Motion on the web is not decoration — it is communication.","hashtags":["#motiondesign","#ux"]},"dribbble":{"caption":"Motion principles for modern web UX.","hashtags":["#motiondesign","#interaction"]},"twitter":{"caption":"Motion design has 1 job: reduce friction.","hashtags":["#motiondesign","#ux"]}}', '{}');

-- Seed analytics
insert into analytics (post_id, platform, published_at, metrics, content_type, hashtags) values
  ('hist-001', 'instagram', '2026-03-01T09:00:00Z', '{"impressions":14200,"reach":9800,"likes":742,"comments":89,"shares":134,"saves":310,"clicks":0,"engagement_rate":9.94}', 'case-study', '{"#brandidentity","#rebrand"}'),
  ('hist-001', 'linkedin', '2026-03-01T09:00:00Z', '{"impressions":8600,"reach":6200,"likes":312,"comments":47,"shares":88,"saves":0,"clicks":215,"engagement_rate":7.63}', 'case-study', '{"#branding","#caseStudy"}'),
  ('hist-002', 'twitter', '2026-03-05T11:00:00Z', '{"impressions":22300,"reach":17800,"likes":1104,"comments":213,"shares":567,"saves":0,"clicks":890,"engagement_rate":12.04}', 'knowledge', '{"#a11y","#designsystem"}'),
  ('hist-003', 'instagram', '2026-03-10T14:00:00Z', '{"impressions":9100,"reach":6700,"likes":418,"comments":52,"shares":67,"saves":198,"clicks":0,"engagement_rate":8.08}', 'design', '{"#uikit","#darkmode"}'),
  ('hist-003', 'dribbble', '2026-03-10T14:00:00Z', '{"impressions":5400,"reach":4100,"likes":610,"comments":38,"shares":22,"saves":0,"clicks":175,"engagement_rate":15.74}', 'design', '{"#uikit","#darkmode"}'),
  ('hist-004', 'twitter', '2026-03-14T09:30:00Z', '{"impressions":31500,"reach":24600,"likes":1876,"comments":342,"shares":891,"saves":0,"clicks":1240,"engagement_rate":13.81}', 'trend', '{"#webdesign","#designtrends"}'),
  ('hist-005', 'pinterest', '2026-03-24T11:00:00Z', '{"impressions":18900,"reach":14200,"likes":934,"comments":12,"shares":410,"saves":1230,"clicks":678,"engagement_rate":17.22}', 'design', '{"#uikit","#inspiration"}'),
  ('hist-006', 'twitter', '2026-03-26T09:30:00Z', '{"impressions":27400,"reach":21000,"likes":1530,"comments":287,"shares":720,"saves":0,"clicks":1050,"engagement_rate":13.09}', 'knowledge', '{"#motiondesign","#ux"}');
