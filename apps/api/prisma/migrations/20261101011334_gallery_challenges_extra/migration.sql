-- CreateEnum
CREATE TYPE "ChallengeKind" AS ENUM ('trivia', 'sequence', 'match');

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "extra" JSONB,
ADD COLUMN     "gallery" JSONB;

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "kind" "ChallengeKind" NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT '',
    "bands" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "text" TEXT NOT NULL DEFAULT '',
    "payload" JSONB NOT NULL,
    "resourceTitle" TEXT,
    "resourceCreator" TEXT,
    "resourceId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Challenge_active_idx" ON "Challenge"("active");

-- CreateIndex
CREATE INDEX "Challenge_resourceId_idx" ON "Challenge"("resourceId");

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
