
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useBookingDetails = (bookingId: string) => {
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    const fetchBookingDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(
            `
            *,
            seats (
              id,
              seat_number,
              status,
              category,
              name_on_ticket,
              rows (
                row_number,
                zones (
                  name,
                  venue_id
                )
              )
            )
          `
          )
          .eq('id', bookingId)
          .single();

        if (error) {
          setError('Failed to fetch booking details');
          console.error(error);
          return;
        }

        // Fetch venue categories if we have seats
        if (data?.seats && data.seats.length > 0) {
          const venueId = data.seats[0].rows.zones.venue_id;
          const { data: venueData, error: venueError } = await supabase
            .from('venues')
            .select('categories')
            .eq('id', venueId)
            .single();

          if (!venueError && venueData) {
            data.categories = venueData.categories;
          }
        }

        setBookingDetails(data);
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  return { bookingDetails, loading, error };
};
