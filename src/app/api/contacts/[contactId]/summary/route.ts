import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateContactEmailSummary, getExistingContactSummary } from '@/lib/services/ai-email-summary';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
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

    const resolvedParams = await params;
    const contactEmail = decodeURIComponent(resolvedParams.contactId);

    // Validate email parameter
    const emailValidation = z.string().email().safeParse(contactEmail);
    if (!emailValidation.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid contact email is required' 
      }, { status: 400 });
    }

    // Get existing summary
    const existingSummary = await getExistingContactSummary(
      session.user.id, 
      emailValidation.data
    );

    return NextResponse.json({
      success: true,
      summary: existingSummary,
      exists: !!existingSummary
    });

  } catch (error) {
    console.error('Contact summary fetch error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch contact summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
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

    const resolvedParams = await params;
    const contactEmail = decodeURIComponent(resolvedParams.contactId);

    // Validate email parameter
    const emailValidation = z.string().email().safeParse(contactEmail);
    if (!emailValidation.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid contact email is required' 
      }, { status: 400 });
    }

    console.log(`Generating AI summary for contact: ${contactEmail}`);

    // Generate the AI summary
    const summaryResult = await generateContactEmailSummary(
      session.user.id, 
      emailValidation.data
    );

    return NextResponse.json({
      success: true,
      summary: summaryResult,
    });

  } catch (error) {
    console.error('Contact summary generation error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('OpenAI API failed')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'AI service temporarily unavailable',
            details: 'Please try again in a moment'
          }, 
          { status: 503 }
        );
      }
      
      if (error.message.includes('OPENAI_API_KEY')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'AI service not configured',
            details: 'Contact administrator'
          }, 
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate contact summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}