import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import PaymentClient from './PaymentClient';
import LoadingState from './components/LoadingState';
import { getBookingStatus } from '@/lib/database'; // Assuming you have a database utility

async function PaymentContent({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  
  // Check booking status
  try {
    const status = await getBookingStatus(bookingId);
    
    // If status is not pending, redirect to seat map
    if (status !== 'pending') {
      // We need to create a client component to handle localStorage removal
      // We'll pass this information to the PaymentClient component
      return <PaymentClient bookingId={bookingId} shouldRedirect={true} />;
    }
    
    return <PaymentClient bookingId={bookingId} shouldRedirect={false} />;
  } catch (error) {
    console.error('Error checking booking status:', error);
    // If there's an error, redirect to seat map
    return <PaymentClient bookingId={bookingId} shouldRedirect={true} />;
  }
}

export default function PaymentUploadPage({ params }: { params: Promise<{ bookingId: string }> }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <PaymentContent params={params} />
    </Suspense>
  );
}


