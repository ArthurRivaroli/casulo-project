-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "isFixed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "installmentNumber" INTEGER,
ADD COLUMN     "installmentTotal" INTEGER,
ADD COLUMN     "recurrenceGroupId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_recurrenceGroupId_idx" ON "Transaction"("recurrenceGroupId");
