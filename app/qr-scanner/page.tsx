'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Camera,
    ArrowLeft,
    Check,
    AlertCircle,
    RefreshCw,
    Users,
    LogIn,
    LogOut,
    Home,
    Search,
    Info,
    X,
    ExternalLink,
    Clock,
    CheckCircle2,
    CircleDashed
} from 'lucide-react';
import QrScanner from 'qr-scanner';
import { createClient } from '@supabase/supabase-js';

// --- Initialize Supabase Outside to prevent re-render loops ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Types ---
type TabType = 'checkin' | 'checkout' | 'attendees' | 'info';

interface Seat {
    id: string;
    seat_number: string;
    check_in: boolean | null;
    "last Check-in": string | null;
    booking_id: string | null;
    row_id: string;
    rows?: {
        row_number: string;
        zones?: {
            name: string;
        };
    };
    bookings?: {
        name: string;
        email: string;
        phone: string;
    };
}

interface ScanResult {
    success: boolean;
    message: string;
    details?: string;
    seatInfo?: string;
    mode?: 'checkin' | 'checkout';
}

// --- Components ---

const SuccessToaster = ({ result, onClose }: { result: ScanResult; onClose: () => void }) => {
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

/**
 * Info Overlay - Large modal for seat information, blocks until "Continue"
 */
const InfoOverlay = ({ info, onContinue }: { info: ScanResult; onContinue: () => void }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border-b-8 border-amber-500">
                <div className="bg-amber-500 p-8 flex justify-center relative">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="bg-white/20 p-4 rounded-full relative z-10 ring-1 ring-white/30">
                        <Info className="h-16 w-16 text-white" />
                    </div>
                </div>
                <div className="p-8 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <h2 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.3em]">Seat Information</h2>
                    </div>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter leading-tight uppercase font-mono">
                        {info.seatInfo}
                    </p>

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

/**
 * Error Overlay - Large modal, blocks everything until "Continue"
 */
const ErrorOverlay = ({ error, onContinue }: { error: ScanResult; onContinue: () => void }) => {
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

// --- Custom Hooks ---

const usePersistedTab = () => {
    const [activeTab, setActiveTab] = useState<TabType>('checkin');
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('qr-scanner-tab');
        if (saved && ['checkin', 'checkout', 'attendees', 'info'].includes(saved)) {
            setActiveTab(saved as TabType);
        }
        setInitialized(true);
    }, []);

    useEffect(() => {
        if (initialized) {
            localStorage.setItem('qr-scanner-tab', activeTab);
        }
    }, [activeTab, initialized]);

    return { activeTab, setActiveTab, initialized };
};

// --- Main Page Component ---

export default function QRScannerPage() {
    const router = useRouter();
    const { activeTab, setActiveTab, initialized: isTabInitialized } = usePersistedTab();

    // Scanner Refs & State
    const videoRef = useRef<HTMLVideoElement>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);
    const [scanning, setScanning] = useState(false);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [hasCamera, setHasCamera] = useState(true);
    const [cameraLocked, setCameraLocked] = useState(false);
    const [isCooldown, setIsCooldown] = useState(false);

    // Results & Feedback State
    const [lastResult, setLastResult] = useState<ScanResult | null>(null);
    const [lastError, setLastError] = useState<ScanResult | null>(null);
    const [lastInfo, setLastInfo] = useState<ScanResult | null>(null);

    // Data State
    const [seats, setSeats] = useState<Seat[]>([]);
    const [loadingSeats, setLoadingSeats] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [checkedInExpanded, setCheckedInExpanded] = useState(true);
    const [notCheckedInExpanded, setNotCheckedInExpanded] = useState(false);

    // --- Actions ---

    const processScan = useCallback(async (data: string) => {
        if (cameraLocked || isCooldown) return;

        try {
            const isCheckIn = activeTab === 'checkin';
            const isInfo = activeTab === 'info';

            // Activate cooldown/lock
            if (!isInfo) {
                setIsCooldown(true);
            } else {
                setCameraLocked(true);
                qrScannerRef.current?.stop();
                setScanning(false);
            }

            if (isInfo) {
                // Info Scan - Just fetch details, don't update anything
                const { data: seatData } = await supabase
                    .from('seats')
                    .select('seat_number, rows(row_number, zones(name))')
                    .eq('id', data)
                    .single();

                if (seatData) {
                    setLastInfo({
                        success: true,
                        message: 'Seat Found',
                        seatInfo: `${(seatData as any).rows?.zones?.name} • ${(seatData as any).rows?.row_number} • ${seatData.seat_number}`
                    });
                } else {
                    setLastError({
                        success: false,
                        message: 'Seat Not Found',
                        details: 'ID: ' + data.substring(0, 8) + '...'
                    });
                }
                return;
            }

            const rpcFunction = isCheckIn ? 'check_in' : 'check_out';

            const { data: response, error } = await supabase.rpc(rpcFunction, {
                seat_uuid: data
            });

            if (error) {
                setLastError({
                    success: false,
                    message: error.message || `Failed to ${isCheckIn ? 'check in' : 'check out'}`,
                    details: data
                });
                setCameraLocked(true);
                setIsCooldown(false); // Reset cooldown on hard error
                qrScannerRef.current?.stop();
                setScanning(false);
            } else {
                // Success - Get seat details for the toaster for a better UI
                const { data: seatData } = await supabase
                    .from('seats')
                    .select('seat_number, rows(row_number, zones(name))')
                    .eq('id', data)
                    .single();

                const seatLabel = seatData
                    ? `${(seatData as any).rows?.zones?.name} • ${(seatData as any).rows?.row_number} • ${seatData.seat_number}`
                    : (data.substring(0, 8) + '...');

                // Show toaster, keep camera running
                setLastResult({
                    success: true,
                    message: `Successfully ${isCheckIn ? 'checked in' : 'checked out'}!`,
                    seatInfo: seatLabel,
                    mode: isCheckIn ? 'checkin' : 'checkout'
                });

                // Clear cooldown after 2 seconds
                setTimeout(() => {
                    setIsCooldown(false);
                }, 2000);

                // Optional: Trigger a haptic feedback or sound here
                if (window.navigator?.vibrate) window.navigator.vibrate(50);
            }
        } catch (err: any) {
            setLastError({
                success: false,
                message: 'An unexpected connection error occurred.',
                details: err.message
            });
            setCameraLocked(true);
            setIsCooldown(false);
            qrScannerRef.current?.stop();
            setScanning(false);
        }
    }, [activeTab, cameraLocked, isCooldown]);

    const initScanner = useCallback(async () => {
        if (!videoRef.current) return;
        if (activeTab !== 'checkin' && activeTab !== 'checkout' && activeTab !== 'info') return;

        try {
            const hasCam = await QrScanner.hasCamera();
            setHasCamera(hasCam);
            if (!hasCam) return;

            if (qrScannerRef.current) {
                qrScannerRef.current.destroy();
            }

            const scanner = new QrScanner(
                videoRef.current,
                (result) => processScan(result.data),
                {
                    preferredCamera: facingMode,
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                }
            );

            qrScannerRef.current = scanner;
            await scanner.start();
            setScanning(true);
            setCameraLocked(false);
        } catch (err) {
            console.error('Scanner init failed:', err);
            setHasCamera(false);
        }
    }, [activeTab, facingMode, processScan]);

    const handleContinue = () => {
        setLastError(null);
        setLastInfo(null);
        setCameraLocked(false);
        setIsCooldown(false);
        initScanner();
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    const fetchSeats = useCallback(async () => {
        if (activeTab !== 'attendees') return;

        try {
            const { data } = await supabase
                .from('seats')
                .select(`
                    id, seat_number, "Check-in", row_id, booking_id, "last Check-in",
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
    }, [activeTab]);

    // --- Effects ---

    useEffect(() => {
        initScanner();
        return () => {
            qrScannerRef.current?.stop();
            qrScannerRef.current?.destroy();
            qrScannerRef.current = null;
        };
    }, [activeTab, facingMode, initScanner]);

    useEffect(() => {
        if (activeTab === 'attendees') {
            setLoadingSeats(true);
            fetchSeats();
            const interval = setInterval(fetchSeats, 5000);
            return () => clearInterval(interval);
        }
    }, [activeTab, fetchSeats]);

    // --- Render Helpers ---

    const renderScannerView = () => {
        const isCheckIn = activeTab === 'checkin';
        const isInfo = activeTab === 'info';
        const Icon = isInfo ? Info : (isCheckIn ? LogIn : LogOut);

        // Use explicit classes for Tailwind JIT to detect them
        const headerBg = isInfo ? 'bg-amber-600' : (isCheckIn ? 'bg-emerald-600' : 'bg-rose-600');
        const footerBg = isInfo ? 'bg-amber-500/20' : (isCheckIn ? (isCooldown ? 'bg-amber-500/20' : 'bg-emerald-500/20') : (isCooldown ? 'bg-amber-500/20' : 'bg-rose-500/20'));
        const footerBorder = isInfo ? 'border-amber-500/30' : (isCheckIn ? (isCooldown ? 'border-amber-500/30' : 'border-emerald-500/30') : (isCooldown ? 'border-amber-500/30' : 'border-rose-500/30'));
        const footerText = isInfo ? 'text-amber-400' : (isCheckIn ? (isCooldown ? 'text-amber-400' : 'text-emerald-400') : (isCooldown ? 'text-amber-400' : 'text-rose-400'));
        const dotBg = isInfo ? 'bg-amber-500' : (isCheckIn ? (isCooldown ? 'bg-amber-500' : 'bg-emerald-500') : (isCooldown ? 'bg-amber-500' : 'bg-rose-500'));
        const cornerBorder = isInfo ? 'border-amber-500' : (isCheckIn ? 'border-emerald-500' : 'border-rose-500');
        const scannerLightBg = isInfo ? 'bg-amber-400' : (isCheckIn ? 'bg-emerald-400' : 'bg-rose-400');
        const scannerLightShadow = isInfo ? 'shadow-amber-500/50' : (isCheckIn ? 'shadow-emerald-500/50' : 'shadow-rose-500/50');

        return (
            <div className="flex flex-col h-full bg-black relative overflow-hidden">
                {/* Top Status Bar - RICH COLORED HEADER */}
                <div className={`p-6 pt-12 pb-8 ${headerBg} relative overflow-hidden text-white z-10 shadow-2xl`}>
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    <div className="flex items-center justify-between mb-3 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30 shadow-inner">
                                <Icon className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-none whitespace-nowrap">
                                    {isInfo ? 'Device InfoScan' : (isCheckIn ? 'Check In' : 'Check Out')}
                                </h1>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Device Active</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={toggleCamera} className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20 active:scale-95 transition-all hover:bg-white/20">
                            <RefreshCw className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 opacity-80 relative z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <p className="text-[11px] font-bold uppercase tracking-widest leading-none">Position QR inside the frame</p>
                    </div>
                </div>

                {/* Camera Container */}
                <div className="flex-1 relative flex items-center justify-center">
                    {!hasCamera ? (
                        <div className="text-white text-center p-8">
                            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                            <h2 className="text-xl font-bold">No Camera Found</h2>
                            <p className="opacity-70">Please check your permissions and try again.</p>
                        </div>
                    ) : (
                        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
                    )}

                    {/* Scan Frame Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-64 h-64 relative">
                            {/* Animated Corners */}
                            <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 ${cornerBorder} rounded-tl-xl`} />
                            <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 ${cornerBorder} rounded-tr-xl`} />
                            <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 ${cornerBorder} rounded-bl-xl`} />
                            <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 ${cornerBorder} rounded-br-xl`} />

                            {/* Scanning Light */}
                            <div className={`absolute w-full h-1 ${scannerLightBg} shadow-[0_0_20px] ${scannerLightShadow} animate-scanner-line top-0`} />
                        </div>
                    </div>
                </div>

                {/* Bottom Instruction Pill - Overlaid */}
                <div className="pb-32 pt-8 flex justify-center relative z-10 pointer-events-none">
                    <div className={`pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full border shadow-2xl backdrop-blur-md ${footerBg} ${footerBorder} ${footerText}`}>
                        <div className={`w-2 h-2 rounded-full ${dotBg} ${isCooldown ? '' : 'animate-pulse'}`} />
                        <span className="text-xs font-black uppercase tracking-widest leading-none">
                            {isCooldown ? 'Cooldown (2s)' : 'Scanner Active'}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const renderAttendeesView = () => {
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
                    seat.bookings?.name,
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
                {/* Widgets Section - Top Padded Container */}
                <div className="pt-10 px-5 flex-shrink-0">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {/* Inside Widget */}
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

                        {/* Not Arrived Widget */}
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

                {/* List Container - Scrollable area that takes full height */}
                <div className="flex-1 overflow-auto space-y-4 px-5 pb-40 scroll-smooth">
                    {/* Search Bar - Sticky for better accessibility */}
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

                    {/* Accordion List Content */}
                    <div className="space-y-3">
                        {loadingSeats ? (
                            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" /></div>
                        ) : (
                            <>
                                {/* Checked In Section */}
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
                                                            <p className="font-bold text-gray-900 dark:text-white truncate">{seat.bookings?.name}</p>
                                                            <p className="text-[10px] text-gray-500 font-medium">{seat.bookings?.phone}</p>
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

                                {/* Not Checked In Section */}
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
                                                            <p className="font-bold text-gray-900 dark:text-white truncate">{seat.bookings?.name}</p>
                                                            <p className="text-[10px] text-gray-500 font-medium">{seat.bookings?.phone}</p>
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

    return (
        <div className="fixed inset-0 bg-white dark:bg-black font-sans select-none overflow-hidden text-gray-900 dark:text-white">
            {/* Global Overlays */}
            {lastError && <ErrorOverlay error={lastError} onContinue={handleContinue} />}
            {lastResult && <SuccessToaster result={lastResult} onClose={() => setLastResult(null)} />}
            {lastInfo && <InfoOverlay info={lastInfo} onContinue={handleContinue} />}

            {/* Main Content Area */}
            <main className="h-full">
                {!isTabInitialized ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
                    </div>
                ) : (
                    <>
                        {(activeTab === 'checkin' || activeTab === 'checkout' || activeTab === 'info') && renderScannerView()}
                        {activeTab === 'attendees' && renderAttendeesView()}
                    </>
                )}
            </main>

            {/* Premium Floating Navigation - FLOATING ISLAND */}
            <div className="fixed bottom-10 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
                <nav className="pointer-events-auto flex items-center gap-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl p-2 rounded-full border border-white/20 dark:border-gray-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]">
                    <NavBtn
                        active={activeTab === 'checkin'}
                        onClick={() => setActiveTab('checkin')}
                        icon={LogIn}
                        label="In"
                        color="green"
                    />
                    <NavBtn
                        active={activeTab === 'checkout'}
                        onClick={() => setActiveTab('checkout')}
                        icon={LogOut}
                        label="Out"
                        color="red"
                    />
                    <NavBtn
                        active={activeTab === 'attendees'}
                        onClick={() => setActiveTab('attendees')}
                        icon={Users}
                        label="List"
                        color="indigo"
                    />
                    <NavBtn
                        active={activeTab === 'info'}
                        onClick={() => setActiveTab('info')}
                        icon={Info}
                        label="Info"
                        color="amber"
                    />
                </nav>
            </div>

            {/* Animations */}
            <style jsx global>{`
                @keyframes scanner-line {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scanner-line {
                    animation: scanner-line 3s linear infinite;
                }
                @keyframes pulse-custom {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

// --- Internal Nav Button ---
function NavBtn({ active, onClick, icon: Icon, label, color }: {
    active: boolean;
    onClick: () => void;
    icon: any;
    label: string;
    color: 'green' | 'red' | 'indigo' | 'amber'
}) {
    const colorMap = {
        green: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        red: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    };

    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300
                ${active ? colorMap[color] + ' border shadow-lg' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}
            `}
        >
            <Icon className="h-5 w-5" />
            {active && <span className="font-black uppercase text-[10px] tracking-tight">{label}</span>}
        </button>
    );
}
