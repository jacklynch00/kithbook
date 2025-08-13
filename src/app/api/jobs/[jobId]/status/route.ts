import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { tasks } from '@trigger.dev/sdk/v3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const jobId = resolvedParams.jobId;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Get job status from Trigger.dev
    const job = await tasks.retrieve(jobId);

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        completedAt: job.completedAt,
        failedAt: job.failedAt,
        startedAt: job.startedAt,
        createdAt: job.createdAt,
      }
    });

  } catch (error) {
    console.error('Job status check error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get job status' 
      }, 
      { status: 500 }
    );
  }
}