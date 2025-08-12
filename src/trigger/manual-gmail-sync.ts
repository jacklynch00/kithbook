import { logger, task } from "@trigger.dev/sdk/v3";
import { syncGmailForUser } from "@/lib/services/gmail-sync";

export const manualGmailSync = task({
  id: "manual-gmail-sync",
  run: async (payload: { userId: string }, { ctx }) => {
    try {
      logger.log(`Starting manual Gmail sync for user ${payload.userId}`);

      const gmailResult = await syncGmailForUser(payload.userId);

      const summary = {
        service: 'Gmail',
        userId: payload.userId,
        syncedCount: gmailResult.syncedCount,
        totalFound: gmailResult.totalFound,
        completedAt: new Date().toISOString(),
      };

      logger.log(`Manual Gmail sync completed for user ${payload.userId}:`, summary);

      return summary;

    } catch (error) {
      logger.error(`Manual Gmail sync failed for user ${payload.userId}:`, error as Record<string, unknown>);
      throw error;
    }
  },
});