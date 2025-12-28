import React, { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle2, CircleDashed, Check, ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Seat } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const AttendeesView = () => {
    const [seats, setSeats] = useState<Seat[]>([]);
    const [loadingSeats, setLoadingSeats] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [checkedInExpanded, setCheckedInExpanded] = useState(true);
    const [notCheckedInExpanded, setNotCheckedInExpanded] = useState(false);

    const fetchSeats = useCallback(async () => {
        try {
            const { data } = await supabase
                .from('seats')
                .select(`
                    id, seat_number, "Check-in", row_id, booking_id, "last Check-in", name_on_ticket,
                    rows(row_number, zones(name)),
                    bookings(name, email, phone)
                `)
                .not('booking_id', 'is', null)
                .order('last Check-in', { ascending: false, nullsFirst: false });

            if (data) {
                const mappedData = data.map((s: any) => ({
                    ...s,
                    check_in: s["Check-in"]
                }));
                setSeats(mappedData);
            }
        } catch (err) {
            console.error('Fetch seats failed', err);
        } finally {
            setLoadingSeats(false);
        }
    }, []);

    useEffect(() => {
        fetchSeats();
        const interval = setInterval(fetchSeats, 5000);
        return () => clearInterval(interval);
    }, [fetchSeats]);

    const checkedInSeats = seats.filter(seat => seat.check_in === true);
    const notCheckedInSeats = seats.filter(seat => seat.check_in === false || seat.check_in === null);
    const totalSeats = seats.length;
    const checkedInCount = checkedInSeats.length;

    const notArrivedCount = seats.filter(seat => seat["last Check-in"] === null).length;
    const insidePercent = totalSeats > 0 ? Math.round((checkedInCount / totalSeats) * 100) : 0;
    const notArrivedPercent = totalSeats > 0 ? Math.round((notArrivedCount / totalSeats) * 100) : 0;

    const filterSeats = (seatsToFilter: any[]) => {
        if (!searchQuery) return seatsToFilter;
        const normalizedQuery = searchQuery.toLowerCase().replace(/[^a-z0-9]/g, '');
        return seatsToFilter.filter(seat => {
            const searchableItems = [
                seat.name_on_ticket,
                seat.bookings?.phone,
                seat.rows?.zones?.name,
                seat.rows?.row_number,
                seat.seat_number,
                seat["last Check-in"] ? new Date(seat["last Check-in"]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : ''
            ];
            const normalizedText = searchableItems.join('').toLowerCase().replace(/[^a-z0-9]/g, '');
            return normalizedText.includes(normalizedQuery);
        });
    };

    const filteredCheckedIn = filterSeats(checkedInSeats);
    const filteredNotCheckedIn = filterSeats(notCheckedInSeats);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Widgets Section */}
            <div className="pt-10 px-5 flex-shrink-0">
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700/50 rounded-2xl p-3 relative shadow-sm overflow-hidden group tracking-tighter">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-xl font-black text-gray-900 dark:text-white leading-none">{checkedInCount}</span>
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{insidePercent}%</span>
                                </div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Inside</div>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-gray-700">
                            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${insidePercent}%` }} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700/50 rounded-2xl p-3 relative shadow-sm overflow-hidden group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-xl text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                                <CircleDashed className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-xl font-black text-gray-900 dark:text-white leading-none">{notArrivedCount}</span>
                                    <span className="text-[10px] font-black text-orange-600 dark:text-orange-400">{notArrivedPercent}%</span>
                                </div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 truncate">Not Arrived</div>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-gray-700">
                            <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${notArrivedPercent}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* List Container */}
            <div className="flex-1 overflow-auto space-y-4 px-5 pb-40 scroll-smooth">
                <div className="relative sticky top-0 z-20 pt-2 pb-1 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-md">
                    <Search className="absolute left-4 top-[calc(50%+4px)] -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search attendees..."
                        className="w-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl py-3 pl-12 pr-4 focus:border-indigo-500 outline-none transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="space-y-3">
                    {loadingSeats ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" /></div>
                    ) : (
                        <>
                            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                                <button onClick={() => setCheckedInExpanded(!checkedInExpanded)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2"><Check className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
                                        <div className="text-left">
                                            <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white">Inside</h3>
                                            <p className="text-[10px] font-bold text-gray-500">{filteredCheckedIn.length} attendees</p>
                                        </div>
                                    </div>
                                    <ArrowLeft className={`h-4 w-4 text-gray-400 transition-transform ${checkedInExpanded ? '-rotate-90' : ''}`} />
                                </button>
                                {checkedInExpanded && (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredCheckedIn.map(seat => (
                                            <div key={seat.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                                <div className="flex justify-between items-start">
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-900 dark:text-white truncate">{seat.name_on_ticket}</p>
                                                        <p className="text-[10px] text-gray-500 font-medium">{seat.bookings?.name} ➤ {seat.bookings?.phone}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-[10px] font-black uppercase text-gray-900 dark:text-white">
                                                            {seat.rows?.zones?.name} • {seat.rows?.row_number} • {seat.seat_number}
                                                        </p>
                                                        {seat["last Check-in"] && (
                                                            <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                                                                <Clock className="h-3 w-3" />
                                                                <span className="text-[10px] font-black tracking-wide">
                                                                    Arrived at {new Date(seat["last Check-in"]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                                <button onClick={() => setNotCheckedInExpanded(!notCheckedInExpanded)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-2"><AlertCircle className="h-5 w-5 text-gray-500" /></div>
                                        <div className="text-left">
                                            <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white">Outside</h3>
                                            <p className="text-[10px] font-bold text-gray-500">{filteredNotCheckedIn.length} attendees</p>
                                        </div>
                                    </div>
                                    <ArrowLeft className={`h-4 w-4 text-gray-400 transition-transform ${notCheckedInExpanded ? '-rotate-90' : ''}`} />
                                </button>
                                {notCheckedInExpanded && (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredNotCheckedIn.map(seat => (
                                            <div key={seat.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                                <div className="flex justify-between items-start">
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-900 dark:text-white truncate">{seat.name_on_ticket}</p>
                                                        <p className="text-[10px] text-gray-500 font-medium">{seat.bookings?.name} ➤ {seat.bookings?.phone}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-[10px] font-black uppercase text-gray-900 dark:text-white">
                                                            {seat.rows?.zones?.name} • {seat.rows?.row_number} • {seat.seat_number}
                                                        </p>
                                                        <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50">
                                                            {seat["last Check-in"] && <Clock className="h-3 w-3" />}
                                                            <span className="text-[10px] font-bold tracking-wide">
                                                                {seat["last Check-in"]
                                                                    ? 'Arrived at ' + new Date(seat["last Check-in"]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                                                                    : 'Not arrived yet'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
