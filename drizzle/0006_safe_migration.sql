-- Safe migration for Phase 2: Ethiopian Pricing Strategy & Tracking Restoration
-- Run this BEFORE deploying the new code.

-- 1. Safely expand the plan enum to include 'agency'
ALTER TABLE `workspaces` MODIFY COLUMN `plan` enum('starter','pro','scale','agency') NOT NULL DEFAULT 'starter';

-- 2. Migrate existing 'scale' plans to 'agency'
UPDATE `workspaces` SET `plan` = 'agency' WHERE `plan` = 'scale';

-- 3. Restrict the enum to remove 'scale' entirely
ALTER TABLE `workspaces` MODIFY COLUMN `plan` enum('starter','pro','agency') NOT NULL DEFAULT 'starter';

-- 4. Add usage tracking fields
ALTER TABLE `workspaces` ADD COLUMN IF NOT EXISTS `usageCyclePeriodStart` timestamp NULL;
ALTER TABLE `workspaces` ADD COLUMN IF NOT EXISTS `aiCaptionsCount` int NOT NULL DEFAULT 0;
ALTER TABLE `workspaces` ADD COLUMN IF NOT EXISTS `aiImagesCount` int NOT NULL DEFAULT 0;

-- 5. Add billing interval for future yearly plan support
ALTER TABLE `workspaces` ADD COLUMN IF NOT EXISTS `billingInterval` enum('monthly','yearly') NOT NULL DEFAULT 'monthly';

-- 6. Add tracking_link to leads source enum
ALTER TABLE `leads` MODIFY COLUMN `source` enum('form','whatsapp','facebook','instagram','tiktok','manual','tracking_link') NOT NULL;

-- 7. Restore tracking fields to properties (3-step safe process)
-- Step 7a: Add as nullable first
ALTER TABLE `properties` ADD COLUMN IF NOT EXISTS `uniqueListingId` varchar(255) NULL;
ALTER TABLE `properties` ADD COLUMN IF NOT EXISTS `trackingLink` varchar(500) NULL;
ALTER TABLE `properties` ADD COLUMN IF NOT EXISTS `isPosted` boolean NOT NULL DEFAULT false;
ALTER TABLE `properties` ADD COLUMN IF NOT EXISTS `postTimestamp` timestamp NULL;

-- Step 7b: Backfill existing rows with 'legacy-' prefix to allow non-null unique constraint
UPDATE `properties` SET `uniqueListingId` = CONCAT('legacy-', id) WHERE `uniqueListingId` IS NULL;

-- Step 7c: Apply NOT NULL and UNIQUE constraint to uniqueListingId
ALTER TABLE `properties` MODIFY COLUMN `uniqueListingId` varchar(255) NOT NULL;
ALTER TABLE `properties` ADD UNIQUE INDEX IF NOT EXISTS `prop_unique_listing_idx` (`uniqueListingId`);
