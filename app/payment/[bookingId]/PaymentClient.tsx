/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { savePendingBooking } from '@/lib/booking-redirect';
import { useCountdown } from './hooks/useCountdown';
import { useBookingDetails } from './hooks/useBookingDetails';
import { usePaymentSubmission } from './hooks/usePaymentSubmission';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import SuccessState from './components/SuccessState';
import PaymentPage from './components/PaymentPage';
import { useLanguageContext } from '@/contexts/LanguageContext';

interface PaymentClientProps {
    bookingId: string;
    shouldRedirect?: boolean;
}

export default function PaymentClient({ bookingId, shouldRedirect = false }: PaymentClientProps) {
    const router = useRouter();
    // Initialize hooks
    const { t } = useLanguageContext();
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

    // Handle redirection if needed
    useEffect(() => {
        if (shouldRedirect) {
            // Remove pending booking from localStorage
            localStorage.removeItem('pendingBooking');
            // Redirect to seat map
            router.push('/');
            return;
        }
        
        // Save booking ID to localStorage when component mounts
        if (bookingId) {
            savePendingBooking(bookingId);
        }
    }, [bookingId, shouldRedirect, router]);

    // Handle loading state
    if (!bookingId || detailsLoading) {
        return <LoadingState />;
    }

    // Handle error state
    const error = detailsError || (isExpired ? t('bookingExpired') : submissionError);
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
