"use server";

import { createClient } from "@/lib/supabase/server";

// Get the venue ID - you may need to adjust this based on your app logic
const VENUE_ID = "6667da4b-66e0-4d85-ba78-d65ed67dc85c";

export async function getCategorySettings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('venues')
    .select('categories')
    .eq('id', VENUE_ID)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Extract visibility from categories JSON
  const settings: Record<string, boolean> = {};
  if (data && data.categories) {
    data.categories.forEach((category: any) => {
      settings[category.name] = category.isVisible !== false; // Default to true if not specified
    });
  }

  return settings;
}

export async function saveCategorySettings(settings: Record<string, boolean>) {
  const supabase = await createClient();

  // Get current categories
  const { data: venueData, error: fetchError } = await supabase
    .from('venues')
    .select('categories')
    .eq('id', VENUE_ID)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  // Update categories with new visibility settings
  const updatedCategories = venueData.categories.map((category: any) => ({
    ...category,
    isVisible: settings[category.name] !== false // Default to true if not specified
  }));

  // Update the venue with new categories
  const { error } = await supabase
    .from('venues')
    .update({ categories: updatedCategories })
    .eq('id', VENUE_ID);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}
