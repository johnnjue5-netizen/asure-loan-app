
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hyblaajzjgykogevskrl.supabase.co';

const SUPABASE_ANON_KEY = 'PASTE_THE_ACTUAL_HY_PROJECT_KEY_HERE';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
