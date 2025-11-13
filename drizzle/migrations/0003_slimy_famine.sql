ALTER TABLE `temp_dbs` RENAME COLUMN "expiryTimestampMs" TO "expiry_timestamp_ms";--> statement-breakpoint
DROP TABLE `account`;--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
DROP TABLE `verification`;