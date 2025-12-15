"use server";

import { createClient } from "@/lib/supabase/server";

export async function getCategorySettings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('category_settings')
    .select('*');

  if (error) {
    throw new Error(error.message);
  }

  // Convert to a simple object with category_id as key and visibility as value
  const settings: Record<string, boolean> = {};
  if (data) {
    data.forEach(item => {
      settings[item.category_id] = item.is_visible;
    });
  }

  return settings;
}

export async function saveCategorySettings(settings: Record<string, boolean>) {
  const supabase = await createClient();

  // Delete existing settings
  await supabase
    .from('category_settings')
    .delete()
    .neq('id', 0); // Delete all rows

  // Insert new settings
  const settingsData = Object.entries(settings).map(([category_id, is_visible]) => ({
    category_id,
    is_visible
  }));

  const { error } = await supabase
    .from('category_settings')
    .insert(settingsData);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}
