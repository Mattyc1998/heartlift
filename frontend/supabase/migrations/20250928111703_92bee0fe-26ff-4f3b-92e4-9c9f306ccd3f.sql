-- Fix the profiles trigger to also populate email_address field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email_address)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'full_name',
    new.email
  );
  RETURN new;
END;
$function$;

-- Update existing profiles to have email addresses
UPDATE public.profiles 
SET email_address = (
  SELECT email 
  FROM auth.users 
  WHERE auth.users.id = profiles.user_id
)
WHERE email_address IS NULL;