'use server';

import { createClient } from '@/lib/supabase/server';
import { BookingStatus } from '@/types/booking';

export interface BookingData {
  id: string;
  name: string;
  email: string;
  phone: string;
  amount: number;
  image: string | null;
  status: BookingStatus;
  created_at: string;
  seats: Array<{
    id: string;
    seat_number: string;
    category: string;
    status: string;
    name_on_ticket: string | null;
    rows: {
      row_number: string;
      zones: {
        name: string;
      };
    };
  }>;
}

/**
 * Fetch all bookings with 'booked' status
 */
export async function getBookedOrders(): Promise<{
  data: BookingData[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        id,
        name,
        email,
        phone,
        amount,
        image,
        status,
        created_at,
        seats (
          id,
          seat_number,
          category,
          status,
          name_on_ticket,
          rows (
            row_number,
            zones (
              name
            )
          )
        )
      `
      )
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching booked orders:', error);
      return { data: null, error: error.message };
    }

    return { data: data as unknown as BookingData[], error: null };
  } catch (err: any) {
    console.error('Unexpected error fetching booked orders:', err);
    return { data: null, error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Fetch ticket template from database
 */
export async function getTicketTemplate(
  category: string
): Promise<{ data: any | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // First, get the venue data to find the category
    const { data: venuesData, error: venuesError } = await supabase
      .from('venues')
      .select('categories')
      .limit(1);

    if (venuesError) {
      console.error('Error fetching venues:', venuesError);
      return { data: null, error: venuesError.message };
    }

    if (!venuesData || venuesData.length === 0) {
      return { data: null, error: 'No venue data found' };
    }

    // Find the category in the venues data
    const categories = venuesData[0].categories || [];
    const categoryData = categories.find((cat: any) => cat.name === category);

    if (!categoryData || !categoryData.template) {
      return { data: null, error: 'No template found for this category' };
    }

    return { data: categoryData.template, error: null };
  } catch (err: any) {
    console.error('Unexpected error fetching ticket template:', err);
    return { data: null, error: err.message || 'An unexpected error occurred' };
  }
}
