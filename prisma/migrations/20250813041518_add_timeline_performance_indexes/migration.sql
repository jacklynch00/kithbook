-- CreateIndex
CREATE INDEX "calendar_event_userId_organizer_idx" ON "public"."calendar_event"("userId", "organizer");

-- CreateIndex
CREATE INDEX "calendar_event_organizer_idx" ON "public"."calendar_event"("organizer");

-- CreateIndex
CREATE INDEX "email_userId_fromEmail_idx" ON "public"."email"("userId", "fromEmail");

-- CreateIndex
CREATE INDEX "email_fromEmail_idx" ON "public"."email"("fromEmail");
