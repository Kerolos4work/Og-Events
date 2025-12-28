import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getBookedOrders, BookingData } from './actions';
import BookingsTable from '@/components/bookings/BookingsTable';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { isAuthorizedAdmin } from '@/lib/admin';
import BookingsTableClient from './BookingsTableClient';

async function goBackToDashboard() {
  'use server';
  redirect('/og-admin');
}

async function BookedOrdersContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, redirect to login
  if (!user) {
    redirect('/auth/login');
  }

  // Check if the user is an authorized admin
  if (!isAuthorizedAdmin(user.email)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/70 backdrop-blur-sm dark:bg-slate-800/70">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">Access Denied</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300 mt-2">
              You are not authorized to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-2 pb-6">
            <form action={goBackToDashboard}>
              <Button type="submit" variant="outline" className="rounded-full px-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch booked orders
  const { data: bookings, error } = await getBookedOrders();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6 lg:p-8">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8 md:flex md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Approved Bookings</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-300 ml-11 max-w-2xl">
              View and download HTML tickets for all approved bookings
            </p>
          </div>
          <form action={goBackToDashboard}>
            <Button variant="outline" type="submit" className="rounded-full px-6 shadow-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-0 shadow-lg bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm overflow-hidden">
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">Error loading bookings</p>
                <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!error && (!bookings || bookings.length === 0) ? (
          <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm overflow-hidden">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-700/30 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-12 w-12 text-slate-400 dark:text-slate-500" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2">No approved bookings</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Approved bookings will appear here when customers complete their payment and it's approved
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Approved Bookings</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">View and download tickets for all approved bookings</p>
            </div>
            <BookingsTableClient 
              bookings={bookings || []}
              showStatusColumn={false}
              showPaymentProofColumn={false}
              showCustomerActions={false}
              showDownloadActions={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default async function BookedOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="text-center p-8">
            <div className="relative mx-auto w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full bg-green-100 dark:bg-green-900/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-green-200 dark:border-green-800 border-t-green-600 dark:border-t-green-400 animate-spin"></div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">Loading approved bookings...</p>
          </div>
        </div>
      }
    >
      <BookedOrdersContent />
    </Suspense>
  );
}
