/*
  Warnings:

  - A unique constraint covering the columns `[emailConfirmToken]` on the table `UserSubscription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserSubscription" ADD COLUMN     "emailConfirmToken" TEXT,
ADD COLUMN     "emailConfirmed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_emailConfirmToken_key" ON "UserSubscription"("emailConfirmToken");
