-- Migration 0007: Expand brandKits with contact, social, and localization fields
ALTER TABLE brandKits
  ADD COLUMN phoneNumber VARCHAR(32) DEFAULT NULL,
  ADD COLUMN whatsappNumber VARCHAR(32) DEFAULT NULL,
  ADD COLUMN facebookUrl VARCHAR(500) DEFAULT NULL,
  ADD COLUMN instagramHandle VARCHAR(100) DEFAULT NULL,
  ADD COLUMN tiktokHandle VARCHAR(100) DEFAULT NULL,
  ADD COLUMN telegramChannel VARCHAR(100) DEFAULT NULL,
  ADD COLUMN agentPortrait VARCHAR(500) DEFAULT NULL,
  ADD COLUMN tagline VARCHAR(255) DEFAULT NULL,
  ADD COLUMN targetAreas JSON DEFAULT NULL,
  ADD COLUMN languagePreference ENUM('amharic', 'english', 'both') DEFAULT 'both';
