-- Fix version metadata population for posts
-- This script ensures all metadata fields are properly populated in version tables

-- Update _posts_v table to include ALL metadata fields from posts table
UPDATE _posts_v v
SET
    version_wordpress_metadata_original_author = p.wordpress_metadata_original_author,
    version_wordpress_metadata_original_date = p.wordpress_metadata_original_date,
    version_wordpress_metadata_modified_date = p.wordpress_metadata_modified_date,
    version_wordpress_metadata_status = p.wordpress_metadata_status,
    version_wordpress_metadata_enable_comments = p.wordpress_metadata_enable_comments,
    version_wordpress_metadata_enable_toc = p.wordpress_metadata_enable_toc,
    version_internal_links_metadata_version = p.internal_links_metadata_version,
    version_internal_links_metadata_last_processed = p.internal_links_metadata_last_processed,
    version_internal_links_metadata_content_hash = p.internal_links_metadata_content_hash,
    version_content_db_meta_original_id = p.content_db_meta_original_id,
    version_content_db_meta_website_id = p.content_db_meta_website_id,
    version_content_db_meta_language = p.content_db_meta_language,
    version_content_db_meta_imported_at = p.content_db_meta_imported_at,
    version_affiliate_links_metadata_version = p.affiliate_links_metadata_version,
    version_affiliate_links_metadata_last_processed = p.affiliate_links_metadata_last_processed,
    version_affiliate_links_metadata_content_hash = p.affiliate_links_metadata_content_hash,
    version_affiliate_links_metadata_exclude_from_affiliates = p.affiliate_links_metadata_exclude_from_affiliates,
    version_meta_title = p.meta_title,
    version_meta_description = p.meta_description,
    version_meta_keywords = p.meta_keywords,
    version_meta_focus_keyphrase = p.meta_focus_keyphrase,
    version_meta_image_id = p.meta_image_id
FROM posts p
WHERE v.parent_id = p.id
AND v.latest = true;

-- Verify the update
SELECT
    COUNT(*) as total_versions,
    SUM(CASE WHEN version_wordpress_metadata_original_author IS NOT NULL THEN 1 ELSE 0 END) as with_wp_author,
    SUM(CASE WHEN version_meta_title IS NOT NULL THEN 1 ELSE 0 END) as with_meta_title
FROM _posts_v
WHERE latest = true;