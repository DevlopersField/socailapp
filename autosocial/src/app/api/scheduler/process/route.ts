import { NextRequest, NextResponse } from 'next/server';
import { processScheduledJobs, updateJobStatus, getConnections } from '@/lib/db';

// Scheduler process endpoint — secured with CRON_SECRET
// Call with: Authorization: Bearer $CRON_SECRET

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    const token = authHeader?.replace('Bearer ', '');
    if (token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [jobs, connections] = await Promise.all([
      processScheduledJobs(),
      getConnections(),
    ]);

    const connectedPlatforms = new Set(
      connections.filter(c => c.status === 'connected').map(c => c.platform)
    );

    const results = await Promise.all(
      jobs.map(async job => {
        await updateJobStatus(job.id, 'processing');

        if (!connectedPlatforms.has(job.platform)) {
          await updateJobStatus(job.id, 'failed', {
            reason: `No active connection for platform: ${job.platform}`,
          });
          return { jobId: job.id, platform: job.platform, status: 'failed', reason: 'no_connection' };
        }

        await updateJobStatus(job.id, 'completed', { published_at: new Date().toISOString() });
        return { jobId: job.id, platform: job.platform, status: 'completed' };
      })
    );

    return NextResponse.json({ processed: results.length, results }, { status: 200 });
  } catch (error) {
    console.error('[POST /api/scheduler/process]', error);
    return NextResponse.json({ error: 'Failed to process scheduled jobs' }, { status: 500 });
  }
}
