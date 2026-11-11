-- AlterEnum
ALTER TYPE "TvSlideKind" ADD VALUE 'TUTORIAL';

-- AlterTable
ALTER TABLE "TvSlide" ALTER COLUMN "durationSeconds" SET DEFAULT 20;
