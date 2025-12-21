
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { X, AlertCircle, Hash, Calendar, Clock, User, Mail, Phone, DollarSign, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import { BookingData } from './actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface OrdersTableProps {
  bookings: BookingData[];
  onCancelOrder: (bookingId: string) => Promise<void>;
  isDarkMode: boolean;
}

export default function OrdersTable({ bookings, onCancelOrder, isDarkMode }: OrdersTableProps) {
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const getSeatsList = (seats?: BookingData['seats']) => {
    if (!seats) return '';
    return seats
      .map(
        seat => `${seat.rows.zones.name} - Row ${seat.rows.row_number} - Seat ${seat.seat_number}`
      )
      .join(', ');
  };

  const handleCancelOrder = async (bookingId: string) => {
    setProcessingId(bookingId);
    setError(null);

    startTransition(async () => {
      await onCancelOrder(bookingId);
      setProcessingId(null);
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

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30 flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="font-medium text-red-800 dark:text-red-200">Error</p>
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-indigo-100 dark:border-indigo-800/30">
                <TableHead className="w-[220px] font-semibold text-slate-700 dark:text-slate-200">ID & Date</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Customer Info</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Seats</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Amount</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-200">Status</TableHead>
                <TableHead className="w-[150px] text-right font-semibold text-slate-700 dark:text-slate-200">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map(booking => (
                <TableRow key={booking.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-900/10 dark:hover:to-purple-900/10 transition-all duration-200 shadow-sm hover:shadow-md">
                  <TableCell className="font-medium">
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
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">{booking.amount}</span>
                      <span className="text-sm text-green-600 dark:text-green-400">EGP</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(booking.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={() => handleCancelOrder(booking.id)}
                        disabled={isPending && processingId === booking.id}
                        className="h-8 px-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-sm transition-all duration-200"
                        size="sm"
                      >
                        {processingId === booking.id && isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
