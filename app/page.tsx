'use client';

import { SeatMap } from '@/components/seat-map';
import { usePendingBookingRedirect } from '@/lib/booking-redirect';
import { useEffect } from 'react';

export default function Home() {
  // Check for pending bookings and redirect if needed
  usePendingBookingRedirect();
  
  // Using the specific plan ID
  const planId = '6667da4b-66e0-4d85-ba78-d65ed67dc85c';

  return (
    <div className="w-full h-screen overflow-hidden">
      <SeatMap planId={planId} />
    </div>
  );
}
