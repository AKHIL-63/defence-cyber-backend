-- Adds a mobile number column to the users table if it does not already exist.
-- Safe to run multiple times.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone VARCHAR(10);
