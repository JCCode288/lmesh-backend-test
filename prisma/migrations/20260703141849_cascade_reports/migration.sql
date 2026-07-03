-- DropForeignKey
ALTER TABLE "Analysis" DROP CONSTRAINT "Analysis_reportId_fkey";

-- DropForeignKey
ALTER TABLE "FileDatas" DROP CONSTRAINT "FileDatas_reportId_fkey";

-- DropForeignKey
ALTER TABLE "Reports" DROP CONSTRAINT "Reports_createdBy_fkey";

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileDatas" ADD CONSTRAINT "FileDatas_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
