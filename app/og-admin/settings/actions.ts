import { redirect } from 'next/navigation';

export async function updateSettings(formData: FormData) {
  'use server';
  // Here you would typically update settings in your database
  // This is just a placeholder implementation
  console.log('Settings updated:', Object.fromEntries(formData));
  redirect('/og-admin/settings?success=true');
}

export async function goToDashboard() {
  'use server';
  redirect('/og-admin');
}

export async function logout() {
  'use server';
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
