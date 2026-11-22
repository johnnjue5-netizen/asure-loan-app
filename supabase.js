
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://odtoybyfelvidkwyyakf.supabase.co';

const SUPABASE_ANON_KEY = 'sb_publishable_UESMdlgzN1TLwkkMMMCHEA_X5BrfUgm';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
