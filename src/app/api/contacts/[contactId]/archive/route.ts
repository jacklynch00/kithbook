import { auth } from '@/lib/auth';
import { archiveContact } from '@/lib/services/contact-service';
import { NextRequest, NextResponse } from 'next/server';
import { ContactsApiResponse } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
): Promise<NextResponse<ContactsApiResponse>> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      } satisfies ContactsApiResponse, { status: 401 });
    }

    const resolvedParams = await params;
    const contactId = resolvedParams.contactId;

    if (!contactId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Contact ID is required' 
      } satisfies ContactsApiResponse, { status: 400 });
    }

    const archivedContact = await archiveContact(session.user.id, contactId);

    if (!archivedContact) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to archive contact or contact not found' 
      } satisfies ContactsApiResponse, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      contacts: [archivedContact],
    } satisfies ContactsApiResponse);
  } catch (error) {
    console.error('Archive contact error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to archive contact' 
      } satisfies ContactsApiResponse,
      { status: 500 }
    );
  }
}