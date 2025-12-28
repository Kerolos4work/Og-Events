'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, AlertCircle } from 'lucide-react';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { getOrderIds, removeOrderId } from '@/lib/orderIdsManager';
import { Button } from '@/components/ui/button';
import BookingsTable, { BookingData } from '@/components/bookings/BookingsTable';

export default function OrdersPage() {
    const { t } = useLanguageContext();
    const router = useRouter();
    const [bookings, setBookings] = useState<BookingData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const goBack = () => {
        router.push('/');
    };

    const handleDownloadSeparateTickets = async (bookingId: string) => {
        setProcessingId(bookingId);
        setError(null);

        try {
            const { downloadSeparateTickets } = await import('@/lib/pdf-utils');
            await downloadSeparateTickets(bookingId);
        } catch (err: any) {
            setError(err.message || 'Failed to download separate tickets');
            console.error('Error downloading separate tickets:', err);
        } finally {
            setProcessingId(null);
        }
    };

    useEffect(() => {
        const orderIds = getOrderIds();
        console.log('Order IDs from localStorage:', orderIds);

        if (orderIds.length > 0) {
            const validateAndFetchBookings = async () => {
                try {
                    const validateResponse = await fetch('/api/validate-order-ids', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ orderIds }),
                    });

                    if (validateResponse.ok) {
                        const validateData = await validateResponse.json();
                        console.log('Validation response:', validateData);

                        if (validateData.invalidIds && validateData.invalidIds.length > 0) {
                            console.log('Removing invalid IDs:', validateData.invalidIds);
                            validateData.invalidIds.forEach((id: string) => removeOrderId(id));
                        }

                        if (validateData.allBookings) {
                            setBookings(validateData.allBookings);
                        }
                    } else {
                        const errorData = await validateResponse.json();
                        console.error('Validation error:', errorData);
                        setError(`Failed to validate order IDs: ${errorData.error || 'Unknown error'}`);
                    }
                } catch (err) {
                    setError('An unexpected error occurred');
                    console.error('Error validating and fetching bookings:', err);
                } finally {
                    setIsLoading(false);
                }
            };

            validateAndFetchBookings();
        } else {
            setIsLoading(false);
        }
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="text-center p-8">
                    <div className="relative mx-auto w-16 h-16 mb-6">
                        <div className="absolute inset-0 rounded-full bg-indigo-100 dark:bg-indigo-900/30"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 animate-spin"></div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium">{t('loadingYourOrders')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6 lg:p-8">
            <div className="max-w-full mx-auto">
                {/* Header */}
                <div className="mb-8 md:flex md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <ShoppingBag className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('myOrders')}</h1>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 ml-11 max-w-2xl">
                            {t('myOrdersDescription')}
                        </p>
                    </div>
                    <Button variant="outline" onClick={goBack} className="rounded-full px-6 shadow-sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t('backToHome')}
                    </Button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30 flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="font-medium text-red-800 dark:text-red-200">{t('errorLoadingOrders')}</p>
                            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!error && (!bookings || bookings.length === 0) ? (
                    <div className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm overflow-hidden rounded-xl">
                        <div className="pt-12 pb-12 text-center">
                            <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-700/30 rounded-full flex items-center justify-center mb-6">
                                <ShoppingBag className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                            </div>
                            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2">{t('noOrders') || 'No orders found'}</h2>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                {t('noOrdersDescription') || 'You have no orders yet. Make a booking to see it here.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="px-6 py-4 bg-white dark:bg-slate-800 rounded-t-xl border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t('yourOrders') || 'Your Orders'}</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{t('ordersDescription') || 'View and manage your ticket orders'}</p>
                        </div>
                        <BookingsTable
                            bookings={bookings}
                            processingId={processingId}
                            onDownloadSeparateTickets={handleDownloadSeparateTickets}
                            showStatusColumn={true}
                            showPaymentProofColumn={false}
                            showCustomerActions={false}
                            showDownloadActions={true}
                            t={t}
                            currency={t('currency')}
                            showFilterSection={false}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
