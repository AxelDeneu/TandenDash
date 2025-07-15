CREATE INDEX `todoItem_todoListId_idx` ON `TodoItem` (`todoListId`);--> statement-breakpoint
CREATE INDEX `todoItem_position_idx` ON `TodoItem` (`position`);--> statement-breakpoint
CREATE INDEX `todoItem_checked_idx` ON `TodoItem` (`checked`);--> statement-breakpoint
CREATE INDEX `todoItem_list_position_idx` ON `TodoItem` (`todoListId`,`position`);--> statement-breakpoint
CREATE INDEX `widgetInstance_pageId_idx` ON `WidgetInstance` (`pageId`);--> statement-breakpoint
CREATE INDEX `widgetInstance_type_idx` ON `WidgetInstance` (`type`);--> statement-breakpoint
CREATE INDEX `widgetInstance_page_type_idx` ON `WidgetInstance` (`pageId`,`type`);