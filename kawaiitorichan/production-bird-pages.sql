-- Production Bird Pages Data
-- Export from local golfer database
-- This ensures production has exact same data as local

-- Clear existing pages
DELETE FROM pages WHERE slug IN ('home', 'about-us');

-- Get the actual data from local and insert it