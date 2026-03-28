import type { Post, AnalyticsEntry, ScheduleData, AnalyticsData } from './types';

export const scheduledPosts: Post[] = [
  {
    id: 'post-001',
    title: 'Brand Identity Redesign — Before & After',
    platforms: ['instagram', 'linkedin', 'dribbble'],
    scheduledAt: '2026-03-29T09:00:00Z',
    status: 'scheduled',
    contentType: 'case-study',
    content: {
      instagram: {
        caption:
          'We transformed a 12-year-old brand into something bold and future-ready. Swipe to see the full before & after. The new identity reflects their ambition to lead in fintech for the next decade.',
        hashtags: ['#brandidentity', '#rebrand', '#uidesign', '#logodesign', '#agencylife', '#designprocess'],
      },
      linkedin: {
        caption:
          "Brand evolution isn't just cosmetic — it's strategic. Here's how we helped FinVault reposition themselves in a crowded market through intentional visual storytelling. Full case study linked below.",
        hashtags: ['#branding', '#caseStudy', '#designStrategy', '#webagency'],
      },
      dribbble: {
        caption: 'FinVault brand identity redesign. Full project on Behance.',
        hashtags: ['#branding', '#identity', '#logodesign', '#typography'],
      },
    },
    media: ['/media/finvault-before.jpg', '/media/finvault-after.jpg', '/media/finvault-mockup.jpg'],
    createdAt: '2026-03-25T14:30:00Z',
  },
  {
    id: 'post-002',
    title: '5 Web Design Trends Dominating Q2 2026',
    platforms: ['linkedin', 'twitter', 'pinterest'],
    scheduledAt: '2026-03-30T11:00:00Z',
    status: 'scheduled',
    contentType: 'trend',
    content: {
      linkedin: {
        caption:
          'The design landscape is shifting fast. Here are 5 trends we\'re seeing take hold across top-performing client sites this quarter: bento grids, motion micro-interactions, dark glassmorphism, variable fonts, and spatial UI patterns.',
        hashtags: ['#webdesign', '#designtrends', '#ux', '#ui', '#webdevelopment'],
      },
      twitter: {
        caption:
          'Hot take: bento grids are the new hero sections. Here are 5 web design trends our agency is seeing dominate Q2 2026 👇',
        hashtags: ['#webdesign', '#designtrends', '#ux'],
      },
      pinterest: {
        caption: 'Web design trends Q2 2026 — curated inspiration board.',
        hashtags: ['#webdesign', '#designtrends', '#inspiration', '#ux', '#moderndesign'],
      },
    },
    media: ['/media/trends-bento.jpg', '/media/trends-motion.jpg'],
    createdAt: '2026-03-26T09:15:00Z',
  },
  {
    id: 'post-003',
    title: 'How We Build Accessible Design Systems',
    platforms: ['linkedin', 'twitter'],
    scheduledAt: '2026-03-31T10:00:00Z',
    status: 'scheduled',
    contentType: 'knowledge',
    content: {
      linkedin: {
        caption:
          'Accessibility is not a feature — it\'s a foundation. Our design system process starts with WCAG 2.2 AA as a baseline, not an afterthought. Here\'s our 6-step framework for building accessible, scalable systems for enterprise clients.',
        hashtags: ['#accessibility', '#designsystem', '#wcag', '#ux', '#inclusivedesign'],
      },
      twitter: {
        caption:
          'Accessibility-first design systems aren\'t harder to build — they\'re just built with better constraints. Here\'s our 6-step framework:',
        hashtags: ['#a11y', '#designsystem', '#ux'],
      },
    },
    media: ['/media/design-system-doc.jpg'],
    createdAt: '2026-03-26T16:00:00Z',
  },
  {
    id: 'post-004',
    title: 'Spring Agency Package — Limited Spots',
    platforms: ['instagram', 'linkedin', 'gmb'],
    scheduledAt: '2026-04-01T08:00:00Z',
    status: 'scheduled',
    contentType: 'promotion',
    content: {
      instagram: {
        caption:
          'We\'re opening 3 spots for our Spring Growth Package — full brand, web design, and content strategy for scaling businesses. DM us "SPRING" to learn more.',
        hashtags: ['#webagency', '#branddesign', '#limitedspots', '#digitalmarketing', '#growyourbusiness'],
      },
      linkedin: {
        caption:
          'We\'re accepting 3 new clients for our Spring Growth Package. This includes brand identity, website design, and a 3-month content strategy. Designed for scaling B2B companies.',
        hashtags: ['#webagency', '#b2bmarketing', '#brandstrategy'],
      },
      gmb: {
        caption: 'Spring Growth Package now available. Limited to 3 clients. Contact us to reserve your spot.',
        hashtags: [],
      },
    },
    media: ['/media/spring-package.jpg'],
    createdAt: '2026-03-27T10:00:00Z',
  },
  {
    id: 'post-005',
    title: 'UI Component Showcase — Card Variants',
    platforms: ['dribbble', 'pinterest', 'instagram'],
    scheduledAt: '2026-04-02T14:00:00Z',
    status: 'scheduled',
    contentType: 'design',
    content: {
      dribbble: {
        caption: 'A collection of dark-mode card variants built for our SaaS client UI kit. 12 states, fully accessible.',
        hashtags: ['#uikit', '#darkmode', '#components', '#saas', '#uidesign'],
      },
      pinterest: {
        caption: 'Dark mode card components — SaaS UI kit design inspiration.',
        hashtags: ['#uikit', '#darkmode', '#saasdesign', '#components'],
      },
      instagram: {
        caption:
          'Every pixel counts. Here\'s a peek at the card component system we built for a SaaS client — 12 variants, zero accessibility shortcuts.',
        hashtags: ['#uikit', '#uidesign', '#darkmode', '#designsystem', '#productdesign'],
      },
    },
    media: ['/media/card-variants-01.jpg', '/media/card-variants-02.jpg'],
    createdAt: '2026-03-27T12:30:00Z',
  },
  {
    id: 'post-006',
    title: 'Why Most Agency Websites Fail at Conversion',
    platforms: ['linkedin', 'twitter'],
    scheduledAt: '2026-04-03T09:30:00Z',
    status: 'scheduled',
    contentType: 'knowledge',
    content: {
      linkedin: {
        caption:
          'We audited 50 web agency sites last quarter. The #1 conversion killer wasn\'t design — it was unclear positioning. Most sites try to speak to everyone and convert no one. Here\'s what the top performers did differently.',
        hashtags: ['#conversionoptimization', '#webagency', '#landingpage', '#uxdesign', '#digitalstrategy'],
      },
      twitter: {
        caption:
          'Audited 50 agency websites. The #1 conversion killer: unclear positioning. Not bad design. Not slow load times. Here\'s what the winners had in common 🧵',
        hashtags: ['#cro', '#webdesign', '#agencymarketing'],
      },
    },
    media: [],
    createdAt: '2026-03-28T08:00:00Z',
  },
  {
    id: 'post-007',
    title: 'Client Spotlight — Elevate Coffee Rebrand',
    platforms: ['instagram', 'pinterest', 'gmb'],
    scheduledAt: '2026-04-04T11:00:00Z',
    status: 'draft',
    contentType: 'case-study',
    content: {
      instagram: {
        caption:
          'Elevate Coffee came to us with a brand that no longer reflected who they are. We gave them a visual identity as rich as their roast. Full case study dropping this week.',
        hashtags: ['#coffeebranding', '#rebrand', '#brandidentity', '#packaging', '#agencywork'],
      },
      pinterest: {
        caption: 'Elevate Coffee rebrand — packaging design and brand identity.',
        hashtags: ['#coffeebranding', '#packagingdesign', '#brandidentity'],
      },
      gmb: {
        caption: 'New case study: Elevate Coffee rebrand. View our portfolio for the full project.',
        hashtags: [],
      },
    },
    media: ['/media/elevate-packaging.jpg', '/media/elevate-logo.jpg'],
    createdAt: '2026-03-28T11:45:00Z',
  },
  {
    id: 'post-008',
    title: 'Motion Design Principles for Web',
    platforms: ['linkedin', 'dribbble', 'twitter'],
    scheduledAt: '2026-04-05T10:00:00Z',
    status: 'draft',
    contentType: 'knowledge',
    content: {
      linkedin: {
        caption:
          'Motion on the web isn\'t decoration — it\'s communication. The best interactions use animation to reduce cognitive load, confirm actions, and guide attention. Here are the 4 principles we apply to every project.',
        hashtags: ['#motiondesign', '#ux', '#webanimation', '#interaction', '#frontenddesign'],
      },
      dribbble: {
        caption: 'Motion principles exploration — 4 interaction patterns for modern web UX.',
        hashtags: ['#motiondesign', '#interaction', '#ux', '#animation'],
      },
      twitter: {
        caption:
          'Motion design on the web has 1 job: reduce friction. Here are 4 principles we apply to every client project 👇',
        hashtags: ['#motiondesign', '#ux', '#webdev'],
      },
    },
    media: ['/media/motion-principles.gif'],
    createdAt: '2026-03-28T14:00:00Z',
  },
];

