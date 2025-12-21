'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, AlertCircle, CheckCircle, Hash, Calendar, Clock, User, Mail, Phone, DollarSign, MapPin, X, Loader2, Download, FileText } from 'lucide-react';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { getOrderIds, removeOrderId } from '@/lib/orderIdsManager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BookingData {
  id: string;
  name: string;
  email: string;
  phone: string;
  amount: number;
  image: string | null;
  status: string;
  created_at: string;
  seats: Array<{
    id: string;
    seat_number: string;
    category: string;
    status: string;
    rows: {
      row_number: string;
      zones: {
        name: string;
      };
    };
  }>;
}

export default function OrdersPage() {
  const { t, isRTL, language } = useLanguageContext();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const goBack = () => {
    router.push('/');
  };

  const handleCancelOrder = async (bookingId: string) => {
    setProcessingId(bookingId);
    setError(null);

    try {
      // Call cancel order API
      const response = await fetch('/api/cancel-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId }),
      });

      if (response.ok) {
        // Remove order ID from localStorage
        removeOrderId(bookingId);

        // Update bookings state to remove cancelled order
        setBookings(prevBookings => prevBookings.filter(booking => booking.id !== bookingId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to cancel order');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error cancelling order:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownloadTickets = async (bookingId: string) => {
    setProcessingId(bookingId);
    setError(null);

    try {
      const response = await fetch('/api/generate-tickets-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate tickets');
      }

      // Get the HTML content from the response
      const htmlContent = await response.text();

      // Create a blob from the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element and click it to download the tickets
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets-${bookingId.substring(0, 8)}.html`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 0);
    } catch (err: any) {
      setError(err.message || 'Failed to download tickets');
      console.error('Error downloading tickets:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownloadSeparateTickets = async (bookingId: string) => {
    setProcessingId(bookingId);
    setError(null);

    try {
      // Import the utility function
      const { downloadSeparateTickets } = await import('@/lib/pdf-utils');

      // Call the utility function to download separate tickets
      await downloadSeparateTickets(bookingId);
    } catch (err: any) {
      setError(err.message || 'Failed to download separate tickets');
      console.error('Error downloading separate tickets:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 shadow-sm">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-300 shadow-sm">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="shadow-sm">
            <AlertCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="shadow-sm">
            {status}
          </Badge>
        );
    }
  };

  useEffect(() => {
    // Check for dark mode preference
    const darkModePreference = localStorage.getItem('darkMode');
    setIsDarkMode(darkModePreference === 'true');

    // Get order IDs from localStorage
    const orderIds = getOrderIds();
    console.log('Order IDs from localStorage:', orderIds);

    if (orderIds.length > 0) {
      // Validate order IDs and remove any that don't exist in the database
      const validateAndFetchBookings = async () => {
        try {
          // Call the validation API
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

            // Remove invalid IDs from localStorage
            if (validateData.invalidIds && validateData.invalidIds.length > 0) {
              console.log('Removing invalid IDs:', validateData.invalidIds);
              validateData.invalidIds.forEach((id: string) => removeOrderId(id));
            }

            // Set the bookings data
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
          <p className="text-slate-600 dark:text-slate-300 font-medium">{t('loading') || 'Loading your orders...'}</p>
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
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('myOrders') || 'My Orders'}</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300 ml-11 max-w-2xl">
              {t('myOrdersDescription') || 'View and manage your ticket orders'}
            </p>
          </div>
          <Button variant="outline" onClick={goBack} className="rounded-full px-6 shadow-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToHome') || 'Back to Home'}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30 flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">Error loading orders</p>
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
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t('yourOrders') || 'Your Orders'}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{t('ordersDescription') || 'View and manage your ticket orders'}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-indigo-100 dark:border-indigo-800/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700 dark:text-slate-200">ID & Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700 dark:text-slate-200">Customer Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700 dark:text-slate-200">Seats</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700 dark:text-slate-200">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700 dark:text-slate-200">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-700 dark:text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {bookings.map(booking => (
                    <tr key={booking.id} className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-900/10 dark:hover:to-purple-900/10 transition-all duration-200 shadow-sm hover:shadow-md">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded">
                              <Hash className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="text-sm font-medium">#{booking.id.substring(0, 8)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded">
                              <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            {formatDate(booking.created_at)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded">
                              <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            {formatTime(booking.created_at)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                              <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                            </div>
                            <p className="font-medium">{booking.name}</p>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                              <Mail className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                            </div>
                            <span className="truncate">{booking.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                              <Phone className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                            </div>
                            <span>{booking.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                            <span className="text-sm font-medium">Seats ({booking.seats?.length || 0})</span>
                          </div>
                          <ul className="ml-6 space-y-1">
                            {booking.seats?.map((seat, index) => (
                              <li key={index} className="text-sm text-slate-600 dark:text-slate-300">
                                {seat.rows.zones.name} - Row {seat.rows.row_number} - Seat {seat.seat_number}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-green-600 dark:text-green-400">{booking.amount}</span>
                          <span className="text-sm text-green-600 dark:text-green-400">EGP</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2 justify-end">
                          {booking.status === 'approved' ? (
                            <>
                              <Button
                                onClick={() => handleDownloadTickets(booking.id)}
                                disabled={processingId === booking.id}
                                className="h-8 px-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-sm transition-all duration-200"
                                size="sm"
                              >
                                {processingId === booking.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4 mr-1" />
                                )}
                                {processingId === booking.id ? 'HTML...' : 'HTML'}
                              </Button>
                              <Button
                                onClick={() => handleDownloadSeparateTickets(booking.id)}
                                disabled={processingId === booking.id}
                                className="h-8 px-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-sm transition-all duration-200"
                                size="sm"
                              >
                                {processingId === booking.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <FileText className="h-4 w-4 mr-1" />
                                )}
                                {processingId === booking.id ? 'PDFs...' : 'PDFs'}
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => handleCancelOrder(booking.id)}
                              disabled={processingId === booking.id}
                              className="h-8 px-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-sm transition-all duration-200"
                              size="sm"
                            >
                              {processingId === booking.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
