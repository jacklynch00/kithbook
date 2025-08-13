import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get the current user's session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's last sync time
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastSyncAt: true }
    });

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const canSync = !user?.lastSyncAt || user.lastSyncAt <= oneHourAgo;
    
    let minutesUntilNext = null;
    if (!canSync && user?.lastSyncAt) {
      const nextAllowedSync = new Date(user.lastSyncAt.getTime() + 60 * 60 * 1000);
      minutesUntilNext = Math.ceil((nextAllowedSync.getTime() - now.getTime()) / (1000 * 60));
    }

    return NextResponse.json({
      canSync,
      minutesUntilNext,
      lastSyncAt: user?.lastSyncAt?.toISOString() || null,
    });

  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get sync status' 
      }, 
      { status: 500 }
    );
  }
}