CREATE TABLE `buyerProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`contactId` int,
	`name` varchar(255) NOT NULL,
	`city` varchar(100),
	`subcity` varchar(100),
	`budgetMin` decimal(15,2),
	`budgetMax` decimal(15,2),
	`bedrooms` int,
	`bathrooms` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buyerProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `featureFlags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`description` varchar(255),
	`enabled` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `featureFlags_id` PRIMARY KEY(`id`),
	CONSTRAINT `featureFlags_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`type` enum('lead','deal','engagement','supplier','match','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`entityType` varchar(64),
	`entityId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplierListings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`sourceName` varchar(255) NOT NULL,
	`supplierContact` varchar(255),
	`title` varchar(255) NOT NULL,
	`address` varchar(255) NOT NULL,
	`city` varchar(100) NOT NULL,
	`subcity` varchar(100),
	`price` decimal(15,2),
	`bedrooms` int,
	`bathrooms` int,
	`notes` text,
	`fingerprint` varchar(255) NOT NULL,
	`status` enum('new','reviewed','imported') NOT NULL DEFAULT 'new',
	`importedPropertyId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplierListings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`plan` enum('starter','pro','agency') NOT NULL DEFAULT 'starter',
	`subscriptionStatus` enum('trial','active','past_due','canceled') NOT NULL DEFAULT 'trial',
	`trialEndsAt` timestamp,
	`currentPeriodEndsAt` timestamp,
	`usageCyclePeriodStart` timestamp,
	`aiCaptionsCount` int NOT NULL DEFAULT 0,
	`aiImagesCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `socialMediaPosts` MODIFY COLUMN `status` enum('draft','scheduled','queued','publishing','published','failed') DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `brandKits` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `leadId` int;--> statement-breakpoint
ALTER TABLE `designs` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `propertyId` int;--> statement-breakpoint
ALTER TABLE `leads` ADD `convertedDealId` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `socialMediaPosts` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `socialMediaPosts` ADD `platformStatuses` json;--> statement-breakpoint
ALTER TABLE `socialMediaPosts` ADD `providerMetadata` json;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `workspaceId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompleted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `targetMarket` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `selectedPlatforms` json;--> statement-breakpoint
ALTER TABLE `users` ADD `notificationPreferences` json;