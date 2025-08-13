import { logger, task, tasks } from "@trigger.dev/sdk/v3";
import { syncCalendarForUser } from "@/lib/services/calendar-sync";

export const manualCalendarSync = task({
  id: "manual-calendar-sync",
  run: async (payload: { userId: string; triggerGmailAfter?: boolean }, { ctx }) => {
    try {
      logger.log(`Starting manual Calendar sync for user ${payload.userId}`);

      const calendarResult = await syncCalendarForUser(payload.userId);

      const summary = {
        service: 'Calendar',
        userId: payload.userId,
        syncedCount: calendarResult.syncedCount,
        totalFound: calendarResult.totalFound,
        completedAt: new Date().toISOString(),
      };

      logger.log(`Manual Calendar sync completed for user ${payload.userId}:`, summary);

      // Trigger Gmail sync if requested
      if (payload.triggerGmailAfter) {
        try {
          logger.log(`Triggering Gmail sync for user ${payload.userId} after calendar completion`);
          const gmailHandle = await tasks.trigger("manual-gmail-sync", { userId: payload.userId });
          logger.log(`Gmail sync triggered: ${gmailHandle.id}`);
          
          // Include Gmail job ID in response
          return {
            ...summary,
            gmailJobId: gmailHandle.id,
            triggeredGmailSync: true
          };
        } catch (gmailError) {
          logger.error(`Failed to trigger Gmail sync after calendar completion:`, gmailError as Record<string, unknown>);
          // Return calendar success even if Gmail trigger fails
          return {
            ...summary,
            triggeredGmailSync: false,
            gmailTriggerError: gmailError instanceof Error ? gmailError.message : 'Unknown error'
          };
        }
      }

      return summary;

    } catch (error) {
      logger.error(`Manual Calendar sync failed for user ${payload.userId}:`, error as Record<string, unknown>);
      throw error;
    }
  },
});