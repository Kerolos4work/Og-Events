'use client';

import React, { useState, useMemo } from 'react';
import { Hash, Calendar, Clock, User, Mail, Phone, MapPin, CheckCircle, AlertCircle, Loader2, FileText, Download, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BookingSeat {
    id: string;
    seat_number: string;
    category: string;
    status: string;
    name_on_ticket: string | null;
    rows: {
        row_number: string;
        zones: {
            name: string;
        };
    };
}

export interface BookingData {
    id: string;
    name: string;
    email: string;
    phone: string;
    amount: number;
    image: string | null;
    status: string;
    created_at: string;
    seats: BookingSeat[];
}

interface BookingsTableProps {
    bookings: BookingData[];
    processingId: string | null;
    onDownloadTickets?: (bookingId: string) => void;
    onDownloadSeparateTickets?: (bookingId: string) => void;
    showStatusColumn?: boolean;
    showPaymentProofColumn?: boolean;
    onImageClick?: (imageUrl: string) => void;
    t?: (key: string, params?: any) => string;
    currency?: string;
    onApprove?: (bookingId: string) => void;
    onReject?: (bookingId: string) => void;
    showActions?: boolean;
    showDownloadActions?: boolean;
    showCustomerActions?: boolean;
    showAdvancedFiltersByDefault?: boolean;
    showFilterSection?: boolean;
}

const CATEGORY_ORDER = ['Front', 'Center', 'Top'];

const sortSeats = (seats: BookingSeat[]) => {
    return [...seats].sort((a, b) => {
        const catOrderA = CATEGORY_ORDER.indexOf(a.category);
        const catOrderB = CATEGORY_ORDER.indexOf(b.category);

        const validOrderA = catOrderA === -1 ? 999 : catOrderA;
        const validOrderB = catOrderB === -1 ? 999 : catOrderB;

        if (validOrderA !== validOrderB) {
            return validOrderA - validOrderB;
        }

        const rowA = parseInt(a.rows.row_number) || 0;
        const rowB = parseInt(b.rows.row_number) || 0;

        if (rowA !== rowB) {
            return rowA - rowB;
        }

        const seatA = parseInt(a.seat_number) || 0;
        const seatB = parseInt(b.seat_number) || 0;

        return seatA - seatB;
    });
};

export default function BookingsTable({
    bookings,
    processingId,
    onDownloadTickets,
    onDownloadSeparateTickets,
    showStatusColumn = true,
    showPaymentProofColumn = false,
    onImageClick,
    t = (key) => key,
    currency = 'EGP',
    onApprove,
    onReject,
    showActions = true,
    showDownloadActions = true,
    showCustomerActions = false,
    showAdvancedFiltersByDefault = false,
    showFilterSection = true
}: BookingsTableProps) {
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

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(showAdvancedFiltersByDefault);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [minSeats, setMinSeats] = useState('');
    const [maxSeats, setMaxSeats] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [phonePrefix, setPhonePrefix] = useState('');
    const [phoneContains, setPhoneContains] = useState('');
    const [seatOperator, setSeatOperator] = useState<'gte' | 'lte' | 'eq'>('gte');
    const [amountOperator, setAmountOperator] = useState<'gte' | 'lte' | 'eq'>('gte');
    const [presetFilter, setPresetFilter] = useState<string>('');

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 shadow-sm">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('approved')}
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-300 shadow-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        {t('pending')}
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="destructive" className="shadow-sm">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {t('rejected')}
                    </Badge>
                );
            case 'timeout':
                return (
                    <Badge variant="destructive" className="shadow-sm">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {t('timeout')}
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

    const filteredBookings = useMemo(() => {
        return bookings.filter(booking => {
            const matchesSearch =
                booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.phone.includes(searchTerm) ||
                booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.seats.some(seat =>
                    seat.name_on_ticket?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    seat.seat_number.includes(searchTerm) ||
                    seat.rows.zones.name.toLowerCase().includes(searchTerm.toLowerCase())
                );

            const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

            // Advanced filters
            let matchesDateRange = true;
            if (dateFrom) {
                matchesDateRange = matchesDateRange && new Date(booking.created_at) >= new Date(dateFrom);
            }
            if (dateTo) {
                matchesDateRange = matchesDateRange && new Date(booking.created_at) <= new Date(dateTo);
            }

            // Seat filters with comparison operators
            const seatCount = booking.seats?.length || 0;
            let matchesSeats = true;
            if (seatOperator === 'gte') {
                matchesSeats = !minSeats || seatCount >= parseInt(minSeats);
            } else if (seatOperator === 'lte') {
                matchesSeats = !maxSeats || seatCount <= parseInt(maxSeats);
            } else if (seatOperator === 'eq') {
                matchesSeats = !minSeats || seatCount === parseInt(minSeats);
            }

            // Amount filters with comparison operators
            let matchesAmount = true;
            if (amountOperator === 'gte') {
                matchesAmount = !minAmount || booking.amount >= parseFloat(minAmount);
            } else if (amountOperator === 'lte') {
                matchesAmount = !maxAmount || booking.amount <= parseFloat(maxAmount);
            } else if (amountOperator === 'eq') {
                matchesAmount = !minAmount || booking.amount === parseFloat(minAmount);
            }

            // Phone filters
            const matchesPhonePrefix = !phonePrefix || booking.phone.startsWith(phonePrefix);
            const matchesPhoneContains = !phoneContains || booking.phone.includes(phoneContains);

            // Preset filters
            let matchesPreset = true;
            if (presetFilter === 'highValue') {
                matchesPreset = booking.amount >= 5000;
            } else if (presetFilter === 'largeGroup') {
                matchesPreset = (booking.seats?.length || 0) >= 10;
            } else if (presetFilter === 'recent') {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                matchesPreset = new Date(booking.created_at) >= weekAgo;
            } else if (presetFilter === 'pendingLarge') {
                matchesPreset = booking.status === 'pending' && (booking.seats?.length || 0) >= 5;
            }

            return matchesSearch && matchesStatus && matchesDateRange && matchesSeats && matchesAmount && matchesPhonePrefix && matchesPhoneContains && matchesPreset;
        });
    }, [bookings, searchTerm, statusFilter, dateFrom, dateTo, minSeats, maxSeats, minAmount, maxAmount, phonePrefix, phoneContains, seatOperator, amountOperator, presetFilter]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            {/* Search and Filter Bar */}
            {showFilterSection && (
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder={t('searchPlaceholder') || 'Search by name, email, phone, ID, seat...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div className="sm:w-48">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="all">{t('allStatuses') || 'All Statuses'}</option>
                                <option value="approved">{t('approved')}</option>
                                <option value="pending">{t('pending')}</option>
                                <option value="rejected">{t('rejected')}</option>
                                <option value="timeout">{t('timeout')}</option>
                            </select>
                        </div>
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
                        </button>
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                        <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                            {/* Preset Filters */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Quick Filters</label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => {
                                            setPresetFilter(presetFilter === 'highValue' ? '' : 'highValue');
                                            // Reset other filters
                                            setDateFrom('');
                                            setDateTo('');
                                            setMinSeats('');
                                            setMaxSeats('');
                                            setMinAmount('');
                                            setMaxAmount('');
                                            setPhonePrefix('');
                                            setPhoneContains('');
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${presetFilter === 'highValue' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                    >
                                        💰 High Value (5000+)
                                    </button>
                                    <button
                                        onClick={() => {
                                            setPresetFilter(presetFilter === 'largeGroup' ? '' : 'largeGroup');
                                            setDateFrom('');
                                            setDateTo('');
                                            setMinSeats('');
                                            setMaxSeats('');
                                            setMinAmount('');
                                            setMaxAmount('');
                                            setPhonePrefix('');
                                            setPhoneContains('');
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${presetFilter === 'largeGroup' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                    >
                                        👥 Large Groups (10+ seats)
                                    </button>
                                    <button
                                        onClick={() => {
                                            setPresetFilter(presetFilter === 'recent' ? '' : 'recent');
                                            setDateFrom('');
                                            setDateTo('');
                                            setMinSeats('');
                                            setMaxSeats('');
                                            setMinAmount('');
                                            setMaxAmount('');
                                            setPhonePrefix('');
                                            setPhoneContains('');
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${presetFilter === 'recent' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                    >
                                        📅 Recent (Last 7 days)
                                    </button>
                                    <button
                                        onClick={() => {
                                            setPresetFilter(presetFilter === 'pendingLarge' ? '' : 'pendingLarge');
                                            setDateFrom('');
                                            setDateTo('');
                                            setMinSeats('');
                                            setMaxSeats('');
                                            setMinAmount('');
                                            setMaxAmount('');
                                            setPhonePrefix('');
                                            setPhoneContains('');
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${presetFilter === 'pendingLarge' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                                    >
                                        ⏳ Pending Large (5+ seats)
                                    </button>
                                </div>
                            </div>

                            {/* Custom Filters */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {/* Date Range */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date Range</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        />
                                        <input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Seat Count Filter with Operator */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Seat Count</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={seatOperator}
                                            onChange={(e) => setSeatOperator(e.target.value as 'gte' | 'lte' | 'eq')}
                                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        >
                                            <option value="gte">≥ (at least)</option>
                                            <option value="lte">≤ (at most)</option>
                                            <option value="eq">= (exactly)</option>
                                        </select>
                                        <input
                                            type="number"
                                            min="1"
                                            value={seatOperator === 'lte' ? maxSeats : minSeats}
                                            onChange={(e) => {
                                                if (seatOperator === 'lte') {
                                                    setMaxSeats(e.target.value);
                                                } else {
                                                    setMinSeats(e.target.value);
                                                }
                                            }}
                                            placeholder="e.g., 5"
                                            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Amount Filter with Operator */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={amountOperator}
                                            onChange={(e) => setAmountOperator(e.target.value as 'gte' | 'lte' | 'eq')}
                                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        >
                                            <option value="gte">≥ (at least)</option>
                                            <option value="lte">≤ (at most)</option>
                                            <option value="eq">= (exactly)</option>
                                        </select>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={amountOperator === 'lte' ? maxAmount : minAmount}
                                            onChange={(e) => {
                                                if (amountOperator === 'lte') {
                                                    setMaxAmount(e.target.value);
                                                } else {
                                                    setMinAmount(e.target.value);
                                                }
                                            }}
                                            placeholder="e.g., 1000"
                                            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Phone Prefix */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Starts With</label>
                                    <input
                                        type="text"
                                        value={phonePrefix}
                                        onChange={(e) => setPhonePrefix(e.target.value)}
                                        placeholder="e.g., 01"
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                </div>

                                {/* Phone Contains */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Contains</label>
                                    <input
                                        type="text"
                                        value={phoneContains}
                                        onChange={(e) => setPhoneContains(e.target.value)}
                                        placeholder="e.g., 12345"
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Clear All Filters Button */}
                            <div className="flex justify-end">
                                <button
                                    onClick={() => {
                                        setDateFrom('');
                                        setDateTo('');
                                        setMinSeats('');
                                        setMaxSeats('');
                                        setMinAmount('');
                                        setMaxAmount('');
                                        setPhonePrefix('');
                                        setPhoneContains('');
                                        setPresetFilter('');
                                        setSeatOperator('gte');
                                        setAmountOperator('gte');
                                    }}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        </div>
                    )}

                    {filteredBookings.length !== bookings.length && (
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            {t('showingResults', { count: filteredBookings.length, total: bookings.length }) || `Showing ${filteredBookings.length} of ${bookings.length} bookings`}
                        </div>
                    )}
                </div>
            )}
            {/* Mobile Card View */}
            <div className="md:hidden">
                {filteredBookings.map(booking => (
                    <div key={booking.id} className="p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                        {/* Header with ID, Date, Status */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded">
                                        <Hash className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <span className="text-sm font-medium">#{booking.id.substring(0, 8)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                    <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded">
                                        <Calendar className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    {formatDate(booking.created_at)}
                                    <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded">
                                        <Clock className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    {formatTime(booking.created_at)}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {getStatusBadge(booking.status)}
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-bold text-green-600 dark:text-green-400">{booking.amount}</span>
                                    <span className="text-xs text-green-600 dark:text-green-400">{currency}</span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                                    <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                </div>
                                <p className="text-sm font-medium">{booking.name}</p>
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

                        {/* Seats */}
                        <div className="mb-3">
                            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Seats ({booking.seats.length})</div>
                            <div className="space-y-1">
                                {booking.seats && sortSeats(booking.seats).slice(0, 3).map((seat, index) => (
                                    <div key={index} className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-700/50 rounded px-2 py-1">
                                        {seat.rows.zones.name} • {String(seat.rows.row_number).padStart(2, '0')} • {String(seat.seat_number).padStart(2, '0')}{seat.name_on_ticket && <span className="font-bold"> ➤ {seat.name_on_ticket}</span>}
                                    </div>
                                ))}
                                {booking.seats.length > 3 && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400">+{booking.seats.length - 3} more seats</div>
                                )}
                            </div>
                        </div>

                        {/* Payment Proof */}
                        {showPaymentProofColumn && (
                            <div className="mb-3">
                                {booking.image ? (
                                    <div
                                        onClick={() => onImageClick?.(booking.image!)}
                                        className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition-opacity"
                                    >
                                        <img
                                            src={booking.image}
                                            alt="Payment Proof"
                                            className="object-contain w-full h-full"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center w-full h-32 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                        <Eye className="h-8 w-8 text-slate-400" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        {showActions && (
                            <div className="flex gap-2">
                                {showCustomerActions && booking.status === 'pending' && (
                                    <>
                                        {onApprove && (
                                            <Button
                                                onClick={() => onApprove(booking.id)}
                                                disabled={processingId === booking.id}
                                                className="flex-1 h-9 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-sm transition-all duration-200"
                                                size="sm"
                                            >
                                                {processingId === booking.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                )}
                                                {processingId === booking.id ? t('processing') : t('approve')}
                                            </Button>
                                        )}
                                        {onReject && (
                                            <Button
                                                onClick={() => onReject(booking.id)}
                                                disabled={processingId === booking.id}
                                                className="flex-1 h-9 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-sm transition-all duration-200"
                                                size="sm"
                                            >
                                                {processingId === booking.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <AlertCircle className="h-4 w-4 mr-1" />
                                                )}
                                                {processingId === booking.id ? t('processing') : t('reject')}
                                            </Button>
                                        )}
                                    </>
                                )}
                                {showDownloadActions && booking.status === 'approved' && (
                                    <>
                                        {onDownloadTickets && showPaymentProofColumn && (
                                            <Button
                                                onClick={() => onDownloadTickets(booking.id)}
                                                disabled={processingId === booking.id}
                                                className="flex-1 h-9 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-sm transition-all duration-200"
                                                size="sm"
                                            >
                                                {processingId === booking.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Download className="h-4 w-4 mr-1" />
                                                )}
                                                {processingId === booking.id ? 'HTML...' : 'HTML'}
                                            </Button>
                                        )}
                                        {onDownloadSeparateTickets && (
                                            <Button
                                                onClick={() => onDownloadSeparateTickets(booking.id)}
                                                disabled={processingId === booking.id}
                                                className="flex-1 h-9 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-sm transition-all duration-200"
                                                size="sm"
                                            >
                                                {processingId === booking.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <FileText className="h-4 w-4 mr-1" />
                                                )}
                                                {processingId === booking.id ? 'PDFs...' : 'PDFs'}
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-indigo-100 dark:border-indigo-800/30">
                        <tr>
                            <th className="px-6 py-3 text-start text-xs font-medium tracking-wider text-slate-700 dark:text-slate-200">
                                {t('idAndDate')}
                            </th>
                            <th className="px-6 py-3 text-start text-xs font-medium tracking-wider text-slate-700 dark:text-slate-200">
                                {t('customerInfo')}
                            </th>
                            <th className="px-6 py-3 text-start text-xs font-medium tracking-wider text-slate-700 dark:text-slate-200">
                                {t('seats')}
                            </th>
                            <th className="px-6 py-3 text-start text-xs font-medium tracking-wider text-slate-700 dark:text-slate-200">
                                {t('amount')}
                            </th>
                            {showPaymentProofColumn && (
                                <th className="px-6 py-3 text-start text-xs font-medium tracking-wider text-slate-700 dark:text-slate-200">
                                    Payment Proof
                                </th>
                            )}
                            {showStatusColumn && (
                                <th className="px-6 py-3 text-start text-xs font-medium tracking-wider text-slate-700 dark:text-slate-200">
                                    {t('status')}
                                </th>
                            )}
                            {showActions && (
                                <th className="px-6 py-3 text-end text-xs font-medium tracking-wider text-slate-700 dark:text-slate-200">
                                    {t('actions')}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredBookings.map(booking => (
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
                                        {!showStatusColumn && (
                                            <div className="flex items-center gap-2 mt-1">
                                                {getStatusBadge(booking.status)}
                                            </div>
                                        )}
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
                                        <ol className="ml-6 space-y-1 list-decimal">
                                            {booking.seats && sortSeats(booking.seats).map((seat, index) => (
                                                <li key={index} className="text-sm text-slate-600 dark:text-slate-300 font-mono">
                                                    {seat.rows.zones.name} • {String(seat.rows.row_number).padStart(2, '0')} • {String(seat.seat_number).padStart(2, '0')}{seat.name_on_ticket && <span className="font-bold"> ➤ {seat.name_on_ticket}</span>}
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">{booking.amount}</span>
                                        <span className="text-sm text-green-600 dark:text-green-400">{currency}</span>
                                    </div>
                                </td>
                                {showPaymentProofColumn && (
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {booking.image ? (
                                            <div
                                                onClick={() => onImageClick?.(booking.image!)}
                                                className="relative w-32 h-32 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition-opacity"
                                            >
                                                <img
                                                    src={booking.image}
                                                    alt="Payment Proof"
                                                    className="object-contain w-full h-full"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center w-32 h-32 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                                <Eye className="h-8 w-8 text-slate-400" />
                                            </div>
                                        )}
                                    </td>
                                )}
                                {showStatusColumn && (
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(booking.status)}
                                    </td>
                                )}
                                {showActions && (
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex gap-2 justify-end">
                                            {showCustomerActions && booking.status === 'pending' && (
                                                <>
                                                    {onApprove && (
                                                        <Button
                                                            onClick={() => onApprove(booking.id)}
                                                            disabled={processingId === booking.id}
                                                            className="h-8 px-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-sm transition-all duration-200"
                                                            size="sm"
                                                        >
                                                            {processingId === booking.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                            )}
                                                            {processingId === booking.id ? t('processing') : t('approve')}
                                                        </Button>
                                                    )}
                                                    {onReject && (
                                                        <Button
                                                            onClick={() => onReject(booking.id)}
                                                            disabled={processingId === booking.id}
                                                            className="h-8 px-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-sm transition-all duration-200"
                                                            size="sm"
                                                        >
                                                            {processingId === booking.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                            )}
                                                            {processingId === booking.id ? t('processing') : t('reject')}
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                            {showDownloadActions && booking.status === 'approved' && (
                                                <>
                                                    {onDownloadTickets && showPaymentProofColumn && (
                                                        <Button
                                                            onClick={() => onDownloadTickets(booking.id)}
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
                                                    )}
                                                    {onDownloadSeparateTickets && (
                                                        <Button
                                                            onClick={() => onDownloadSeparateTickets(booking.id)}
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
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
