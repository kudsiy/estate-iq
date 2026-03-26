CREATE TABLE `emailVerifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(255) NOT NULL,
	`isVerified` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp NOT NULL,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailVerifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailVerifications_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `passwordResetTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordResetTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `passwordResetTokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `twoFactorSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`secret` varchar(255) NOT NULL,
	`backupCodes` text,
	`isEnabled` boolean NOT NULL DEFAULT false,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `twoFactorSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `twoFactorSettings_userId_unique` UNIQUE(`userId`)
);
