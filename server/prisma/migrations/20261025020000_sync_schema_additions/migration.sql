-- AlterTable
ALTER TABLE `Booking` ADD COLUMN `paymentMethodId` INTEGER NULL;

-- AlterTable
ALTER TABLE `ItineraryItem` ADD COLUMN `day` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `Trip` ADD COLUMN `images` JSON NULL;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_paymentMethodId_fkey` FOREIGN KEY (`paymentMethodId`) REFERENCES `PaymentMethod`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
