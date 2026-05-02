-- Rename mux_playback_id to video_id to reflect Cloudflare Stream integration
ALTER TABLE public.lessons RENAME COLUMN mux_playback_id TO video_id;
