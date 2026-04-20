-- Migration 0010: Add missing columns that exist in schema but not in production DB
-- sellerPhone on properties, followUpDate on contacts
-- Note: Use information_schema guard when running manually on MySQL < 8.0

ALTER TABLE `properties` ADD COLUMN `sellerPhone` varchar(32);
ALTER TABLE `contacts` ADD COLUMN `followUpDate` timestamp NULL;
