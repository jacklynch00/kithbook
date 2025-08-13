import { prisma } from '@/lib/prisma';
import type { Contact } from '@prisma/client';
import { TimelineItem } from '@/lib/types';

// Patterns to identify automated/newsletter emails
const AUTOMATED_EMAIL_PATTERNS = [
	/noreply@/i,
	/no-reply@/i,
	/donotreply@/i,
	/do-not-reply@/i,
	/newsletter@/i,
	/notifications@/i,
	/support@/i,
	/automated@/i,
	/robot@/i,
	/daemon@/i,
	/mailer@/i,
	/bounce@/i,
	/postmaster@/i,
	/info@/i,
	/help@/i,
	/hi@/i,
	/hello@/i,
	/invoice@/i,
	/updates@/i,
	/mail@/i,
];

const AUTOMATED_DOMAINS = ['mail.google.com', 'calendar-notification@google.com', 'email.apple.com', 'bounce.email'];

export function isAutomatedEmail(email: string, name?: string): boolean {
	if (!email) return true;

	// Check against automated patterns
	if (AUTOMATED_EMAIL_PATTERNS.some((pattern) => pattern.test(email))) {
		return true;
	}

	// Check against automated domains
	if (AUTOMATED_DOMAINS.some((domain) => email.includes(domain))) {
		return true;
	}

	// If no name provided and email looks automated
	if (!name && (email.includes('notifications') || email.includes('automated') || email.includes('system'))) {
		return true;
	}

	return false;
}

export function extractNameFromEmail(email: string): string | null {
	// Extract name from email like "John Doe <john@example.com>"
	const match = email.match(/^"?([^"<]+)"?\s*</);
	if (match) {
		return match[1].trim().replace(/^"(.*)"$/, '$1');
	}
	return null;
}

export function getBestName(existingName: string | null, newName: string | null): string | null {
	if (!existingName) return newName;
	if (!newName) return existingName;

	// Prefer the longer, more complete name
	if (newName.length > existingName.length) {
		return newName;
	}

	return existingName;
}

export async function createOrUpdateContact(userId: string, email: string, name: string | null, interactionDate: Date): Promise<Contact | null> {
	// Skip if automated email
	if (isAutomatedEmail(email, name || undefined)) {
		return null;
	}

	// Clean up email
	const cleanEmail = email.toLowerCase().trim();

	// Skip if this is the user's own email
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { email: true },
	});

	if (user && user.email.toLowerCase() === cleanEmail) {
		console.log(`Skipping user's own email: ${cleanEmail}`);
		return null;
	}

	try {
		// Try to find existing contact
		const existingContact = await prisma.contact.findUnique({
			where: {
				userId_email: {
					userId,
					email: cleanEmail,
				},
			},
		});

		if (existingContact) {
			// Skip if contact is archived
			if (existingContact.archived) {
				console.log(`Skipping archived contact: ${cleanEmail}`);
				return null;
			}

			// Calculate actual interaction count from database
			const [emailCount, calendarCount] = await Promise.all([
				prisma.email.count({
					where: {
						userId,
						OR: [{ fromEmail: cleanEmail }, { toEmails: { contains: cleanEmail } }],
					},
				}),
				prisma.calendarEvent.count({
					where: {
						userId,
						OR: [{ organizer: cleanEmail }, { attendees: { contains: cleanEmail } }],
					},
				}),
			]);

			const actualInteractionCount = emailCount + calendarCount;

			// Update existing contact with accurate count
			const updatedContact = await prisma.contact.update({
				where: { id: existingContact.id },
				data: {
					name: getBestName(existingContact.name, name),
					lastInteractionAt: interactionDate > existingContact.lastInteractionAt ? interactionDate : existingContact.lastInteractionAt,
					interactionCount: actualInteractionCount,
				},
			});

			return updatedContact;
		} else {
			// For new contacts, start with count of 1 (will be corrected on next update)
			const newContact = await prisma.contact.create({
				data: {
					userId,
					email: cleanEmail,
					name,
					lastInteractionAt: interactionDate,
					interactionCount: 1,
				},
			});

			return newContact;
		}
	} catch (error) {
		console.error('Error creating/updating contact:', error);
		return null;
	}
}

