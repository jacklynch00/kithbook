import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { tasks } from '@trigger.dev/sdk/v3';

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

    const triggers = [];
    const errors = [];

    // Trigger Gmail sync job
    try {
      const gmailHandle = await tasks.trigger("manual-gmail-sync", { userId: session.user.id });
      triggers.push({
        service: 'Gmail',
        jobId: gmailHandle.id,
      });
      console.log(`Gmail sync job triggered: ${gmailHandle.id}`);
    } catch (gmailError) {
      console.error('Failed to trigger Gmail sync:', gmailError);
      errors.push(`Failed to trigger Gmail sync: ${gmailError instanceof Error ? gmailError.message : 'Unknown error'}`);
    }

    // Trigger Calendar sync job  
    try {
      const calendarHandle = await tasks.trigger("manual-calendar-sync", { userId: session.user.id });
      triggers.push({
        service: 'Calendar',
        jobId: calendarHandle.id,
      });
      console.log(`Calendar sync job triggered: ${calendarHandle.id}`);
    } catch (calendarError) {
      console.error('Failed to trigger Calendar sync:', calendarError);
      errors.push(`Failed to trigger Calendar sync: ${calendarError instanceof Error ? calendarError.message : 'Unknown error'}`);
    }

    return NextResponse.json({
      success: true,
      results: {
        triggers,
        errors,
        message: `Triggered ${triggers.length} sync job(s). Jobs are running in the background.`
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