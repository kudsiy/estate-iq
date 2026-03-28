ALTER TABLE `workspaces` ADD `plan` enum('starter','pro','scale') NOT NULL DEFAULT 'starter';
--> statement-breakpoint
ALTER TABLE `workspaces` ADD `subscriptionStatus` enum('trial','active','past_due','canceled') NOT NULL DEFAULT 'trial';
--> statement-breakpoint
ALTER TABLE `workspaces` ADD `trialEndsAt` timestamp;
--> statement-breakpoint
ALTER TABLE `workspaces` ADD `currentPeriodEndsAt` timestamp;
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