export const analyticsEntries: AnalyticsEntry[] = [
  {
    id: 'analytics-001',
    postId: 'post-hist-001',
    platform: 'instagram',
    publishedAt: '2026-03-01T09:00:00Z',
    metrics: { impressions: 14200, reach: 9800, likes: 742, comments: 89, shares: 134, saves: 310, clicks: 0, engagementRate: 9.94 },
    contentType: 'case-study',
    hashtags: ['#brandidentity', '#rebrand', '#uidesign', '#agencylife'],
  },
  {
    id: 'analytics-002',
    postId: 'post-hist-001',
    platform: 'linkedin',
    publishedAt: '2026-03-01T09:00:00Z',
    metrics: { impressions: 8600, reach: 6200, likes: 312, comments: 47, shares: 88, saves: 0, clicks: 215, engagementRate: 7.63 },
    contentType: 'case-study',
    hashtags: ['#branding', '#caseStudy', '#designStrategy'],
  },
  {
    id: 'analytics-003',
    postId: 'post-hist-002',
    platform: 'linkedin',
    publishedAt: '2026-03-05T11:00:00Z',
    metrics: { impressions: 11400, reach: 8900, likes: 489, comments: 63, shares: 145, saves: 0, clicks: 387, engagementRate: 9.51 },
    contentType: 'knowledge',
    hashtags: ['#ux', '#designsystem', '#accessibility'],
  },
  {
    id: 'analytics-004',
    postId: 'post-hist-002',
    platform: 'twitter',
    publishedAt: '2026-03-05T11:00:00Z',
    metrics: { impressions: 22300, reach: 17800, likes: 1104, comments: 213, shares: 567, saves: 0, clicks: 890, engagementRate: 12.04 },
    contentType: 'knowledge',
    hashtags: ['#a11y', '#designsystem', '#ux'],
  },
  {
    id: 'analytics-005',
    postId: 'post-hist-003',
    platform: 'instagram',
    publishedAt: '2026-03-10T14:00:00Z',
    metrics: { impressions: 9100, reach: 6700, likes: 418, comments: 52, shares: 67, saves: 198, clicks: 0, engagementRate: 8.08 },
    contentType: 'design',
    hashtags: ['#uikit', '#darkmode', '#components'],
  },
  {
    id: 'analytics-006',
    postId: 'post-hist-003',
    platform: 'dribbble',
    publishedAt: '2026-03-10T14:00:00Z',
    metrics: { impressions: 5400, reach: 4100, likes: 610, comments: 38, shares: 22, saves: 0, clicks: 175, engagementRate: 15.74 },
    contentType: 'design',
    hashtags: ['#uikit', '#darkmode', '#saas'],
  },
  {
    id: 'analytics-007',
    postId: 'post-hist-004',
    platform: 'twitter',
    publishedAt: '2026-03-14T09:30:00Z',
    metrics: { impressions: 31500, reach: 24600, likes: 1876, comments: 342, shares: 891, saves: 0, clicks: 1240, engagementRate: 13.81 },
    contentType: 'trend',
    hashtags: ['#webdesign', '#designtrends', '#ux'],
  },
  {
    id: 'analytics-008',
    postId: 'post-hist-004',
    platform: 'linkedin',
    publishedAt: '2026-03-14T09:30:00Z',
    metrics: { impressions: 13700, reach: 10200, likes: 621, comments: 98, shares: 204, saves: 0, clicks: 478, engagementRate: 10.23 },
    contentType: 'trend',
    hashtags: ['#webdesign', '#designtrends', '#ui'],
  },
  {
    id: 'analytics-009',
    postId: 'post-hist-005',
    platform: 'instagram',
    publishedAt: '2026-03-18T08:00:00Z',
    metrics: { impressions: 7800, reach: 5400, likes: 267, comments: 31, shares: 45, saves: 89, clicks: 0, engagementRate: 5.54 },
    contentType: 'promotion',
    hashtags: ['#webagency', '#limitedspots', '#digitalmarketing'],
  },
  {
    id: 'analytics-010',
    postId: 'post-hist-006',
    platform: 'linkedin',
    publishedAt: '2026-03-20T10:00:00Z',
    metrics: { impressions: 9900, reach: 7300, likes: 398, comments: 72, shares: 119, saves: 0, clicks: 334, engagementRate: 9.32 },
    contentType: 'case-study',
    hashtags: ['#coffeebranding', '#rebrand', '#brandidentity'],
  },
  {
    id: 'analytics-011',
    postId: 'post-hist-007',
    platform: 'pinterest',
    publishedAt: '2026-03-24T11:00:00Z',
    metrics: { impressions: 18900, reach: 14200, likes: 934, comments: 12, shares: 410, saves: 1230, clicks: 678, engagementRate: 17.22 },
    contentType: 'design',
    hashtags: ['#uikit', '#darkmode', '#inspiration'],
  },
  {
    id: 'analytics-012',
    postId: 'post-hist-008',
    platform: 'twitter',
    publishedAt: '2026-03-26T09:30:00Z',
    metrics: { impressions: 27400, reach: 21000, likes: 1530, comments: 287, shares: 720, saves: 0, clicks: 1050, engagementRate: 13.09 },
    contentType: 'knowledge',
    hashtags: ['#motiondesign', '#ux', '#webdev'],
  },
];

export const analyticsData: AnalyticsData = {
  posts: analyticsEntries,
  summary: {
    totalPosts: 12,
    avgEngagementRate: 11.01,
    bestPlatform: 'twitter',
    bestContentType: 'knowledge',
    bestPostingTime: '09:30',
    bestDay: 'Thursday',
    topHashtags: ['#ux', '#webdesign', '#brandidentity', '#designtrends', '#uikit', '#darkmode', '#agencylife'],
  },
};

export const scheduleData: ScheduleData = {
  posts: scheduledPosts,
};
