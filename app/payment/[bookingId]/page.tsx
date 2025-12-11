/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect } from 'react';
import { savePendingBooking } from '@/lib/booking-redirect';
import { useCountdown } from './hooks/useCountdown';
import { useBookingDetails } from './hooks/useBookingDetails';
import { usePaymentSubmission } from './hooks/usePaymentSubmission';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import SuccessState from './components/SuccessState';
import PaymentPage from './components/PaymentPage';

export default function PaymentUploadPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = React.use(params);

  // Initialize hooks
  const { bookingDetails, loading: detailsLoading, error: detailsError } = useBookingDetails(bookingId);
  const { timeLeft, formattedTime, isExpired } = useCountdown(bookingDetails?.created_at || null);
  const {
    file,
    isUploading,
    isConverting,
    error: submissionError,
    success,
    handleFileChange,
    handleSubmit
  } = usePaymentSubmission(bookingId);

  // Save booking ID to localStorage when component mounts
  useEffect(() => {
    if (bookingId) {
      savePendingBooking(bookingId);
    }
  }, [bookingId]);

  // Handle loading state
  if (!bookingId || detailsLoading) {
    return <LoadingState />;
  }

  // Handle error state
  const error = detailsError || (isExpired ? 'Time expired. Your booking has been released.' : submissionError);
  if (error && !success) {
    // Remove saved booking ID if the booking is expired or invalid
    if (isExpired || detailsError) {
      localStorage.removeItem('pendingBooking');
    }
    return <ErrorState error={error} />;
  }

  // Handle success state
  if (success) {
    return <SuccessState />;
  }

  // Main payment page with unified component
  return (
    <PaymentPage
      bookingId={bookingId}
      bookingDetails={bookingDetails}
      timeLeft={timeLeft}
      formattedTime={formattedTime}
      file={file}
      isUploading={isUploading}
      isConverting={isConverting}
      handleFileChange={handleFileChange}
      handleSubmit={handleSubmit}
    />
  );
}