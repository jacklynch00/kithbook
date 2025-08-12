import { z } from 'zod';
import type { Contact, Email, CalendarEvent } from '@prisma/client';

// Re-export Prisma types for convenience
export type { Contact, Email, CalendarEvent, User, Session, Account } from '@prisma/client';

// Zod schemas for API validation
export const ContactSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  lastInteractionAt: z.coerce.date(),
  interactionCount: z.number().int().min(0), // Allow 0 for new contacts
  archived: z.boolean(),
  archivedAt: z.coerce.date().nullable(),
  userId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const EmailSchema = z.object({
  id: z.string().cuid(),
  googleId: z.string(),
  threadId: z.string().nullable(),
  subject: z.string().nullable(),
  fromEmail: z.string().nullable(),
  fromName: z.string().nullable(),
  toEmails: z.string().nullable(),
  body: z.string().nullable(),
  isRead: z.boolean(),
  isImportant: z.boolean(),
  labels: z.string().nullable(),
  receivedAt: z.coerce.date(),
  userId: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CalendarEventSchema = z.object({
  id: z.string().cuid(),
  googleId: z.string(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  isAllDay: z.boolean(),
  status: z.string().nullable(),
  attendees: z.string().nullable(),
  organizer: z.string().nullable(),
  userId: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// Timeline item types
export const TimelineEmailItemSchema = z.object({
  id: z.string(),
  type: z.literal('email'),
  date: z.coerce.date(),
  title: z.string(),
  details: z.object({
    from: z.string().nullable(),
    fromName: z.string().nullable(),
    body: z.string().nullable(),
    isRead: z.boolean(),
  }),
});

export const TimelineCalendarItemSchema = z.object({
  id: z.string(),
  type: z.literal('calendar'),
  date: z.coerce.date(),
  title: z.string(),
  details: z.object({
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    location: z.string().nullable(),
    description: z.string().nullable(),
    status: z.string().nullable(),
    organizer: z.string().nullable(),
  }),
});

export const TimelineItemSchema = z.union([
  TimelineEmailItemSchema,
  TimelineCalendarItemSchema,
]);

// Infer types from schemas
export type ContactType = z.infer<typeof ContactSchema>;
export type EmailType = z.infer<typeof EmailSchema>;
export type CalendarEventType = z.infer<typeof CalendarEventSchema>;
export type TimelineEmailItem = z.infer<typeof TimelineEmailItemSchema>;
export type TimelineCalendarItem = z.infer<typeof TimelineCalendarItemSchema>;
export type TimelineItem = z.infer<typeof TimelineItemSchema>;

// API Response schemas
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    error: z.string().optional(),
    data: dataSchema.optional(),
  });

export const ContactsApiResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  contacts: z.array(ContactSchema).optional(),
});

export const TimelineApiResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  timeline: z.array(TimelineItemSchema).optional(),
});

export const SyncResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  details: z.string().optional(),
  results: z.object({
    gmail: z.object({
      syncedCount: z.number(),
      totalFound: z.number(),
    }).optional(),
    calendar: z.object({
      syncedCount: z.number(),
      totalFound: z.number(),
    }).optional(),
    errors: z.array(z.string()),
  }).optional(),
});

// Infer API response types
export type ContactsApiResponse = z.infer<typeof ContactsApiResponseSchema>;
export type TimelineApiResponse = z.infer<typeof TimelineApiResponseSchema>;
export type SyncResult = z.infer<typeof SyncResultSchema>;

// Search and filter types
export const SearchParamsSchema = z.object({
  q: z.string().min(1).max(100),
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

// Form validation schemas
export const ContactSearchSchema = z.object({
  searchTerm: z.string().min(0).max(100),
});

export type ContactSearchForm = z.infer<typeof ContactSearchSchema>;

// Utility type for converting Prisma dates to Date objects
export type WithDates<T> = {
  [K in keyof T]: T[K] extends Date | null ? Date : T[K];
};