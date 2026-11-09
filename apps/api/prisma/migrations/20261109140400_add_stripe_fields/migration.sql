/*
  Warnings:

  - A unique constraint covering the columns `[stripeCustomerId]` on the table `businesses` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `businesses` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "stripeCurrentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "businesses_stripeCustomerId_key" ON "businesses"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_stripeSubscriptionId_key" ON "businesses"("stripeSubscriptionId");
