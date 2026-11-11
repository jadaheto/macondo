-- CreateEnum
CREATE TYPE "StoryStatus" AS ENUM ('GENERATING', 'GENERATED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'FAILED');

-- CreateTable
CREATE TABLE "GeneratedStory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "band" TEXT NOT NULL,
    "autorNombre" TEXT,
    "protagonista" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "lugar" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "modo" TEXT NOT NULL DEFAULT 'plantilla',
    "titulo" TEXT NOT NULL DEFAULT '',
    "contenido" JSONB,
    "audioPath" TEXT,
    "audioDuration" INTEGER,
    "audioError" TEXT,
    "status" "StoryStatus" NOT NULL DEFAULT 'GENERATING',
    "error" TEXT,
    "reviewNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "deviceHash" TEXT NOT NULL,
    "resourceIds" JSONB,
    "providerMs" INTEGER,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,

    CONSTRAINT "GeneratedStory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneratedStory_status_idx" ON "GeneratedStory"("status");

-- CreateIndex
CREATE INDEX "GeneratedStory_createdAt_idx" ON "GeneratedStory"("createdAt");

-- CreateIndex
CREATE INDEX "GeneratedStory_deviceHash_createdAt_idx" ON "GeneratedStory"("deviceHash", "createdAt");
