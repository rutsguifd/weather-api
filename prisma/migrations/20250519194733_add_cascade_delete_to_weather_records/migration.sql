-- DropForeignKey
ALTER TABLE "WeatherRecord" DROP CONSTRAINT "WeatherRecord_subscriptionId_fkey";

-- AddForeignKey
ALTER TABLE "WeatherRecord" ADD CONSTRAINT "WeatherRecord_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "UserSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
