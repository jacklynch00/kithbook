-- CreateTable
CREATE TABLE "public"."email" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "threadId" TEXT,
    "subject" TEXT,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "toEmails" TEXT,
    "body" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "labels" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."calendar_event" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "location" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT,
    "attendees" TEXT,
    "organizer" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contact" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "lastInteractionAt" TIMESTAMP(3) NOT NULL,
    "interactionCount" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_googleId_key" ON "public"."email"("googleId");

-- CreateIndex
CREATE INDEX "email_userId_receivedAt_idx" ON "public"."email"("userId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_event_googleId_key" ON "public"."calendar_event"("googleId");

-- CreateIndex
CREATE INDEX "calendar_event_userId_startTime_idx" ON "public"."calendar_event"("userId", "startTime");

-- CreateIndex
CREATE INDEX "contact_userId_lastInteractionAt_idx" ON "public"."contact"("userId", "lastInteractionAt");

-- CreateIndex
CREATE INDEX "contact_userId_email_idx" ON "public"."contact"("userId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "contact_userId_email_key" ON "public"."contact"("userId", "email");

-- AddForeignKey
ALTER TABLE "public"."email" ADD CONSTRAINT "email_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."calendar_event" ADD CONSTRAINT "calendar_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact" ADD CONSTRAINT "contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
