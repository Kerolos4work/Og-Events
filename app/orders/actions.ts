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
 * Fetch bookings by their IDs
 */
export async function getBookingsByIds(orderIds: string[]): Promise<{
  data: BookingData[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    if (orderIds.length === 0) {
      return { data: [], error: null };
    }

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
      .in('id', orderIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings by IDs:', error);
      return { data: null, error: error.message };
    }

    return { data: data as unknown as BookingData[], error: null };
  } catch (err: any) {
    console.error('Unexpected error fetching bookings by IDs:', err);
    return { data: null, error: err.message || 'An unexpected error occurred' };
  }
}
