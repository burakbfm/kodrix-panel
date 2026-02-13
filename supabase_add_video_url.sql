-- Add video_url column to lessons table if it doesn't exist
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS video_url text;

-- Optional: Move data from meeting_link to video_url if it looks like a youtube link (legacy data fix)
-- UPDATE public.lessons 
-- SET video_url = meeting_link, 
--     meeting_link = NULL 
-- WHERE meeting_link ILIKE '%youtube%' OR meeting_link ILIKE '%youtu.be%';
