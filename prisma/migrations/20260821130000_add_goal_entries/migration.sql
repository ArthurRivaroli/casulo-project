-- AlterTable
-- currentAmount is replaced by a computed sum over GoalEntry.
ALTER TABLE "Goal" DROP COLUMN "currentAmount";

-- CreateTable
CREATE TABLE "GoalEntry" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "goalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoalEntry_transactionId_key" ON "GoalEntry"("transactionId");

-- AddForeignKey
ALTER TABLE "GoalEntry" ADD CONSTRAINT "GoalEntry_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalEntry" ADD CONSTRAINT "GoalEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalEntry" ADD CONSTRAINT "GoalEntry_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalEntry" ADD CONSTRAINT "GoalEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
