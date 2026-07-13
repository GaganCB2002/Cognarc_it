-- Run this SQL in Supabase SQL Editor AFTER deploying the Prisma schema.
-- It creates a trigger that auto-syncs auth.users -> public."User"

-- 1. Create the sync function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, role, "isApproved", "emailVerified")
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'name',
      NEW.raw_user_meta_data ->> 'full_name',
      split_part(NEW.email, '@', 1)
    ),
    'STUDENT',
    TRUE,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Sync existing auth users (run once)
INSERT INTO public."User" (id, email, name, role, "isApproved", "emailVerified")
SELECT
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data ->> 'name',
    au.raw_user_meta_data ->> 'full_name',
    split_part(au.email, '@', 1)
  ),
  'STUDENT',
  TRUE,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public."User" u WHERE u.id = au.id);
