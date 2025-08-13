-- CreateTable
CREATE TABLE "public"."contact_summary" (
    "id" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyTopics" TEXT NOT NULL,
    "relationshipInsights" TEXT NOT NULL,
    "totalEmails" INTEGER NOT NULL,
    "earliestEmail" TIMESTAMP(3),
    "latestEmail" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_summary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_summary_userId_contactEmail_idx" ON "public"."contact_summary"("userId", "contactEmail");

-- CreateIndex
CREATE UNIQUE INDEX "contact_summary_userId_contactEmail_key" ON "public"."contact_summary"("userId", "contactEmail");

-- AddForeignKey
ALTER TABLE "public"."contact_summary" ADD CONSTRAINT "contact_summary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
