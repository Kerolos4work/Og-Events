import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { orderIds } = await request.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order IDs are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bookings')
      .select(`
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
          rows (
            row_number,
            zones (
              name
            )
          )
        )
      `)
      .in('id', orderIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      bookings: data,
      error: null 
    });
  } catch (err: any) {
    console.error('Unexpected error fetching bookings:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
