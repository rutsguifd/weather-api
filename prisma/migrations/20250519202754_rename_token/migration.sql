/*
  Warnings:

  - You are about to drop the column `emailConfirmToken` on the `UserSubscription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token]` on the table `UserSubscription` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UserSubscription_emailConfirmToken_key";

-- AlterTable
ALTER TABLE "UserSubscription" DROP COLUMN "emailConfirmToken",
ADD COLUMN     "token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_token_key" ON "UserSubscription"("token");
