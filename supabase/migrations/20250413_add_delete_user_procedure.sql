
-- Create a stored procedure to delete a user account
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user ID from the authenticated user
  user_id := auth.uid();
  
  -- Delete user data from the subscriptions table
  DELETE FROM public.subscriptions WHERE user_id = delete_user.user_id;
  
  -- Delete user data from the usage table
  DELETE FROM public.usage WHERE user_id = delete_user.user_id;
  
  -- Add more tables as needed
  
  -- The user record in auth.users will be preserved, but can be deleted by an admin
  -- or through auth.users() if the function is executed with enough permissions
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;
