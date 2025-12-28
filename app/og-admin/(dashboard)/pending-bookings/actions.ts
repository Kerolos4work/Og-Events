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
 * Fetch all bookings with null or pending status that have payment proof uploaded
 */
export async function getPendingBookingsWithImages(): Promise<{
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
      .in('status', ['pending', null])
      .not('image', 'is', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending bookings with images:', error);
      return { data: null, error: error.message };
    }

    return { data: data as unknown as BookingData[], error: null };
  } catch (err: any) {
    console.error('Unexpected error fetching pending bookings with images:', err);
    return { data: null, error: err.message || 'An unexpected error occurred' };
  }
}
