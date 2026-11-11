-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'LIBRARIAN');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('BOOK', 'AUDIOBOOK', 'AUDIOBIOGRAPHY', 'AUDIOSUMMARY', 'GALLERY');

-- CreateEnum
CREATE TYPE "FileFormat" AS ENUM ('EPUB', 'PDF', 'MP3', 'IMAGE_SET', 'NONE');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');

-- CreateEnum
CREATE TYPE "TvSlideKind" AS ENUM ('BOOK_OF_WEEK', 'FEATURED_AUTHOR', 'FUN_FACT', 'GALLERY', 'AGENDA', 'CHALLENGE', 'MESSAGE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'LIBRARIAN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "creator" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "gradeMin" INTEGER NOT NULL,
    "gradeMax" INTEGER NOT NULL,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "language" TEXT NOT NULL DEFAULT 'es',
    "narrator" TEXT,
    "durationSeconds" INTEGER,
    "format" "FileFormat" NOT NULL DEFAULT 'NONE',
    "status" "ResourceStatus" NOT NULL DEFAULT 'DRAFT',
    "filePath" TEXT,
    "fileMime" TEXT,
    "fileSha256" TEXT,
    "fileSizeBytes" INTEGER,
    "coverPath" TEXT,
    "coverMime" TEXT,
    "licenseRightsHolder" TEXT NOT NULL,
    "licenseName" TEXT NOT NULL,
    "licenseUrl" TEXT,
    "licenseAuthorizedDevices" INTEGER NOT NULL DEFAULT 0,
    "licenseOfflineAllowed" BOOLEAN NOT NULL DEFAULT false,
    "licenseValidFrom" TIMESTAMP(3),
    "licenseValidUntil" TIMESTAMP(3),
    "licenseTerritory" TEXT NOT NULL DEFAULT 'CO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TvSlide" (
    "id" TEXT NOT NULL,
    "kind" "TvSlideKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "resourceId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER NOT NULL DEFAULT 15,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TvSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingEvent" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "kind" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReadingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Resource_status_idx" ON "Resource"("status");

-- CreateIndex
CREATE INDEX "Resource_type_idx" ON "Resource"("type");

-- CreateIndex
CREATE INDEX "Resource_title_type_idx" ON "Resource"("title", "type");

-- CreateIndex
CREATE INDEX "TvSlide_active_order_idx" ON "TvSlide"("active", "order");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingEvent_resourceId_day_kind_key" ON "ReadingEvent"("resourceId", "day", "kind");

-- AddForeignKey
ALTER TABLE "TvSlide" ADD CONSTRAINT "TvSlide_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingEvent" ADD CONSTRAINT "ReadingEvent_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
