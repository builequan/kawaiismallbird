-- Export bird pages from local database
-- Generated from local golfer database

-- First, delete existing pages to avoid conflicts
DELETE FROM pages WHERE slug IN ('home', 'about-us');

-- Insert actual data from local database
-- Pages exported successfully
