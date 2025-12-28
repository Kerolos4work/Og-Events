import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { orderIds } = await request.json();
    console.log('Received order IDs:', orderIds);

    if (!orderIds || !Array.isArray(orderIds)) {
      return NextResponse.json({ error: 'Invalid order IDs' }, { status: 400 });
    }

    // Filter out invalid UUIDs first
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const validUuids = orderIds.filter(id => uuidRegex.test(id));
    const invalidUuids = orderIds.filter(id => !uuidRegex.test(id));

    console.log('Valid UUIDs:', validUuids);
    console.log('Invalid UUIDs:', invalidUuids);

    // Create Supabase client
    const supabase = await createClient();

    // Check which valid UUIDs exist in the database and get full booking data
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
          name_on_ticket,
          rows (
            row_number,
            zones (
              name
            )
          )
        )
      `)
      .in('id', validUuids);

    if (error) {
      console.error('Error checking order IDs:', error);
      return NextResponse.json({ error: `Failed to validate order IDs: ${error.message}` }, { status: 500 });
    }

    // Extract the IDs that exist in the database
    const existingIds = data.map(booking => booking.id);

    // Find UUIDs that are valid format but don't exist in the database
    const nonExistingUuids = validUuids.filter(id => !existingIds.includes(id));

    // Combine all invalid IDs (invalid format + valid format but not in DB)
    const allInvalidIds = [...invalidUuids, ...nonExistingUuids];

    console.log('IDs that exist in DB:', existingIds);
    console.log('Valid UUIDs not in DB:', nonExistingUuids);
    console.log('All invalid IDs:', allInvalidIds);

    return NextResponse.json({
      validIds: existingIds,
      invalidIds: allInvalidIds,
      allBookings: data
    });
  } catch (error) {
    console.error('Error validating order IDs:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
