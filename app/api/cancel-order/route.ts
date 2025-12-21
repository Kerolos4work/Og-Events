import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Update booking status to 'cancelled'
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (bookingError) {
      console.error('Error cancelling booking:', bookingError);
      return NextResponse.json({ success: false, error: bookingError.message }, { status: 500 });
    }

    // 2. Release all seats (set booking_id to null and status to 'available')
    const { error: seatsError } = await supabase
      .from('seats')
      .update({
        booking_id: null,
        status: 'available',
      })
      .eq('booking_id', bookingId);

    if (seatsError) {
      console.error('Error releasing seats:', seatsError);
      // Rollback booking status
      await supabase.from('bookings').update({ status: 'pending' }).eq('id', bookingId);
      return NextResponse.json({ success: false, error: seatsError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Booking cancelled successfully',
      error: null 
    });
  } catch (err: any) {
    console.error('Unexpected error cancelling booking:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
