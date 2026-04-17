ALTER TABLE `contactEvents` MODIFY COLUMN `contactId` int;--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `source` enum('form','whatsapp','facebook','instagram','tiktok','manual','tracking_link','call','telegram') NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `status` enum('new','contacted','qualified','converted','lost','ignored') DEFAULT 'new';--> statement-breakpoint
ALTER TABLE `contactEvents` ADD `leadId` int;