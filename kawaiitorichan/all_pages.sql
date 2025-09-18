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

--
-- Data for Name: pages; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.pages (id, title, hero_type, hero_rich_text, hero_media_id, meta_title, meta_image_id, meta_description, published_at, slug, slug_lock, updated_at, created_at, _status) VALUES (7, 'かわいい小鳥の世界 - あなたの愛鳥ライフをサポート', 'lowImpact', '{"root": {"type": "root", "children": [{"tag": "h1", "type": "heading", "children": [{"text": "あなたの愛鳥ライフを", "type": "text", "format": 1}]}, {"tag": "h1", "type": "heading", "children": [{"text": "完全サポート！", "type": "text", "format": 1}]}, {"type": "paragraph", "children": [{"text": "野鳥観察から飼育まで、すべての鳥好きのためのワンストップショップ", "type": "text"}]}]}}', NULL, 'かわいい小鳥の世界 - あなたの愛鳥ライフをサポート', NULL, '野鳥観察から飼育まで、すべての鳥好きのためのワンストップショップ。500種類以上の野鳥データベース、撮影ガイド、飼育用品販売。', NULL, 'home', true, '2025-09-15 15:49:39.024+09', '2025-09-15 14:52:18.479+09', 'published');
INSERT INTO public.pages (id, title, hero_type, hero_rich_text, hero_media_id, meta_title, meta_image_id, meta_description, published_at, slug, slug_lock, updated_at, created_at, _status) VALUES (4, 'わたしたちについて', 'lowImpact', '{"root": {"type": "root", "format": "", "indent": 0, "version": 1, "children": [{"tag": "h1", "type": "heading", "format": "center", "indent": 0, "version": 1, "children": [{"mode": "normal", "text": "🕊️ かわいい小鳥の世界について 🕊️", "type": "text", "style": "", "detail": 0, "format": 1, "version": 1}], "direction": "ltr"}], "direction": "ltr"}}', NULL, 'わたしたちについて - かわいい小鳥の世界', NULL, '日本と世界のかわいい小鳥たちの魅力を伝える、私たちのミッションとチームについて。', NULL, 'about-us', true, '2025-09-15 14:59:31.213+09', '2025-09-02 14:25:19.974+09', 'published');


--
-- Name: pages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pages_id_seq', 7, true);


--
-- PostgreSQL database dump complete
--

