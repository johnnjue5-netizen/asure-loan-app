
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hyblaajzjgykogevskrl.supabase.co';

const SUPABASE_ANON_KEY = 'PASTE_NEW_HY_PROJECT_PUBLISHABLE_KEY';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
