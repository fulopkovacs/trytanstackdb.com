CREATE TABLE `boards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at_timestamp_ms` integer DEFAULT (strftime('%s','now') * 1000),
	`project_id` text NOT NULL,
	`temp_db_id` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`temp_db_id`) REFERENCES `temp_dbs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `boards_tenant_id_idx` ON `boards` (`temp_db_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`created_at_timestamp_ms` integer DEFAULT (strftime('%s','now') * 1000),
	`temp_db_id` text NOT NULL,
	`item_positions_in_the_project` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`temp_db_id`) REFERENCES `temp_dbs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `projects_tenant_id_idx` ON `projects` (`temp_db_id`);--> statement-breakpoint
CREATE TABLE `temp_dbs` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at_timestamp_ms` integer DEFAULT (strftime('%s','now') * 1000),
	`expiry_timestamp_ms` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `todo_items` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_at_timestamp_ms` integer DEFAULT (strftime('%s','now') * 1000),
	`board_id` text NOT NULL,
	`temp_db_id` text NOT NULL,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`temp_db_id`) REFERENCES `temp_dbs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `todo_items_tenant_id_idx` ON `todo_items` (`temp_db_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`age` integer NOT NULL,
	`email` text NOT NULL,
	`temp_db_id` text NOT NULL,
	FOREIGN KEY (`temp_db_id`) REFERENCES `temp_dbs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `users_tenant_id_idx` ON `users` (`temp_db_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique_tempdbid` ON `users` (`email`,`temp_db_id`);