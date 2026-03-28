ALTER TABLE `users` ADD `notificationPreferences` json;
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
