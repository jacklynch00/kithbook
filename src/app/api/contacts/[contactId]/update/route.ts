import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateContactSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contactId } = await params;
    const body = await request.json();
    
    // Validate request body
    const validationResult = UpdateContactSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { name, email } = validationResult.data;

    // Check if contact exists and belongs to user
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId: session.user.id,
      },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' }, 
        { status: 404 }
      );
    }

    // If email is being changed, check for duplicates
    if (email && email !== existingContact.email) {
      const emailExists = await prisma.contact.findFirst({
        where: {
          email: email,
          userId: session.user.id,
          id: { not: contactId }, // Exclude current contact
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'A contact with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Update the contact
    const updatedContact = await prisma.contact.update({
      where: {
        id: contactId,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      contact: updatedContact,
    });

  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' }, 
      { status: 500 }
    );
  }
}