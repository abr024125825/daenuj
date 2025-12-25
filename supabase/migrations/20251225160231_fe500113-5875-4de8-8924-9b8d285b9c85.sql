-- Add check_out_time column to attendance table
ALTER TABLE public.attendance
ADD COLUMN check_out_time timestamp with time zone DEFAULT NULL;