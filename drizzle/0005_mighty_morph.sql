CREATE TABLE `DashboardSettings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dashboardId` integer NOT NULL,
	`locale` text DEFAULT 'fr' NOT NULL,
	`measurementSystem` text DEFAULT 'metric' NOT NULL,
	`temperatureUnit` text DEFAULT 'celsius' NOT NULL,
	`timeFormat` text DEFAULT '24h' NOT NULL,
	`dateFormat` text DEFAULT 'DD/MM/YYYY' NOT NULL,
	`timezone` text DEFAULT 'Europe/Paris' NOT NULL,
	`theme` text DEFAULT 'auto' NOT NULL,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`dashboardId`) REFERENCES `Dashboards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dashboardSettings_dashboardId_idx` ON `DashboardSettings` (`dashboardId`);--> statement-breakpoint
CREATE UNIQUE INDEX `dashboardSettings_dashboardId_unique` ON `DashboardSettings` (`dashboardId`);--> statement-breakpoint
CREATE TABLE `Dashboards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`isDefault` integer DEFAULT false NOT NULL,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `Pages` ADD `dashboardId` integer REFERENCES Dashboards(id);--> statement-breakpoint
CREATE INDEX `pages_dashboardId_idx` ON `Pages` (`dashboardId`);