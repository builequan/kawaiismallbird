--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.posts_rels DROP CONSTRAINT IF EXISTS posts_rels_users_fk;
ALTER TABLE IF EXISTS ONLY public.posts_rels DROP CONSTRAINT IF EXISTS posts_rels_tags_fk;
ALTER TABLE IF EXISTS ONLY public.posts_rels DROP CONSTRAINT IF EXISTS posts_rels_posts_fk;
ALTER TABLE IF EXISTS ONLY public.posts_rels DROP CONSTRAINT IF EXISTS posts_rels_parent_fk;
ALTER TABLE IF EXISTS ONLY public.posts_rels DROP CONSTRAINT IF EXISTS posts_rels_categories_fk;
ALTER TABLE IF EXISTS ONLY public.posts DROP CONSTRAINT IF EXISTS posts_meta_image_id_media_id_fk;
ALTER TABLE IF EXISTS ONLY public.posts DROP CONSTRAINT IF EXISTS posts_hero_image_id_media_id_fk;
ALTER TABLE IF EXISTS ONLY public.payload_preferences_rels DROP CONSTRAINT IF EXISTS payload_preferences_rels_users_fk;
ALTER TABLE IF EXISTS ONLY public.payload_preferences_rels DROP CONSTRAINT IF EXISTS payload_preferences_rels_parent_fk;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_parent_id_categories_id_fk;
DROP INDEX IF EXISTS public.users_updated_at_idx;
DROP INDEX IF EXISTS public.users_email_idx;
DROP INDEX IF EXISTS public.users_created_at_idx;
DROP INDEX IF EXISTS public.posts_updated_at_idx;
DROP INDEX IF EXISTS public.posts_slug_idx;
DROP INDEX IF EXISTS public.posts_rels_users_id_idx;
DROP INDEX IF EXISTS public.posts_rels_tags_id_idx;
DROP INDEX IF EXISTS public.posts_rels_posts_id_idx;
DROP INDEX IF EXISTS public.posts_rels_path_idx;
DROP INDEX IF EXISTS public.posts_rels_parent_idx;
DROP INDEX IF EXISTS public.posts_rels_order_idx;
DROP INDEX IF EXISTS public.posts_rels_categories_id_idx;
DROP INDEX IF EXISTS public.posts_meta_meta_image_idx;
DROP INDEX IF EXISTS public.posts_hero_image_idx;
DROP INDEX IF EXISTS public.posts_created_at_idx;
DROP INDEX IF EXISTS public.posts__status_idx;
DROP INDEX IF EXISTS public.payload_preferences_updated_at_idx;
DROP INDEX IF EXISTS public.payload_preferences_rels_users_id_idx;
DROP INDEX IF EXISTS public.payload_preferences_rels_path_idx;
DROP INDEX IF EXISTS public.payload_preferences_rels_parent_idx;
DROP INDEX IF EXISTS public.payload_preferences_rels_order_idx;
DROP INDEX IF EXISTS public.payload_preferences_key_idx;
DROP INDEX IF EXISTS public.payload_preferences_created_at_idx;
DROP INDEX IF EXISTS public.payload_migrations_updated_at_idx;
DROP INDEX IF EXISTS public.payload_migrations_created_at_idx;
DROP INDEX IF EXISTS public.media_updated_at_idx;
DROP INDEX IF EXISTS public.media_sizes_xlarge_sizes_xlarge_filename_idx;
DROP INDEX IF EXISTS public.media_sizes_thumbnail_sizes_thumbnail_filename_idx;
DROP INDEX IF EXISTS public.media_sizes_square_sizes_square_filename_idx;
DROP INDEX IF EXISTS public.media_sizes_small_sizes_small_filename_idx;
DROP INDEX IF EXISTS public.media_sizes_og_sizes_og_filename_idx;
DROP INDEX IF EXISTS public.media_sizes_medium_sizes_medium_filename_idx;
DROP INDEX IF EXISTS public.media_sizes_large_sizes_large_filename_idx;
DROP INDEX IF EXISTS public.media_filename_idx;
DROP INDEX IF EXISTS public.media_created_at_idx;
DROP INDEX IF EXISTS public.categories_updated_at_idx;
DROP INDEX IF EXISTS public.categories_slug_idx;
DROP INDEX IF EXISTS public.categories_parent_idx;
DROP INDEX IF EXISTS public.categories_created_at_idx;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.posts_rels DROP CONSTRAINT IF EXISTS posts_rels_pkey;
ALTER TABLE IF EXISTS ONLY public.posts DROP CONSTRAINT IF EXISTS posts_pkey;
ALTER TABLE IF EXISTS ONLY public.payload_preferences_rels DROP CONSTRAINT IF EXISTS payload_preferences_rels_pkey;
ALTER TABLE IF EXISTS ONLY public.payload_preferences DROP CONSTRAINT IF EXISTS payload_preferences_pkey;
ALTER TABLE IF EXISTS ONLY public.payload_migrations DROP CONSTRAINT IF EXISTS payload_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.media DROP CONSTRAINT IF EXISTS media_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.posts_rels ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.posts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payload_preferences_rels ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payload_preferences ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payload_migrations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.media ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.categories ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.posts_rels_id_seq;
DROP TABLE IF EXISTS public.posts_rels;
DROP SEQUENCE IF EXISTS public.posts_id_seq;
DROP TABLE IF EXISTS public.posts;
DROP SEQUENCE IF EXISTS public.payload_preferences_rels_id_seq;
DROP TABLE IF EXISTS public.payload_preferences_rels;
DROP SEQUENCE IF EXISTS public.payload_preferences_id_seq;
DROP TABLE IF EXISTS public.payload_preferences;
DROP SEQUENCE IF EXISTS public.payload_migrations_id_seq;
DROP TABLE IF EXISTS public.payload_migrations;
DROP SEQUENCE IF EXISTS public.media_id_seq;
DROP TABLE IF EXISTS public.media;
DROP SEQUENCE IF EXISTS public.categories_id_seq;
DROP TABLE IF EXISTS public.categories;
...
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_meta_image_id_media_id_fk FOREIGN KEY (meta_image_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: posts_rels posts_rels_categories_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts_rels
    ADD CONSTRAINT posts_rels_categories_fk FOREIGN KEY (categories_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: posts_rels posts_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts_rels
    ADD CONSTRAINT posts_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: posts_rels posts_rels_posts_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts_rels
    ADD CONSTRAINT posts_rels_posts_fk FOREIGN KEY (posts_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: posts_rels posts_rels_tags_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts_rels
    ADD CONSTRAINT posts_rels_tags_fk FOREIGN KEY (tags_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: posts_rels posts_rels_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts_rels
    ADD CONSTRAINT posts_rels_users_fk FOREIGN KEY (users_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

