-- Create project_categories table
CREATE TABLE IF NOT EXISTS "project_categories" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL UNIQUE,
  "description" TEXT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure there is at least one category to migrate existing projects
INSERT INTO "project_categories" ("name", "description", "sort_order", "is_active")
VALUES ('默认分类', '迁移前存在的项目将归属该分类', 0, TRUE)
ON CONFLICT ("name") DO NOTHING;

-- Add category_id column to projects table if missing
ALTER TABLE "projects"
ADD COLUMN IF NOT EXISTS "category_id" INTEGER;

-- Populate existing rows with default category
UPDATE "projects"
SET "category_id" = COALESCE(
  "category_id",
  (SELECT "id" FROM "project_categories" WHERE "name" = '默认分类' LIMIT 1)
);

-- Enforce NOT NULL constraint and foreign key once values populated
ALTER TABLE "projects"
ALTER COLUMN "category_id" SET NOT NULL;

ALTER TABLE "projects"
ADD CONSTRAINT IF NOT EXISTS "projects_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "project_categories"("id") ON UPDATE CASCADE;

-- Create supporting index for category filter
CREATE INDEX IF NOT EXISTS "projects_category_id_idx" ON "projects" ("category_id");

-- Add documentation flag to sub_projects
ALTER TABLE "sub_projects"
ADD COLUMN IF NOT EXISTS "documentation_enabled" BOOLEAN NOT NULL DEFAULT FALSE;

-- Ensure existing rows respect default value
UPDATE "sub_projects"
SET "documentation_enabled" = COALESCE("documentation_enabled", FALSE);

-- Add helpful indexes for category management
CREATE INDEX IF NOT EXISTS "project_categories_is_active_idx" ON "project_categories" ("is_active");
CREATE INDEX IF NOT EXISTS "project_categories_sort_order_idx" ON "project_categories" ("sort_order");
