CREATE TABLE `ModeState` (
	`id` integer PRIMARY KEY NOT NULL,
	`mode` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `TodoItem` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`checked` integer DEFAULT false NOT NULL,
	`todoListId` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`category` text,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`todoListId`) REFERENCES `TodoList`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `TodoList` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `WidgetInstance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`position` text NOT NULL,
	`options` text NOT NULL,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL
);
