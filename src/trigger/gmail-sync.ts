import { logger, schedules } from "@trigger.dev/sdk/v3";
import { syncGmailForUser } from "@/lib/services/gmail-sync";
import { prisma } from "@/lib/prisma";

export const gmailSyncSchedule = schedules.task({
  id: "gmail-sync",
  // Run every 6 hours
  cron: "0 */6 * * *",
  run: async (payload, { ctx }) => {
    try {
      logger.log("Starting Gmail sync for all users");

      // Validate environment variables early
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        const error = 'Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.';
        logger.error(error);
        throw new Error(error);
      }

      // Get minimal user data to reduce memory footprint
      const usersWithGmailAccess = await prisma.user.findMany({
        where: {
          accounts: {
            some: {
              providerId: 'google',
              scope: {
                contains: 'gmail.readonly'
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

      logger.log(`Found ${usersWithGmailAccess.length} users with Gmail access`);

      let totalEmailsSynced = 0;
      let successfulSyncs = 0;
      let failedSyncs = 0;
      let tokenErrors = 0;

      // Process users one at a time with immediate memory cleanup
      for (let i = 0; i < usersWithGmailAccess.length; i++) {
        // Get only the current user data to minimize memory footprint
        const currentUser = usersWithGmailAccess[i];
        
        logger.log(`Processing Gmail sync ${i + 1}/${usersWithGmailAccess.length} for user ${currentUser.id} (${currentUser.email})`);

        try {
          // Process this user's Gmail sync
          const gmailResult = await syncGmailForUser(currentUser.id);
          totalEmailsSynced += gmailResult.syncedCount;
          successfulSyncs++;

          logger.log(`Gmail sync completed for user ${currentUser.id}: ${gmailResult.syncedCount} emails synced (of ${gmailResult.totalFound} found)`);

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
            logger.warn(`Gmail sync skipped for user ${currentUser.id} due to authentication issue: ${errorMessage}`);
          } else if (errorMessage.includes('GOOGLE_CLIENT_ID') || 
                     errorMessage.includes('GOOGLE_CLIENT_SECRET')) {
            // Configuration error - this will fail for all users, so log and stop
            logger.error(`Gmail sync failed due to missing configuration: ${errorMessage}`);
            throw userError; // Stop the entire job as this affects all users
          } else {
            failedSyncs++;
            logger.error(`Gmail sync failed for user ${currentUser.id}:`, userError as Record<string, unknown>);
          }
        }

        // Explicitly null out user data to help garbage collection
        usersWithGmailAccess[i] = null as any;
        
        // Force garbage collection after each user to immediately free memory
        if (global.gc) {
          global.gc();
        }
        
        // Small delay to ensure memory cleanup completes
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Log final results
      const summary = {
        service: 'Gmail',
        totalUsers: usersWithGmailAccess.length,
        successfulSyncs,
        failedSyncs,
        tokenErrors,
        totalEmailsSynced,
        completedAt: new Date().toISOString(),
      };

      logger.log("Gmail sync completed", summary);

      return summary;

    } catch (error) {
      logger.error("Gmail sync job failed:", error as Record<string, unknown>);
      throw error;
    }
  },
});