CREATE TABLE `contactEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`contactId` int NOT NULL,
	`dealId` int,
	`type` enum('note','status_change','deal_update','lead_conversion','system') NOT NULL,
	`label` varchar(255) NOT NULL,
	`description` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contactEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `source` enum('form','whatsapp','facebook','instagram','tiktok','manual','tracking_link') NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `subcity` varchar(100);--> statement-breakpoint
ALTER TABLE `contacts` ADD `woreda` varchar(100);--> statement-breakpoint
ALTER TABLE `contacts` ADD `propertyInterest` varchar(100);--> statement-breakpoint
ALTER TABLE `properties` ADD `uniqueListingId` varchar(255);--> statement-breakpoint
ALTER TABLE `properties` ADD `trackingLink` varchar(500);--> statement-breakpoint
ALTER TABLE `properties` ADD `isPosted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `properties` ADD `postTimestamp` timestamp;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `billingInterval` enum('monthly','yearly') DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `apiKey` varchar(64);--> statement-breakpoint
ALTER TABLE `workspaces` ADD `socialConfig` json;--> statement-breakpoint
ALTER TABLE `properties` ADD CONSTRAINT `properties_uniqueListingId_unique` UNIQUE(`uniqueListingId`);--> statement-breakpoint
ALTER TABLE `workspaces` ADD CONSTRAINT `workspaces_apiKey_unique` UNIQUE(`apiKey`);