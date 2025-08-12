import { auth } from '@/lib/auth';
import { recalculateAllInteractionCounts } from '@/lib/services/contact-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    await recalculateAllInteractionCounts(session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Interaction counts recalculated successfully'
    });
  } catch (error) {
    console.error('Recalculation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to recalculate interaction counts' 
      },
      { status: 500 }
    );
  }
}