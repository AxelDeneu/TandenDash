CREATE TABLE `WidgetData` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`widgetInstanceId` integer NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`widgetInstanceId`) REFERENCES `WidgetInstance`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `widgetData_instance_idx` ON `WidgetData` (`widgetInstanceId`);--> statement-breakpoint
CREATE UNIQUE INDEX `WidgetData_widgetInstanceId_key_unique` ON `WidgetData` (`widgetInstanceId`,`key`);