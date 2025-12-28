/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
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

    // State for seat names - must be declared before usePaymentSubmission
    const [seatNames, setSeatNames] = useState<Record<string, string>>({});

    const {
        file,
        isUploading,
        isConverting,
        error: submissionError,
        success,
        handleFileChange,
        handleSubmit,
        updateSeatNamesInDB
    } = usePaymentSubmission(bookingId, seatNames);

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

    // Initialize seat names from booking details
    useEffect(() => {
        if (bookingDetails?.seats) {
            const initialNames: Record<string, string> = {};

            // Define category order for sorting (same as SeatNamesList and OrdersPage)
            const CATEGORY_ORDER = ['Front', 'Center', 'Top'];

            // Sort seats to identify the first one deterministically
            const sortedSeats = [...bookingDetails.seats].sort((a: any, b: any) => {
                // 1. Sort by Category
                const catOrderA = CATEGORY_ORDER.indexOf(a.category);
                const catOrderB = CATEGORY_ORDER.indexOf(b.category);

                const validOrderA = catOrderA === -1 ? 999 : catOrderA;
                const validOrderB = catOrderB === -1 ? 999 : catOrderB;

                if (validOrderA !== validOrderB) {
                    return validOrderA - validOrderB;
                }

                // 2. Sort by Row Number
                const rowA = parseInt(a.rows.row_number) || 0;
                const rowB = parseInt(b.rows.row_number) || 0;

                if (rowA !== rowB) {
                    return rowA - rowB;
                }

                // 3. Sort by Seat Number
                const seatA = parseInt(a.seat_number) || 0;
                const seatB = parseInt(b.seat_number) || 0;

                return seatA - seatB;
            });

            sortedSeats.forEach((seat: any, index: number) => {
                if (seat.name_on_ticket) {
                    initialNames[seat.id] = seat.name_on_ticket;
                } else if (index === 0 && bookingDetails.name) {
                    // Pre-fill the first seat with the booking owner's name if empty
                    initialNames[seat.id] = bookingDetails.name;
                }
            });
            setSeatNames(initialNames);
        }
    }, [bookingDetails]);

    // Handle seat name changes
    const handleSeatNameChange = (seatId: string, name: string) => {
        setSeatNames(prev => ({ ...prev, [seatId]: name }));
    };

    // Check if all seat names are filled
    const allNamesFilled = useMemo(() => {
        if (!bookingDetails?.seats) return true;
        return bookingDetails.seats.every((seat: any) => {
            const name = seatNames[seat.id];
            return name && name.trim().length > 0;
        });
    }, [bookingDetails, seatNames]);

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
            seatNames={seatNames}
            onSeatNameChange={handleSeatNameChange}
            allNamesFilled={allNamesFilled}
            onUpdateSeatNames={updateSeatNamesInDB}
        />
    );
}
