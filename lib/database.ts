import { supabase } from './supabase';

/**
 * Fetches the status of a booking by its ID
 * @param bookingId - The ID of the booking to check
 * @returns The status of the booking or null if not found
 */
export async function getBookingStatus(bookingId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .single();

    if (error) {
      // Check if error is just an empty object
      if (error && Object.keys(error).length > 0) {
        console.error('Error fetching booking status:', error);
      }
      return null;
    }

    return data?.status || null;
  } catch (error) {
    console.error('Unexpected error fetching booking status:', error);
    return null;
  }
}
