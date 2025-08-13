import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: 'google',
    },
    select: {
      accessToken: true,
      refreshToken: true,
      accessTokenExpiresAt: true,
    },
  });

  if (!account?.accessToken) {
    console.log('No Google access token found for user:', userId);
    return null;
  }

  // Check if token is expired and refresh if needed
  if (account.accessTokenExpiresAt && account.accessTokenExpiresAt < new Date()) {
    if (account.refreshToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID!,
          process.env.GOOGLE_CLIENT_SECRET!
        );

        oauth2Client.setCredentials({
          refresh_token: account.refreshToken,
        });

        const { credentials } = await oauth2Client.refreshAccessToken();
        
        if (credentials.access_token) {
          // Update the stored tokens
          await prisma.account.updateMany({
            where: {
              userId,
              providerId: 'google',
            },
            data: {
              accessToken: credentials.access_token,
              accessTokenExpiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
            },
          });

          return credentials.access_token;
        }
      } catch (error) {
        console.error('Failed to refresh Google access token:', error);
        return null;
      }
    }
    return null;
  }

  return account.accessToken;
}

export async function fetchContactProfileImage(email: string, accessToken: string): Promise<string | null> {
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const people = google.people({ version: 'v1', auth });

    // Search for the contact by email
    const searchResponse = await people.people.searchContacts({
      query: email,
      readMask: 'photos,emailAddresses',
    });

    const results = searchResponse.data.results;
    if (!results || results.length === 0) {
      return null;
    }

    // Find the contact that matches the email exactly
    for (const result of results) {
      const person = result.person;
      if (!person?.emailAddresses) continue;

      const hasMatchingEmail = person.emailAddresses.some(
        emailAddr => emailAddr.value?.toLowerCase() === email.toLowerCase()
      );

      if (hasMatchingEmail && person.photos && person.photos.length > 0) {
        // Return the first high-quality photo
        const photo = person.photos.find(p => p.metadata?.primary) || person.photos[0];
        return photo.url || null;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching profile image for ${email}:`, error);
    return null;
  }
}

export async function updateContactWithProfileImage(userId: string, email: string): Promise<void> {
  try {
    const accessToken = await getGoogleAccessToken(userId);
    if (!accessToken) {
      console.log('No access token available for profile image fetch');
      return;
    }

    const profileImageUrl = await fetchContactProfileImage(email, accessToken);
    
    if (profileImageUrl) {
      await prisma.contact.updateMany({
        where: {
          userId,
          email: email.toLowerCase(),
        },
        data: {
          profileImageUrl,
        },
      });

      console.log(`Updated profile image for contact: ${email}`);
    }
  } catch (error) {
    console.error(`Failed to update profile image for ${email}:`, error);
  }
}

export async function batchUpdateProfileImages(userId: string, emails: string[]): Promise<void> {
  const accessToken = await getGoogleAccessToken(userId);
  if (!accessToken) {
    console.log('No access token available for batch profile image fetch');
    return;
  }

  for (const email of emails) {
    try {
      await updateContactWithProfileImage(userId, email);
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to update profile image for ${email}:`, error);
    }
  }
}