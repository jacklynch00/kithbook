import { auth } from '@/lib/auth';
import { getContactTimeline } from '@/lib/services/contact-service';
import { NextRequest, NextResponse } from 'next/server';
import { TimelineApiResponse } from '@/lib/types';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
): Promise<NextResponse<TimelineApiResponse>> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      } satisfies TimelineApiResponse, { status: 401 });
    }

    const resolvedParams = await params;
    const contactEmail = decodeURIComponent(resolvedParams.contactId);

    // Validate email parameter
    const emailValidation = z.string().email().safeParse(contactEmail);
    if (!emailValidation.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid contact email is required' 
      } satisfies TimelineApiResponse, { status: 400 });
    }

    const timeline = await getContactTimeline(session.user.id, emailValidation.data);

    return NextResponse.json({
      success: true,
      timeline,
    } satisfies TimelineApiResponse);
  } catch (error) {
    console.error('Contact timeline error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load contact timeline' 
      } satisfies TimelineApiResponse,
      { status: 500 }
    );
  }
}