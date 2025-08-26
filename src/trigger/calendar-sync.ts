import { logger, schedules } from "@trigger.dev/sdk/v3";
import { syncCalendarForUser } from "@/lib/services/calendar-sync";
import { prisma } from "@/lib/prisma";

export const calendarSyncSchedule = schedules.task({
  id: "calendar-sync",
  // Run every 6 hours (offset by 30 minutes from Gmail sync)
  cron: "30 */6 * * *",
  run: async (payload, { ctx }) => {
    try {
      logger.log("Starting Calendar sync for all users");

      // Validate environment variables early
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        const error = 'Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.';
        logger.error(error);
        throw new Error(error);
      }

      // Get minimal user data to reduce memory footprint
      const usersWithCalendarAccess = await prisma.user.findMany({
        where: {
          accounts: {
            some: {
              providerId: 'google',
              scope: {
                contains: 'calendar.readonly'
              },
              // Only include accounts with valid tokens
              accessToken: {
                not: null
              },
              refreshToken: {
                not: null
              }
            }
          }
        },
        select: {
          id: true,
          email: true,
          // Don't include accounts or other data here to save memory
        }
      });

      logger.log(`Found ${usersWithCalendarAccess.length} users with Calendar access`);

      let totalEventsSynced = 0;
      let successfulSyncs = 0;
      let failedSyncs = 0;
      let tokenErrors = 0;

      // Process users one at a time with immediate memory cleanup
      for (let i = 0; i < usersWithCalendarAccess.length; i++) {
        // Get only the current user data to minimize memory footprint
        const currentUser = usersWithCalendarAccess[i];
        
        logger.log(`Processing Calendar sync ${i + 1}/${usersWithCalendarAccess.length} for user ${currentUser.id} (${currentUser.email})`);

        try {
          // Process this user's Calendar sync
          const calendarResult = await syncCalendarForUser(currentUser.id);
          totalEventsSynced += calendarResult.syncedCount;
          successfulSyncs++;

          logger.log(`Calendar sync completed for user ${currentUser.id}: ${calendarResult.syncedCount} events synced (of ${calendarResult.totalFound} found)`);

        } catch (userError) {
          const errorMessage = userError instanceof Error ? userError.message : String(userError);
          
          // Check if this is a token or credentials error
          if (errorMessage.includes('Failed to refresh Google token') || 
              errorMessage.includes('needs to re-authenticate') ||
              errorMessage.includes('invalid_request') ||
              errorMessage.includes('Could not determine client ID') ||
              errorMessage.includes('tokens are invalid') ||
              errorMessage.includes('No Google account found')) {
            tokenErrors++;
            logger.warn(`Calendar sync skipped for user ${currentUser.id} due to authentication issue: ${errorMessage}`);
          } else if (errorMessage.includes('GOOGLE_CLIENT_ID') || 
                     errorMessage.includes('GOOGLE_CLIENT_SECRET')) {
            // Configuration error - this will fail for all users, so log and stop
            logger.error(`Calendar sync failed due to missing configuration: ${errorMessage}`);
            throw userError; // Stop the entire job as this affects all users
          } else {
            failedSyncs++;
            logger.error(`Calendar sync failed for user ${currentUser.id}:`, userError as Record<string, unknown>);
          }
        }

        // Explicitly null out user data to help garbage collection
        usersWithCalendarAccess[i] = null as any;
        
        // Force garbage collection after each user to immediately free memory
        if (global.gc) {
          global.gc();
        }
        
        // Small delay to ensure memory cleanup completes
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Log final results
      const summary = {
        service: 'Calendar',
        totalUsers: usersWithCalendarAccess.length,
        successfulSyncs,
        failedSyncs,
        tokenErrors,
        totalEventsSynced,
        completedAt: new Date().toISOString(),
      };

      logger.log("Calendar sync completed", summary);

      return summary;

    } catch (error) {
      logger.error("Calendar sync job failed:", error as Record<string, unknown>);
      throw error;
    }
  },
});