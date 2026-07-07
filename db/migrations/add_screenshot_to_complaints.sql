-- Adds a column to store an optional evidence screenshot for each
-- incident, as a base64 data URL (e.g. "data:image/png;base64,....").
--
-- We store it directly in the database rather than saving it to a file
-- on disk, because Render's free Web Service disk is temporary and gets
-- wiped every time the service restarts or redeploys. Storing it in
-- Postgres means the image survives restarts just like everything else.

ALTER TABLE complaints
ADD COLUMN IF NOT EXISTS screenshot TEXT;
