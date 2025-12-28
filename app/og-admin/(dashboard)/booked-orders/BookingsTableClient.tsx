'use client';

import { useState, useTransition } from 'react';
import BookingsTable from '@/components/bookings/BookingsTable';
import { BookingData } from './actions';
import { generateAndDownloadTickets, generateAndDownloadSeparateTickets } from './client-actions';
import { useLanguageContext } from '@/contexts/LanguageContext';

interface BookingsTableClientProps {
  bookings: BookingData[];
  showStatusColumn?: boolean;
  showPaymentProofColumn?: boolean;
  showCustomerActions?: boolean;
  showDownloadActions?: boolean;
}

export default function BookingsTableClient({
  bookings,
  showStatusColumn = false,
  showPaymentProofColumn = false,
  showCustomerActions = false,
  showDownloadActions = true,
}: BookingsTableClientProps) {
  const { t } = useLanguageContext();
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleDownloadTickets = async (bookingId: string) => {
    setProcessingId(bookingId);

    startTransition(async () => {
      const result = await generateAndDownloadTickets(bookingId);

      if (!result.success) {
        console.error('Failed to download tickets:', result.error);
      }

      setProcessingId(null);
    });
  };

  const handleDownloadSeparateTickets = async (bookingId: string) => {
    setProcessingId(bookingId);

    startTransition(async () => {
      const result = await generateAndDownloadSeparateTickets(bookingId);

      if (!result.success) {
        console.error('Failed to download separate tickets:', result.error);
      }

      setProcessingId(null);
    });
  };

  return (
    <BookingsTable
      bookings={bookings}
      processingId={processingId}
      onDownloadTickets={handleDownloadTickets}
      onDownloadSeparateTickets={handleDownloadSeparateTickets}
      showStatusColumn={showStatusColumn}
      showPaymentProofColumn={showPaymentProofColumn}
      showCustomerActions={showCustomerActions}
      showDownloadActions={showDownloadActions}
      t={t}
      currency={t('currency')}
    />
  );
}
