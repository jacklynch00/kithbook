import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { createGoogleClient } from './google-client';
import { createOrUpdateContact } from './contact-service';

export async function syncCalendarForUser(userId: string) {
  try {
    console.log(`Starting Calendar sync for user ${userId}`);
    
    const auth = await createGoogleClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    // Calculate date range (30 days ago to 30 days in future)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Get events from primary calendar
    const eventsResponse = await calendar.events.list({
      calendarId: 'primary',
      timeMin: thirtyDaysAgo.toISOString(),
      timeMax: thirtyDaysFromNow.toISOString(),
      maxResults: 250, // Adjust as needed
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = eventsResponse.data.items || [];
    console.log(`Found ${events.length} calendar events for user ${userId}`);

    let syncedCount = 0;
    
    for (const event of events) {
      if (!event.id) continue;

      // Check if we already have this event
      const existingEvent = await prisma.calendarEvent.findUnique({
        where: { googleId: event.id },
      });

      if (existingEvent) {
        // Update existing event in case it changed
        try {
          const startTime = event.start?.dateTime ? 
            new Date(event.start.dateTime) : 
            new Date(event.start?.date + 'T00:00:00');
          
          const endTime = event.end?.dateTime ? 
            new Date(event.end.dateTime) : 
            new Date(event.end?.date + 'T23:59:59');

          await prisma.calendarEvent.update({
            where: { googleId: event.id },
            data: {
              title: event.summary || null,
              description: event.description || null,
              location: event.location || null,
              startTime,
              endTime,
              isAllDay: !event.start?.dateTime, // All-day if no specific time
              status: event.status || null,
              attendees: event.attendees ? JSON.stringify(
                event.attendees.map(a => ({
                  email: a.email,
                  displayName: a.displayName,
                  responseStatus: a.responseStatus,
                }))
              ) : null,
              organizer: event.organizer?.email || null,
            },
          });

          // Extract contacts from updated event
          // Create/update contact from organizer
          if (event.organizer?.email) {
            await createOrUpdateContact(
              userId, 
              event.organizer.email, 
              event.organizer.displayName || null, 
              startTime
            );
          }

          // Create/update contacts from attendees
          if (event.attendees) {
            for (const attendee of event.attendees) {
              if (attendee.email) {
                await createOrUpdateContact(
                  userId, 
                  attendee.email, 
                  attendee.displayName || null, 
                  startTime
                );
              }
            }
          }
        } catch (updateError) {
          console.error(`Failed to update event ${event.id} for user ${userId}:`, updateError);
        }
        continue;
      }

      try {
        // Parse start and end times
        const startTime = event.start?.dateTime ? 
          new Date(event.start.dateTime) : 
          new Date(event.start?.date + 'T00:00:00');
        
        const endTime = event.end?.dateTime ? 
          new Date(event.end.dateTime) : 
          new Date(event.end?.date + 'T23:59:59');

        // Create calendar event record
        await prisma.calendarEvent.create({
          data: {
            googleId: event.id,
            title: event.summary || null,
            description: event.description || null,
            location: event.location || null,
            startTime,
            endTime,
            isAllDay: !event.start?.dateTime, // All-day if no specific time
            status: event.status || null,
            attendees: event.attendees ? JSON.stringify(
              event.attendees.map(a => ({
                email: a.email,
                displayName: a.displayName,
                responseStatus: a.responseStatus,
              }))
            ) : null,
            organizer: event.organizer?.email || null,
            userId,
          },
        });

        // Extract contacts from new event
        // Create/update contact from organizer
        if (event.organizer?.email) {
          await createOrUpdateContact(
            userId, 
            event.organizer.email, 
            event.organizer.displayName || null, 
            startTime
          );
        }

        // Create/update contacts from attendees
        if (event.attendees) {
          for (const attendee of event.attendees) {
            if (attendee.email) {
              await createOrUpdateContact(
                userId, 
                attendee.email, 
                attendee.displayName || null, 
                startTime
              );
            }
          }
        }

        syncedCount++;
      } catch (eventError) {
        console.error(`Failed to sync event ${event.id} for user ${userId}:`, eventError);
      }
    }

    console.log(`Calendar sync completed for user ${userId}. Synced ${syncedCount} new events.`);
    return { syncedCount, totalFound: events.length };
    
  } catch (error) {
    console.error(`Calendar sync failed for user ${userId}:`, error);
    throw error;
  }
}