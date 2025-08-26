import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

export async function createGoogleClient(userId: string) {
  // Validate environment variables first
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID environment variable is not set');
  }
  
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_SECRET environment variable is not set');
  }

  // Get the user's Google account with tokens
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: 'google',
    },
  });

  if (!account) {
    throw new Error(`No Google account found for user ${userId}`);
  }

  // Check if tokens were cleared due to previous auth failures
  if (!account.accessToken || !account.refreshToken) {
    throw new Error(`Google account tokens are invalid for user ${userId}. User needs to re-authenticate.`);
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
      
      // Mark account as having invalid tokens
      await prisma.account.update({
        where: { id: account.id },
        data: {
          // Clear tokens to indicate they're invalid
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAt: null,
        },
      });

      throw new Error(`Failed to refresh Google token for user ${userId}. User needs to re-authenticate.`);
    }
  }

  return oauth2Client;
}