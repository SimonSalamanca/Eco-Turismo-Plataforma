-- Migration: 012_reports_description.sql
-- Adds description and resolution_note to content_reports

ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS resolution_note TEXT;
