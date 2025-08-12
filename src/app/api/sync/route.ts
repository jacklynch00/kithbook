import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { syncGmailForUser } from '@/lib/services/gmail-sync';
import { syncCalendarForUser } from '@/lib/services/calendar-sync';

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

    const results = {
      gmail: null as any,
      calendar: null as any,
      errors: [] as string[],
    };

    // Try Gmail sync
    try {
      results.gmail = await syncGmailForUser(session.user.id);
      console.log(`Gmail sync completed: ${results.gmail.syncedCount} emails`);
    } catch (gmailError) {
      console.error('Gmail sync failed:', gmailError);
      results.errors.push(`Gmail sync failed: ${gmailError instanceof Error ? gmailError.message : 'Unknown error'}`);
    }

    // Try Calendar sync
    try {
      results.calendar = await syncCalendarForUser(session.user.id);
      console.log(`Calendar sync completed: ${results.calendar.syncedCount} events`);
    } catch (calendarError) {
      console.error('Calendar sync failed:', calendarError);
      results.errors.push(`Calendar sync failed: ${calendarError instanceof Error ? calendarError.message : 'Unknown error'}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      results,
    });

  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { 
        error: 'Sync failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}