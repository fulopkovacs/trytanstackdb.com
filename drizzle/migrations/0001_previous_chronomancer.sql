ALTER TABLE "todo_items" ADD COLUMN "project_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "todo_items" ADD CONSTRAINT "todo_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "todo_items_project_id_idx" ON "todo_items" USING btree ("project_id");