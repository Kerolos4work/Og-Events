"use server";

import { createClient } from "@/lib/supabase/server";

export async function getSeats() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('seats')
    .select(`
      id,
      seat_number,
      category,
      status,
      rows (
        row_number,
        zones (
          name
        )
      )
    `)
    .order('seat_number');

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}
