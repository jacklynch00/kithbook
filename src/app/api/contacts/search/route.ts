import { auth } from '@/lib/auth';
import { searchContacts } from '@/lib/services/contact-service';
import { NextRequest, NextResponse } from 'next/server';
import { ContactsApiResponse, SearchParamsSchema } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<ContactsApiResponse>> {
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

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('q');

    // Validate search parameters
    const validation = SearchParamsSchema.safeParse({ q: searchTerm });
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Search term must be between 1 and 100 characters' 
      } satisfies ContactsApiResponse, { status: 400 });
    }

    const contacts = await searchContacts(session.user.id, validation.data.q.trim());

    return NextResponse.json({
      success: true,
      contacts,
    } satisfies ContactsApiResponse);
  } catch (error) {
    console.error('Contact search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search contacts' 
      } satisfies ContactsApiResponse,
      { status: 500 }
    );
  }
}