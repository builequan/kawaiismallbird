-- Fix media filenames to match actual files
-- Database has -2.jpg and -3.jpg suffixes, but actual files have no suffix or -1.jpg

-- Update hero-2.jpg to hero.jpg
UPDATE media
SET filename = REPLACE(filename, '-hero-2.jpg', '-hero.jpg'),
    url = REPLACE(url, '-hero-2.jpg', '-hero.jpg')
WHERE filename LIKE '%-hero-2.jpg';

-- Update section-3.jpg to section-1.jpg
UPDATE media
SET filename = REPLACE(filename, '-section-3.jpg', '-section-1.jpg'),
    url = REPLACE(url, '-section-3.jpg', '-section-1.jpg')
WHERE filename LIKE '%-section-3.jpg';

SELECT COUNT(*) as updated_hero_files FROM media WHERE filename LIKE '%-hero.jpg';
SELECT COUNT(*) as updated_section_files FROM media WHERE filename LIKE '%-section-1.jpg';
