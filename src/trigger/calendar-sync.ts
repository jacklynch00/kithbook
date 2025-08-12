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

      // Get all users who have Google accounts with Calendar access
      const usersWithGoogleAccounts = await prisma.user.findMany({
        include: {
          accounts: {
            where: {
              providerId: 'google',
              scope: {
                contains: 'calendar.readonly'
              }
            }
          }
        }
      });

      const usersWithCalendarAccess = usersWithGoogleAccounts.filter(user => 
        user.accounts.length > 0
      );

      logger.log(`Found ${usersWithCalendarAccess.length} users with Calendar access`);

      let totalEventsSynced = 0;
      let successfulSyncs = 0;
      let failedSyncs = 0;

      // Process each user
      for (const user of usersWithCalendarAccess) {
        try {
          logger.log(`Starting Calendar sync for user ${user.id} (${user.email})`);

          const calendarResult = await syncCalendarForUser(user.id);
          totalEventsSynced += calendarResult.syncedCount;
          successfulSyncs++;

          logger.log(`Calendar sync completed for user ${user.id}: ${calendarResult.syncedCount} events synced (of ${calendarResult.totalFound} found)`);

        } catch (userError) {
          failedSyncs++;
          logger.error(`Calendar sync failed for user ${user.id}:`, userError as Record<string, unknown>);
        }
      }

      // Log final results
      const summary = {
        service: 'Calendar',
        totalUsers: usersWithCalendarAccess.length,
        successfulSyncs,
        failedSyncs,
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