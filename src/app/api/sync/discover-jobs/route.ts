import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's last sync time to help identify recent jobs
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastSyncAt: true }
    });

    if (!user?.lastSyncAt) {
      return NextResponse.json({
        success: true,
        recentJobs: [],
        message: 'No recent sync found'
      });
    }

    // For now, return basic info about the expected job sequence
    // In a full implementation, you might query Trigger.dev's API for recent jobs
    const timeSinceSync = Date.now() - user.lastSyncAt.getTime();
    const isRecentSync = timeSinceSync < 10 * 60 * 1000; // Within 10 minutes

    return NextResponse.json({
      success: true,
      recentJobs: [],
      lastSyncAt: user.lastSyncAt.toISOString(),
      isRecentSync,
      expectedSequence: ['calendar', 'gmail'],
      message: isRecentSync 
        ? 'Recent sync detected - sequential jobs may still be running'
        : 'No recent sync activity'
    });

  } catch (error) {
    console.error('Job discovery error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to discover jobs' 
      }, 
      { status: 500 }
    );
  }
}