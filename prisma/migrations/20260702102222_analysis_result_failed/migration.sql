-- AlterEnum
ALTER TYPE "ReportStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "error" TEXT,
ADD COLUMN     "result" JSONB,
ALTER COLUMN "startedAt" DROP NOT NULL,
ALTER COLUMN "startedAt" DROP DEFAULT;
