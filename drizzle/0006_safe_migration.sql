-- Safe migration for Phase 2: Ethiopian Pricing Strategy & Tracking Restoration
-- Merged from 0006_cloudy_catseye.sql and 0006_safe_migration.sql

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

-- 6. Add apiKey and socialConfig to workspaces
ALTER TABLE `workspaces` ADD COLUMN IF NOT EXISTS `apiKey` varchar(64);
ALTER TABLE `workspaces` ADD COLUMN IF NOT EXISTS `socialConfig` json;
ALTER TABLE `workspaces` ADD CONSTRAINT IF NOT EXISTS `workspaces_apiKey_unique` UNIQUE(`apiKey`);

-- 7. Add tracking_link to leads source enum
ALTER TABLE `leads` MODIFY COLUMN `source` enum('form','whatsapp','facebook','instagram','tiktok','manual','tracking_link') NOT NULL;

-- 8. Restore tracking fields to properties (safe process)
ALTER TABLE `properties` ADD COLUMN IF NOT EXISTS `uniqueListingId` varchar(255) NULL;
ALTER TABLE `properties` ADD COLUMN IF NOT EXISTS `trackingLink` varchar(500) NULL;
ALTER TABLE `properties` ADD COLUMN IF NOT EXISTS `isPosted` boolean NOT NULL DEFAULT false;
ALTER TABLE `properties` ADD COLUMN IF NOT EXISTS `postTimestamp` timestamp NULL;

-- Backfill existing rows so uniqueListingId can have a unique constraint
UPDATE `properties` SET `uniqueListingId` = CONCAT('legacy-', id) WHERE `uniqueListingId` IS NULL;

-- Apply NOT NULL and UNIQUE constraint
ALTER TABLE `properties` MODIFY COLUMN `uniqueListingId` varchar(255) NOT NULL;
ALTER TABLE `properties` ADD UNIQUE INDEX IF NOT EXISTS `prop_unique_listing_idx` (`uniqueListingId`);

-- 9. Create contactEvents table (from 0006_cloudy_catseye)
CREATE TABLE IF NOT EXISTS `contactEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`contactId` int,
	`dealId` int,
	`type` enum('note','status_change','deal_update','lead_conversion','system') NOT NULL,
	`label` varchar(255) NOT NULL,
	`description` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contactEvents_id` PRIMARY KEY(`id`)
);

-- 10. Add Ethiopian CRM columns to contacts
ALTER TABLE `contacts` ADD COLUMN IF NOT EXISTS `subcity` varchar(100);
ALTER TABLE `contacts` ADD COLUMN IF NOT EXISTS `woreda` varchar(100);
ALTER TABLE `contacts` ADD COLUMN IF NOT EXISTS `propertyInterest` varchar(100);
