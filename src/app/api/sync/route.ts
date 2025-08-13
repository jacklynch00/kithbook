import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { tasks } from '@trigger.dev/sdk/v3';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get the current user's session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Manual sync requested for user ${session.user.id}`);

    // Check rate limiting - only allow sync once per hour
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastSyncAt: true }
    });

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    if (user?.lastSyncAt && user.lastSyncAt > oneHourAgo) {
      const nextAllowedSync = new Date(user.lastSyncAt.getTime() + 60 * 60 * 1000);
      const minutesUntilNext = Math.ceil((nextAllowedSync.getTime() - now.getTime()) / (1000 * 60));
      
      return NextResponse.json({
        success: false,
        error: 'Rate limited',
        details: `You can sync again in ${minutesUntilNext} minute(s). Last sync was at ${user.lastSyncAt.toLocaleTimeString()}.`,
        nextAllowedAt: nextAllowedSync.toISOString()
      }, { status: 429 });
    }

    // Update lastSyncAt timestamp
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastSyncAt: now }
    });

    const triggers = [];
    const errors = [];

    // Step 1: Trigger Calendar sync job first (to create contacts from meeting attendees)
    try {
      const calendarHandle = await tasks.trigger("manual-calendar-sync", { 
        userId: session.user.id,
        triggerGmailAfter: true // Flag to trigger Gmail sync after completion
      });
      triggers.push({
        service: 'Calendar',
        jobId: calendarHandle.id,
      });
      console.log(`Calendar sync job triggered: ${calendarHandle.id} (Gmail will follow)`);
    } catch (calendarError) {
      console.error('Failed to trigger Calendar sync:', calendarError);
      errors.push(`Failed to trigger Calendar sync: ${calendarError instanceof Error ? calendarError.message : 'Unknown error'}`);
    }

    // Note: Gmail sync will be triggered automatically by the calendar sync job when it completes

    return NextResponse.json({
      success: true,
      results: {
        triggers,
        errors,
        message: triggers.length > 0 
          ? `Started sequential sync: Calendar first, then Gmail. Jobs are running in the background.`
          : `No sync jobs were triggered due to errors.`
      },
    });

  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Sync failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}