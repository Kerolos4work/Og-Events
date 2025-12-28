import React, { useEffect } from 'react';
import { LogIn, LogOut, Info, AlertCircle, X } from 'lucide-react';
import { ScanResult } from '../types';

export const SuccessToaster = ({ result, onClose }: { result: ScanResult; onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 2000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const isCheckIn = result.mode === 'checkin';
    const Icon = isCheckIn ? LogIn : LogOut;

    return (
        <div className="fixed bottom-28 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className={`bg-white dark:bg-gray-800 border-2 ${isCheckIn ? 'border-emerald-500' : 'border-rose-500'} rounded-2xl p-4 shadow-2xl flex items-center gap-4 max-w-md mx-auto`}>
                <div className={`${isCheckIn ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'} p-3 rounded-full flex-shrink-0`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`${isCheckIn ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'} font-black text-[10px] uppercase tracking-wider`}>
                        {isCheckIn ? 'Entry Approved' : 'Exit Logged'}
                    </h3>
                    <p className="text-gray-900 dark:text-white font-black text-2xl tracking-tight leading-none mt-0.5 truncate">
                        {result.seatInfo}
                    </p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
                    <X className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
};

export const InfoOverlay = ({ info, onContinue }: { info: ScanResult; onContinue: () => void }) => {
    const { seatData } = info;
    
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border-b-8 border-amber-500">
                <div className="bg-amber-500 p-8 flex justify-center relative">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="bg-white/20 p-4 rounded-full relative z-10 ring-1 ring-white/30">
                        <Info className="h-16 w-16 text-white" />
                    </div>
                </div>
                <div className="p-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <h2 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.3em]">Ticket Information</h2>
                    </div>
                    
                    {seatData && (
                        <div className="space-y-3 mb-6">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Name on Ticket</p>
                                <p className="text-sm font-black text-gray-900 dark:text-white">{seatData.name_on_ticket || 'N/A'}</p>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Seat</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white uppercase font-mono tracking-tighter">
                                    {seatData.rows?.zones?.name} • {seatData.rows?.row_number} • {seatData.seat_number}
                                </p>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Booking Name</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{seatData.bookings?.name || 'N/A'}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white break-all">{seatData.bookings?.phone || 'N/A'}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white break-all">{seatData.bookings?.email || 'N/A'}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check-in Status</p>
                                    <p className={`text-xs font-black uppercase ${seatData.check_in ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {seatData.check_in ? 'Checked In' : 'Not Checked In'}
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Check-in</p>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                                        {seatData["last Check-in"] 
                                            ? new Date(seatData["last Check-in"]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                                            : 'N/A'
                                        }
                                    </p>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Booking ID</p>
                                <p className="text-xs font-mono text-gray-900 dark:text-white break-all">{seatData.booking_id || 'N/A'}</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={onContinue}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg active:scale-95 text-lg uppercase tracking-wider ring-offset-2 focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ErrorOverlay = ({ error, onContinue }: { error: ScanResult; onContinue: () => void }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 shadow-rose-900/20 border-b-8 border-rose-500">
                <div className="bg-rose-500 p-8 flex justify-center relative">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="bg-white/20 p-4 rounded-full relative z-10 ring-1 ring-white/30">
                        <AlertCircle className="h-16 w-16 text-white" />
                    </div>
                </div>
                <div className="p-8 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                        <h2 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.3em]">Scan Error</h2>
                    </div>
                    <p className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight leading-tight">
                        {error.message}
                    </p>
                    {error.details && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-6 text-[10px] text-gray-500 dark:text-gray-400 font-mono break-all">
                            {error.details}
                        </div>
                    )}
                    <button
                        onClick={onContinue}
                        className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg active:scale-95 text-lg uppercase tracking-wider ring-offset-2 focus:ring-2 focus:ring-rose-500 outline-none"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};
