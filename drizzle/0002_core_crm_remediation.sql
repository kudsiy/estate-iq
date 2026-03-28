CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);
--> statement-breakpoint
ALTER TABLE `users` ADD `workspaceId` int;
--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompleted` boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE `users` ADD `targetMarket` varchar(255);
--> statement-breakpoint
ALTER TABLE `users` ADD `selectedPlatforms` json;
--> statement-breakpoint
INSERT INTO `workspaces` (`ownerUserId`, `name`)
SELECT `id`, COALESCE(`companyName`, CONCAT(COALESCE(`name`, 'User'), ' Workspace'))
FROM `users`;
--> statement-breakpoint
UPDATE `users` `u`
JOIN `workspaces` `w` ON `w`.`ownerUserId` = `u`.`id`
SET `u`.`workspaceId` = `w`.`id`
WHERE `u`.`workspaceId` IS NULL;
--> statement-breakpoint
ALTER TABLE `contacts` ADD `workspaceId` int;
--> statement-breakpoint
ALTER TABLE `properties` ADD `workspaceId` int;
--> statement-breakpoint
ALTER TABLE `deals` ADD `workspaceId` int;
--> statement-breakpoint
ALTER TABLE `leads` ADD `workspaceId` int;
--> statement-breakpoint
ALTER TABLE `brandKits` ADD `workspaceId` int;
--> statement-breakpoint
ALTER TABLE `designs` ADD `workspaceId` int;
--> statement-breakpoint
ALTER TABLE `socialMediaPosts` ADD `workspaceId` int;
--> statement-breakpoint
UPDATE `contacts` `c`
JOIN `users` `u` ON `u`.`id` = `c`.`userId`
SET `c`.`workspaceId` = `u`.`workspaceId`
WHERE `c`.`workspaceId` IS NULL;
--> statement-breakpoint
UPDATE `properties` `p`
JOIN `users` `u` ON `u`.`id` = `p`.`userId`
SET `p`.`workspaceId` = `u`.`workspaceId`
WHERE `p`.`workspaceId` IS NULL;
--> statement-breakpoint
UPDATE `deals` `d`
JOIN `users` `u` ON `u`.`id` = `d`.`userId`
SET `d`.`workspaceId` = `u`.`workspaceId`
WHERE `d`.`workspaceId` IS NULL;
--> statement-breakpoint
UPDATE `leads` `l`
JOIN `users` `u` ON `u`.`id` = `l`.`userId`
SET `l`.`workspaceId` = `u`.`workspaceId`
WHERE `l`.`workspaceId` IS NULL;
--> statement-breakpoint
UPDATE `brandKits` `b`
JOIN `users` `u` ON `u`.`id` = `b`.`userId`
SET `b`.`workspaceId` = `u`.`workspaceId`
WHERE `b`.`workspaceId` IS NULL;
--> statement-breakpoint
UPDATE `designs` `d`
JOIN `users` `u` ON `u`.`id` = `d`.`userId`
SET `d`.`workspaceId` = `u`.`workspaceId`
WHERE `d`.`workspaceId` IS NULL;
--> statement-breakpoint
UPDATE `socialMediaPosts` `s`
JOIN `users` `u` ON `u`.`id` = `s`.`userId`
SET `s`.`workspaceId` = `u`.`workspaceId`
WHERE `s`.`workspaceId` IS NULL;
--> statement-breakpoint
ALTER TABLE `contacts` MODIFY COLUMN `workspaceId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `workspaceId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `deals` MODIFY COLUMN `workspaceId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `workspaceId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `brandKits` MODIFY COLUMN `workspaceId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `designs` MODIFY COLUMN `workspaceId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `socialMediaPosts` MODIFY COLUMN `workspaceId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `deals` ADD `leadId` int;
--> statement-breakpoint
ALTER TABLE `leads` ADD `propertyId` int;
--> statement-breakpoint
ALTER TABLE `leads` ADD `convertedDealId` int;
--> statement-breakpoint
ALTER TABLE `socialMediaPosts` MODIFY COLUMN `status` enum('draft','scheduled','queued','publishing','published','failed') DEFAULT 'draft';
--> statement-breakpoint
ALTER TABLE `socialMediaPosts` ADD `platformStatuses` json;
--> statement-breakpoint
ALTER TABLE `socialMediaPosts` ADD `providerMetadata` json;
