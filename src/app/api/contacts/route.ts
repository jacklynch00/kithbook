import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { ContactsApiResponse } from '@/lib/types';

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

    const contacts = await prisma.contact.findMany({
      where: {
        userId: session.user.id,
        archived: false, // Only return non-archived contacts
      },
      orderBy: {
        lastInteractionAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      contacts,
    } satisfies ContactsApiResponse);
  } catch (error) {
    console.error('Get contacts error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load contacts' 
      } satisfies ContactsApiResponse,
      { status: 500 }
    );
  }
}