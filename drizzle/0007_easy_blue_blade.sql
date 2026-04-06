ALTER TABLE `brandKits` ADD `phoneNumber` varchar(32);--> statement-breakpoint
ALTER TABLE `brandKits` ADD `whatsappNumber` varchar(32);--> statement-breakpoint
ALTER TABLE `brandKits` ADD `facebookUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `brandKits` ADD `instagramHandle` varchar(100);--> statement-breakpoint
ALTER TABLE `brandKits` ADD `tiktokHandle` varchar(100);--> statement-breakpoint
ALTER TABLE `brandKits` ADD `telegramChannel` varchar(100);--> statement-breakpoint
ALTER TABLE `brandKits` ADD `agentPortrait` varchar(500);--> statement-breakpoint
ALTER TABLE `brandKits` ADD `tagline` varchar(255);--> statement-breakpoint
ALTER TABLE `brandKits` ADD `targetAreas` json;--> statement-breakpoint
ALTER TABLE `brandKits` ADD `languagePreference` enum('amharic','english','both') DEFAULT 'both';--> statement-breakpoint
ALTER TABLE `designs` ADD `propertyId` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `woreda` varchar(100);--> statement-breakpoint
ALTER TABLE `socialMediaPosts` ADD `mediaUrl` text;--> statement-breakpoint
ALTER TABLE `socialMediaPosts` ADD `mediaType` enum('image','video');--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);