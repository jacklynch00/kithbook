import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { createGoogleClient } from './google-client';
import { createOrUpdateContact, extractNameFromEmail } from './contact-service';

export async function syncGmailForUser(userId: string) {
  try {
    console.log(`Starting Gmail sync for user ${userId}`);
    
    const auth = await createGoogleClient(userId);
    const gmail = google.gmail({ version: 'v1', auth });

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const query = `after:${Math.floor(thirtyDaysAgo.getTime() / 1000)}`;

    // Get list of messages from past 30 days
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100, // Adjust as needed
    });

    const messages = listResponse.data.messages || [];
    console.log(`Found ${messages.length} messages for user ${userId}`);

    let syncedCount = 0;
    
    for (const message of messages) {
      if (!message.id) continue;

      // Check if we already have this email
      const existingEmail = await prisma.email.findUnique({
        where: { googleId: message.id },
      });

      if (existingEmail) {
        continue; // Skip if already synced
      }

      try {
        // Get full message details
        const messageResponse = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full',
        });

        const messageData = messageResponse.data;
        const headers = messageData.payload?.headers || [];
        
        // Extract email data
        const subject = headers.find(h => h.name === 'Subject')?.value;
        const fromHeader = headers.find(h => h.name === 'From')?.value;
        const toHeader = headers.find(h => h.name === 'To')?.value;
        const dateHeader = headers.find(h => h.name === 'Date')?.value;

        // Parse from header (e.g., "John Doe <john@example.com>")
        const fromMatch = fromHeader?.match(/^(.*?)\s*<(.+)>$/) || fromHeader?.match(/^(.+)$/);
        const fromName = fromMatch?.[1]?.trim().replace(/^"(.*)"$/, '$1') || null;
        const fromEmail = fromMatch?.[2]?.trim() || fromMatch?.[1]?.trim() || null;

        // Get email body/snippet
        let body = messageData.snippet || '';
        
        // Try to get full body from payload
        if (messageData.payload?.body?.data) {
          body = Buffer.from(messageData.payload.body.data, 'base64').toString('utf-8');
        } else if (messageData.payload?.parts) {
          // Look for text/plain part
          const textPart = messageData.payload.parts.find(part => 
            part.mimeType === 'text/plain' && part.body?.data
          );
          if (textPart?.body?.data) {
            body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
          }
        }

        // Parse date
        const receivedAt = dateHeader ? new Date(dateHeader) : new Date();

        // Create email record
        await prisma.email.create({
          data: {
            googleId: message.id,
            threadId: messageData.threadId,
            subject: subject || null,
            fromEmail: fromEmail,
            fromName: fromName,
            toEmails: toHeader ? JSON.stringify([toHeader]) : null,
            body: body.substring(0, 10000), // Limit body length
            isRead: !messageData.labelIds?.includes('UNREAD'),
            isImportant: messageData.labelIds?.includes('IMPORTANT') || false,
            labels: messageData.labelIds ? JSON.stringify(messageData.labelIds) : null,
            receivedAt,
            userId,
          },
        });

        // Create/update contact from sender
        if (fromEmail && fromEmail !== 'me') {
          const senderName = fromName || extractNameFromEmail(fromHeader || '');
          await createOrUpdateContact(userId, fromEmail, senderName, receivedAt);
        }

        // Create/update contacts from recipients (To header)
        if (toHeader) {
          const recipients = toHeader.split(',').map(r => r.trim());
          for (const recipient of recipients) {
            const recipientMatch = recipient.match(/^(.*?)\s*<(.+)>$/) || recipient.match(/^(.+)$/);
            const recipientName = recipientMatch?.[1]?.trim().replace(/^"(.*)"$/, '$1') || null;
            const recipientEmail = recipientMatch?.[2]?.trim() || recipientMatch?.[1]?.trim();
            
            if (recipientEmail && recipientEmail !== 'me') {
              const name = recipientName || extractNameFromEmail(recipient);
              await createOrUpdateContact(userId, recipientEmail, name, receivedAt);
            }
          }
        }

        syncedCount++;
      } catch (messageError) {
        console.error(`Failed to sync message ${message.id} for user ${userId}:`, messageError);
      }
    }

    console.log(`Gmail sync completed for user ${userId}. Synced ${syncedCount} new emails.`);
    return { syncedCount, totalFound: messages.length };
    
  } catch (error) {
    console.error(`Gmail sync failed for user ${userId}:`, error);
    throw error;
  }
}