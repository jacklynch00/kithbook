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

      // Get all users who have Google accounts with Gmail access
      const usersWithGoogleAccounts = await prisma.user.findMany({
        include: {
          accounts: {
            where: {
              providerId: 'google',
              scope: {
                contains: 'gmail.readonly'
              }
            }
          }
        }
      });

      const usersWithGmailAccess = usersWithGoogleAccounts.filter(user => 
        user.accounts.length > 0
      );

      logger.log(`Found ${usersWithGmailAccess.length} users with Gmail access`);

      let totalEmailsSynced = 0;
      let successfulSyncs = 0;
      let failedSyncs = 0;

      // Process each user
      for (const user of usersWithGmailAccess) {
        try {
          logger.log(`Starting Gmail sync for user ${user.id} (${user.email})`);

          const gmailResult = await syncGmailForUser(user.id);
          totalEmailsSynced += gmailResult.syncedCount;
          successfulSyncs++;

          logger.log(`Gmail sync completed for user ${user.id}: ${gmailResult.syncedCount} emails synced (of ${gmailResult.totalFound} found)`);

        } catch (userError) {
          failedSyncs++;
          logger.error(`Gmail sync failed for user ${user.id}:`, userError as Record<string, unknown>);
        }
      }

      // Log final results
      const summary = {
        service: 'Gmail',
        totalUsers: usersWithGmailAccess.length,
        successfulSyncs,
        failedSyncs,
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