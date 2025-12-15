"use server";

import { createClient } from "@/lib/supabase/server";

// Get the venue ID - you may need to adjust this based on your app logic
const VENUE_ID = "622637ae-480d-4fc2-9316-30d15f074af7";

export async function getVenueCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('venues')
    .select('categories')
    .eq('id', VENUE_ID)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Return categories filtered by visibility
  if (data && data.categories) {
    return data.categories.filter((category: any) => category.isVisible !== false);
  }

  return [];
}
