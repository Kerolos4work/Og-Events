import React, { Suspense } from 'react';
import PaymentClient from './PaymentClient';
import LoadingState from './components/LoadingState';

async function PaymentContent({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  return <PaymentClient bookingId={bookingId} />;
}

export default function PaymentUploadPage({ params }: { params: Promise<{ bookingId: string }> }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <PaymentContent params={params} />
    </Suspense>
  );
}


