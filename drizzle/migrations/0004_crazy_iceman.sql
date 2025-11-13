CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`created_at_timestamp_ms` integer DEFAULT (strftime('%s','now') * 1000),
	`temp_db_id` text NOT NULL,
	FOREIGN KEY (`temp_db_id`) REFERENCES `temp_dbs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `projects_tenant_id_idx` ON `projects` (`temp_db_id`);--> statement-breakpoint
ALTER TABLE `boards` ADD `project_id` text NOT NULL REFERENCES projects(id);