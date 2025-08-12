import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

export async function createGoogleClient(userId: string) {
  // Get the user's Google account with tokens
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: 'google',
    },
  });

  if (!account || !account.accessToken) {
    throw new Error(`No Google account found for user ${userId}`);
  }

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  // Set credentials
  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
  });

  // Check if token needs refresh
  if (account.accessTokenExpiresAt && new Date() > account.accessTokenExpiresAt) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update tokens in database
      await prisma.account.update({
        where: { id: account.id },
        data: {
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token || account.refreshToken,
          accessTokenExpiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        },
      });

      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error('Failed to refresh token for user', userId, error);
      throw new Error(`Failed to refresh Google token for user ${userId}`);
    }
  }

  return oauth2Client;
}