import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { createGoogleClient } from './google-client';
import { createOrUpdateContact, extractNameFromEmail } from './contact-service';

export async function syncGmailForUser(userId: string) {
  try {
    console.log(`Starting Gmail sync for user ${userId}`);
    
    // Get existing contacts to sync emails for
    const existingContacts = await prisma.contact.findMany({
      where: { 
        userId,
        archived: false 
      },
      select: { email: true }
    });
    
    const contactEmails = existingContacts.map((contact: {email: string}) => contact.email.toLowerCase());
    console.log(`Found ${contactEmails.length} existing contacts to sync emails for`);
    
    if (contactEmails.length === 0) {
      console.log('No existing contacts found - skipping Gmail sync');
      return { syncedCount: 0, totalFound: 0 };
    }
    
    const auth = await createGoogleClient(userId);
    const gmail = google.gmail({ version: 'v1', auth });

    // Search for emails involving specific contacts
    let allMessages: any[] = [];
    const batchSize = 10; // Process contacts in batches to avoid overly complex queries
    
    for (let i = 0; i < contactEmails.length; i += batchSize) {
      const batch = contactEmails.slice(i, i + batchSize);
      
      // Create search query for this batch of contacts
      const fromQueries = batch.map((email: string) => `from:${email}`).join(' OR ');
      const toQueries = batch.map((email: string) => `to:${email}`).join(' OR ');
      const query = `(${fromQueries}) OR (${toQueries})`;
      
      console.log(`Searching emails for contacts ${i + 1}-${Math.min(i + batchSize, contactEmails.length)} of ${contactEmails.length}`);
      
      // Fetch messages for this batch with pagination
      let pageToken: string | undefined;
      
      do {
        const listResponse = await gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: 500, // Gmail API max
          pageToken,
        });
        
        const messages = listResponse.data.messages || [];
        
        // Avoid duplicates by checking message IDs
        const newMessages = messages.filter((msg: any) => 
          !allMessages.some((existing: any) => existing.id === msg.id)
        );
        
        allMessages.push(...newMessages);
        pageToken = listResponse.data.nextPageToken || undefined;
        
        console.log(`  Fetched ${messages.length} messages (${newMessages.length} new, total: ${allMessages.length})`);
        
        // Safety limit
        if (allMessages.length >= 10000) {
          console.log(`Reached message limit of 10,000 for user ${userId}`);
          pageToken = undefined; // Break out of pagination
          break;
        }
      } while (pageToken);
      
      // Add small delay between batches to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Found ${allMessages.length} total messages for ${contactEmails.length} contacts`);

    let syncedCount = 0;
    
    for (const message of allMessages) {
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

        // Parse recipients
        const recipientEmails: string[] = [];
        if (toHeader) {
          const recipients = toHeader.split(',').map(r => r.trim());
          for (const recipient of recipients) {
            const recipientMatch = recipient.match(/^(.*?)\s*<(.+)>$/) || recipient.match(/^(.+)$/);
            const recipientEmail = recipientMatch?.[2]?.trim() || recipientMatch?.[1]?.trim();
            if (recipientEmail) {
              recipientEmails.push(recipientEmail.toLowerCase());
            }
          }
        }

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

        // Update contact for sender (if they are in our contact list and not user themselves)
        if (fromEmail && fromEmail !== 'me' && contactEmails.includes(fromEmail.toLowerCase())) {
          const senderName = fromName || extractNameFromEmail(fromHeader || '');
          await createOrUpdateContact(userId, fromEmail, senderName, receivedAt);
        }

        // Update contacts for recipients (if they are in our contact list)
        for (const recipientEmail of recipientEmails) {
          if (contactEmails.includes(recipientEmail)) {
            const originalRecipient = toHeader?.split(',').find(r => {
              const match = r.match(/^(.*?)\s*<(.+)>$/) || r.match(/^(.+)$/);
              const email = match?.[2]?.trim() || match?.[1]?.trim();
              return email?.toLowerCase() === recipientEmail;
            });
            
            if (originalRecipient) {
              const recipientMatch = originalRecipient.match(/^(.*?)\s*<(.+)>$/) || originalRecipient.match(/^(.+)$/);
              const recipientName = recipientMatch?.[1]?.trim().replace(/^"(.*)"$/, '$1') || null;
              await createOrUpdateContact(userId, recipientEmail, recipientName, receivedAt);
            }
          }
        }

        syncedCount++;
      } catch (messageError) {
        console.error(`Failed to sync message ${message.id} for user ${userId}:`, messageError);
      }
    }

    console.log(`Gmail sync completed for user ${userId}. Synced ${syncedCount} new emails.`);
    return { syncedCount, totalFound: allMessages.length };
    
  } catch (error) {
    console.error(`Gmail sync failed for user ${userId}:`, error);
    throw error;
  }
}