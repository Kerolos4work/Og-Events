import { supabase } from '@/lib/supabase';
import { MapData, Category, Seat } from './types';
import { getVenueCategories } from '@/actions/venue-categories';

export const fetchVenueMap = async (planId: string): Promise<MapData | null> => {
  // Check if Supabase client is properly initialized
  if (!supabase) {
    console.error('Supabase client is not initialized');
    return null;
  }

  // Check if planId is valid
  if (!planId) {
    console.error('Invalid planId:', planId);
    return null;
  }

  // 1. Fetch the Plan
  const { data: plan, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', planId)
    .maybeSingle(); // Use maybeSingle() instead of single() to handle no results

  if (error) {
    console.error('Error fetching venue:', JSON.stringify(error));
    console.error('Error details:', error.message, error.hint, error.details);
    return null;
  }

  if (!plan) {
    console.error('No venue found with ID:', planId);
    return null;
  }

  // 2. Get filtered categories based on visibility settings
  const visibleCategories = await getVenueCategories();

  // 3. Fetch the full hierarchy (Zones -> Rows -> Seats)
  // Supabase allows deep nesting queries
  const { data: zones, error: zonesError } = await supabase
    .from('zones')
    .select(
      `
      *,
      areas(*),
      rows(
        *,
        seats(*)
      )
    `
    )
    .eq('venue_id', planId);

  if (zonesError) {
    console.error('Error fetching zones:', zonesError);
    return null;
  }

  // Even if zones is empty, we still want to return the map data
  return {
    ...plan,
    zones: zones || [],
    categories: visibleCategories // Use only visible categories
  };
};

export const createGuestBooking = async (
  seatIds: string[],
  name: string,
  email: string,
  phone: string,
  amount: number,
  paymentProofUrl: string | null = null
) => {
  // Call the book_seats function with the payment proof
  const { data, error } = await supabase.rpc('book_seats', {
    p_seat_ids: seatIds,
    p_name: name,
    p_email: email,
    p_phone: phone,
    p_amount: amount,
    p_image: paymentProofUrl,
  });

  return { data, error };
};

export const subscribeToSeatUpdates = (onUpdate: (seat: Seat) => void) => {
  const seatsSubscription = supabase
    .channel('seat-map-updates') // Define a unique channel name
    .on(
      'postgres_changes',
      {
        event: 'UPDATE', // We only care when the seat status is updated
        schema: 'public',
        table: 'seats',
      },
      payload => {
        // payload.new contains the updated row data (e.g., status: 'booked')
        onUpdate(payload.new as unknown as Seat);
      }
    )
    .subscribe(); // Start listening

  return seatsSubscription;
};

export const unsubscribeFromSeatUpdates = (subscription: any) => {
  supabase.removeChannel(subscription);
};

export const updateBookingWithPayment = async (bookingId: string, imageUrl: string | null) => {
  const { data, error } = await supabase.rpc('update_booking_with_payment', {
    p_booking_id: bookingId,
    p_image: imageUrl,
  });

  return { data, error };
};