export async function searchContacts(userId: string, searchTerm: string): Promise<Contact[]> {
	const contacts = await prisma.contact.findMany({
		where: {
			userId,
			archived: false, // Only show non-archived contacts
			OR: [
				{
					name: {
						contains: searchTerm,
						mode: 'insensitive',
					},
				},
				{
					email: {
						contains: searchTerm,
						mode: 'insensitive',
					},
				},
			],
		},
		orderBy: {
			lastInteractionAt: 'desc',
		},
		take: 20, // Limit results
	});

	return contacts;
}

export async function archiveContact(userId: string, contactId: string): Promise<Contact | null> {
	try {
		const archivedContact = await prisma.contact.update({
			where: {
				id: contactId,
				userId, // Ensure user owns this contact
			},
			data: {
				archived: true,
				archivedAt: new Date(),
			},
		});

		return archivedContact;
	} catch (error) {
		console.error('Error archiving contact:', error);
		return null;
	}
}

export async function unarchiveContact(userId: string, contactId: string): Promise<Contact | null> {
	try {
		const unarchivedContact = await prisma.contact.update({
			where: {
				id: contactId,
				userId, // Ensure user owns this contact
			},
			data: {
				archived: false,
				archivedAt: null,
			},
		});

		return unarchivedContact;
	} catch (error) {
		console.error('Error unarchiving contact:', error);
		return null;
	}
}

export async function getContactTimeline(userId: string, contactEmail: string): Promise<TimelineItem[]> {
	// Get all emails and calendar events for this contact
	const [emails, calendarEvents] = await Promise.all([
		prisma.email.findMany({
			where: {
				userId,
				OR: [{ fromEmail: contactEmail }, { toEmails: { contains: contactEmail } }],
			},
			orderBy: { receivedAt: 'desc' },
		}),
		prisma.calendarEvent.findMany({
			where: {
				userId,
				OR: [{ organizer: contactEmail }, { attendees: { contains: contactEmail } }],
			},
			orderBy: { startTime: 'desc' },
		}),
	]);

	// Combine and sort by date
	const timeline = [
		...emails.map((email) => ({
			id: email.id,
			type: 'email' as const,
			date: email.receivedAt,
			title: email.subject || 'No Subject',
			details: {
				from: email.fromEmail,
				fromName: email.fromName,
				body: email.body?.substring(0, 200) + (email.body && email.body.length > 200 ? '...' : ''),
				isRead: email.isRead,
			},
		})),
		...calendarEvents.map((event) => ({
			id: event.id,
			type: 'calendar' as const,
			date: event.startTime,
			title: event.title || 'No Title',
			details: {
				startTime: event.startTime,
				endTime: event.endTime,
				location: event.location,
				description: event.description?.substring(0, 200) + (event.description && event.description.length > 200 ? '...' : ''),
				status: event.status,
				organizer: event.organizer,
			},
		})),
	].sort((a, b) => b.date.getTime() - a.date.getTime());

	return timeline;
}

export async function recalculateAllInteractionCounts(userId: string): Promise<void> {
	console.log(`Recalculating interaction counts for user ${userId}`);

	// Get all non-archived contacts for the user
	const contacts = await prisma.contact.findMany({
		where: {
			userId,
			archived: false,
		},
		select: {
			id: true,
			email: true,
		},
	});

	// Update each contact with accurate interaction count
	for (const contact of contacts) {
		const [emailCount, calendarCount] = await Promise.all([
			prisma.email.count({
				where: {
					userId,
					OR: [{ fromEmail: contact.email }, { toEmails: { contains: contact.email } }],
				},
			}),
			prisma.calendarEvent.count({
				where: {
					userId,
					OR: [{ organizer: contact.email }, { attendees: { contains: contact.email } }],
				},
			}),
		]);

		const actualInteractionCount = emailCount + calendarCount;

		await prisma.contact.update({
			where: { id: contact.id },
			data: {
				interactionCount: actualInteractionCount,
			},
		});

		console.log(`Updated ${contact.email}: ${actualInteractionCount} interactions (${emailCount} emails + ${calendarCount} calendar events)`);
	}

	console.log(`Recalculation complete for ${contacts.length} contacts`);
}
