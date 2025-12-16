import { createClient } from '@supabase/supabase-js';

export const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-key'
);
