CREATE TABLE `brandKits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`logos` json,
	`colors` json,
	`fonts` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brandKits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`whatsappNumber` varchar(20),
	`type` enum('buyer','seller','both') NOT NULL,
	`status` enum('active','inactive','converted','lost') DEFAULT 'active',
	`source` varchar(100),
	`tags` json,
	`customFields` json,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contactId` int NOT NULL,
	`propertyId` int,
	`stage` enum('lead','contacted','viewing','offer','closed') DEFAULT 'lead',
	`value` decimal(15,2),
	`commission` decimal(15,2),
	`notes` text,
	`documents` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`closedAt` timestamp,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `designs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('poster','instagram','flyer','reel','email','other') NOT NULL,
	`name` varchar(255) NOT NULL,
	`template` varchar(255),
	`content` json,
	`previewUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `designs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engagementMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`platform` varchar(50) NOT NULL,
	`likes` int DEFAULT 0,
	`comments` int DEFAULT 0,
	`shares` int DEFAULT 0,
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`leads` int DEFAULT 0,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `engagementMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contactId` int,
	`source` enum('form','whatsapp','facebook','instagram','tiktok','manual') NOT NULL,
	`leadData` json,
	`status` enum('new','contacted','qualified','converted','lost') DEFAULT 'new',
	`score` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`address` varchar(255) NOT NULL,
	`city` varchar(100) NOT NULL,
	`subcity` varchar(100),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`price` decimal(15,2),
	`bedrooms` int,
	`bathrooms` int,
	`squareFeet` decimal(12,2),
	`photos` json,
	`status` enum('available','sold','rented','pending') DEFAULT 'available',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socialMediaPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`designId` int,
	`platforms` json,
	`scheduledTime` timestamp,
	`content` text,
	`status` enum('draft','scheduled','published','failed') DEFAULT 'draft',
	`engagementMetrics` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`publishedAt` timestamp,
	CONSTRAINT `socialMediaPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','agent','team_member') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `companyName` varchar(255);