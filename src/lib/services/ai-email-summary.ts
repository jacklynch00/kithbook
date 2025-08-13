import { prisma } from '@/lib/prisma';
import { generateCompletion, ChatMessage } from './openai-service';

export interface EmailSummaryResult {
  summary: string;
  keyTopics: string[];
  relationshipInsights: string[];
  totalEmails: number;
  dateRange: {
    earliest: Date;
    latest: Date;
  } | null;
}

const EMAIL_SUMMARY_SYSTEM_PROMPT = `You are an AI assistant specialized in analyzing email communications between business contacts. Your task is to create insightful summaries of email exchanges that help users understand their relationship and communication history with specific contacts.

Instructions:
1. Analyze all provided email content between the user and the contact
2. Create a concise but comprehensive summary of the relationship and communication themes
3. Identify key topics, projects, or subjects discussed
4. Provide insights about the nature of the relationship (professional, collaborative, etc.)
5. Focus on actionable insights and important context
6. Maintain professional tone and respect privacy

Format your response as a JSON object with these fields:
- summary: A 2-3 sentence overview of the relationship and main communication themes
- keyTopics: Array of 3-5 main topics/subjects discussed
- relationshipInsights: Array of 2-3 insights about the working relationship or communication patterns

Keep responses concise but informative. Focus on what would be most useful for the user to remember about this contact.`;

/**
 * Get existing AI summary for a contact from database
 */
export async function getExistingContactSummary(
  userId: string,
  contactEmail: string
): Promise<EmailSummaryResult | null> {
  try {
    const existingSummary = await prisma.contactSummary.findUnique({
      where: {
        userId_contactEmail: {
          userId,
          contactEmail: contactEmail.toLowerCase()
        }
      }
    });

    if (!existingSummary) {
      return null;
    }

    return {
      summary: existingSummary.summary,
      keyTopics: JSON.parse(existingSummary.keyTopics),
      relationshipInsights: JSON.parse(existingSummary.relationshipInsights),
      totalEmails: existingSummary.totalEmails,
      dateRange: existingSummary.earliestEmail && existingSummary.latestEmail ? {
        earliest: existingSummary.earliestEmail,
        latest: existingSummary.latestEmail
      } : null
    };
  } catch (error) {
    console.error('Error fetching existing contact summary:', error);
    return null;
  }
}

/**
 * Save AI summary to database
 */
async function saveContactSummary(
  userId: string,
  contactEmail: string,
  summaryResult: EmailSummaryResult
): Promise<void> {
  try {
    await prisma.contactSummary.upsert({
      where: {
        userId_contactEmail: {
          userId,
          contactEmail: contactEmail.toLowerCase()
        }
      },
      update: {
        summary: summaryResult.summary,
        keyTopics: JSON.stringify(summaryResult.keyTopics),
        relationshipInsights: JSON.stringify(summaryResult.relationshipInsights),
        totalEmails: summaryResult.totalEmails,
        earliestEmail: summaryResult.dateRange?.earliest || null,
        latestEmail: summaryResult.dateRange?.latest || null,
        updatedAt: new Date()
      },
      create: {
        userId,
        contactEmail: contactEmail.toLowerCase(),
        summary: summaryResult.summary,
        keyTopics: JSON.stringify(summaryResult.keyTopics),
        relationshipInsights: JSON.stringify(summaryResult.relationshipInsights),
        totalEmails: summaryResult.totalEmails,
        earliestEmail: summaryResult.dateRange?.earliest || null,
        latestEmail: summaryResult.dateRange?.latest || null
      }
    });
  } catch (error) {
    console.error('Error saving contact summary:', error);
    // Don't throw here - we still want to return the generated summary even if saving fails
  }
}

/**
 * Generate AI summary for a contact based on their email history
 */
