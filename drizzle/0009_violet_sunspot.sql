ALTER TABLE `leads` ADD `fingerprintId` varchar(64);--> statement-breakpoint
ALTER TABLE `leads` ADD `lastInteractionAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `workspaces` ADD `trackingToken` varchar(64);--> statement-breakpoint
ALTER TABLE `workspaces` ADD CONSTRAINT `workspaces_trackingToken_unique` UNIQUE(`trackingToken`);