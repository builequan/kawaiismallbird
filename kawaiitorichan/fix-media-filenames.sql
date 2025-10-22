-- Fix media filenames to match actual files
-- Database has -2.jpg, -3.jpg, -4.jpg, -5.jpg suffixes for hero and section images
-- but actual files have no suffix for hero, and -1.jpg for section images

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

-- Update section-4.jpg to section-1.jpg
UPDATE media
SET filename = REPLACE(filename, '-section-4.jpg', '-section-1.jpg'),
    url = REPLACE(url, '-section-4.jpg', '-section-1.jpg')
WHERE filename LIKE '%-section-4.jpg';

-- Update section-5.jpg to section-1.jpg
UPDATE media
SET filename = REPLACE(filename, '-section-5.jpg', '-section-1.jpg'),
    url = REPLACE(url, '-section-5.jpg', '-section-1.jpg')
WHERE filename LIKE '%-section-5.jpg';

SELECT 'Fixed hero images: ' || COUNT(*) as result FROM media WHERE filename LIKE '%-hero.jpg';
SELECT 'Fixed section images: ' || COUNT(*) as result FROM media WHERE filename LIKE '%-section-1.jpg';
