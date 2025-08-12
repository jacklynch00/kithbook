import { logger, task } from "@trigger.dev/sdk/v3";
import { syncCalendarForUser } from "@/lib/services/calendar-sync";

export const manualCalendarSync = task({
  id: "manual-calendar-sync",
  run: async (payload: { userId: string }, { ctx }) => {
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

      return summary;

    } catch (error) {
      logger.error(`Manual Calendar sync failed for user ${payload.userId}:`, error as Record<string, unknown>);
      throw error;
    }
  },
});