export async function generateContactEmailSummary(
  userId: string, 
  contactEmail: string
): Promise<EmailSummaryResult> {
  try {
    // Fetch all emails involving this contact
    const emails = await prisma.email.findMany({
      where: {
        userId,
        OR: [
          { fromEmail: contactEmail },
          { toEmails: { contains: contactEmail } }
        ]
      },
      select: {
        subject: true,
        body: true,
        fromEmail: true,
        receivedAt: true,
      },
      orderBy: {
        receivedAt: 'desc'
      },
      take: 50 // Limit to recent 50 emails to avoid token limits
    });

    if (emails.length === 0) {
      return {
        summary: "No email history found with this contact.",
        keyTopics: [],
        relationshipInsights: [],
        totalEmails: 0,
        dateRange: null
      };
    }

    // Prepare email content for AI analysis
    const emailContent = emails.map((email, index) => {
      const direction = email.fromEmail?.toLowerCase() === contactEmail.toLowerCase() ? 'FROM' : 'TO';
      const subject = email.subject || 'No subject';
      const body = email.body ? email.body.substring(0, 500) : 'No content'; // Limit body length
      const date = email.receivedAt.toLocaleDateString();
      
      return `Email ${index + 1} [${direction} ${contactEmail}] - ${date}
Subject: ${subject}
Content: ${body}
---`;
    }).join('\n\n');

    const userPrompt = `Analyze the following email history with contact "${contactEmail}":

${emailContent}

Total emails: ${emails.length}
Date range: ${emails[emails.length - 1]?.receivedAt.toLocaleDateString()} to ${emails[0]?.receivedAt.toLocaleDateString()}

Please provide a comprehensive analysis of this email relationship.`;

    // Generate AI summary
    const messages: ChatMessage[] = [
      { role: 'system', content: EMAIL_SUMMARY_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ];

    const response = await generateCompletion({
      messages,
      temperature: 0.3, // Lower temperature for consistent analysis
      maxTokens: 800,
      model: 'gpt-4o-mini', // Cost-effective model
      responseFormat: 'json' // Enforce JSON response
    });

    // Parse AI response - OpenAI will return valid JSON
    let aiResult;
    try {
      aiResult = JSON.parse(response.content);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw response content:', response.content);
      
      // Fallback to simple summary if JSON parsing fails
      return {
        summary: "Unable to generate AI summary at this time",
        keyTopics: ['Email communication'],
        relationshipInsights: ['Regular email correspondence'],
        totalEmails: emails.length,
        dateRange: emails.length > 0 ? {
          earliest: emails[emails.length - 1].receivedAt,
          latest: emails[0].receivedAt
        } : null
      };
    }

    const summaryResult: EmailSummaryResult = {
      summary: aiResult.summary || "Unable to generate summary",
      keyTopics: aiResult.keyTopics || [],
      relationshipInsights: aiResult.relationshipInsights || [],
      totalEmails: emails.length,
      dateRange: emails.length > 0 ? {
        earliest: emails[emails.length - 1].receivedAt,
        latest: emails[0].receivedAt
      } : null
    };

    // Save to database
    await saveContactSummary(userId, contactEmail, summaryResult);

    return summaryResult;

  } catch (error) {
    console.error('Error generating email summary:', error);
    throw new Error(`Failed to generate email summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a quick summary of recent emails with a contact
 */
export async function generateQuickEmailSummary(
  userId: string,
  contactEmail: string,
  emailLimit: number = 10
): Promise<string> {
  try {
    const recentEmails = await prisma.email.findMany({
      where: {
        userId,
        OR: [
          { fromEmail: contactEmail },
          { toEmails: { contains: contactEmail } }
        ]
      },
      select: {
        subject: true,
        body: true,
        fromEmail: true,
        receivedAt: true,
      },
      orderBy: {
        receivedAt: 'desc'
      },
      take: emailLimit
    });

    if (recentEmails.length === 0) {
      return "No recent email history with this contact.";
    }

    const emailSummaries = recentEmails.map(email => {
      const direction = email.fromEmail?.toLowerCase() === contactEmail.toLowerCase() ? 'received' : 'sent';
      const subject = email.subject || 'No subject';
      return `${direction}: ${subject}`;
    }).join('; ');

    const systemPrompt = "Summarize this email exchange history in one sentence, focusing on the main communication themes.";
    const userPrompt = `Recent emails with ${contactEmail}: ${emailSummaries}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await generateCompletion({
      messages,
      temperature: 0.3,
      maxTokens: 100,
      model: 'gpt-4o-mini'
    });

    return response.content;

  } catch (error) {
    console.error('Error generating quick email summary:', error);
    return "Unable to generate email summary at this time.";
  }
}