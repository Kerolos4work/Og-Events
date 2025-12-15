'use server';

import { redirect } from 'next/navigation';

export async function goToSettings() {
  redirect('/og-admin/settings');
}

export async function logout() {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
