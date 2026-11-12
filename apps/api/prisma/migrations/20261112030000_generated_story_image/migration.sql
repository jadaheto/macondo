-- Ilustración generada con IA para los cuentos del taller (ADR-020)
ALTER TABLE "GeneratedStory"
  ADD COLUMN "imagePath" TEXT,
  ADD COLUMN "imageError" TEXT,
  ADD COLUMN "imageHidden" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "imageProvider" TEXT,
  ADD COLUMN "imageMs" INTEGER;
