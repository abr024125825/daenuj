-- Fix: Postgres policies do not support IF NOT EXISTS. Use guarded DO blocks.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Admins can update any profile'
  ) THEN
    CREATE POLICY "Admins can update any profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::user_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Admins can insert profiles'
  ) THEN
    CREATE POLICY "Admins can insert profiles"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));
  END IF;
END $$;