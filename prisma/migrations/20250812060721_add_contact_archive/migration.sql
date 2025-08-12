-- AlterTable
ALTER TABLE "public"."contact" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "contact_userId_archived_idx" ON "public"."contact"("userId", "archived");
