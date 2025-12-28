import { useRef, useState, useCallback, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { createClient } from '@supabase/supabase-js';
import { TabType, ScanResult } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const useScannerLogic = (activeTab: TabType) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);

    // Stability Refs: These allow the scanning callback to stay active without triggering restarts
    const activeTabRef = useRef<TabType>(activeTab);
    const cameraLockedRef = useRef(false);
    const isCooldownRef = useRef(false);

    // Detect if device is mobile
    const isMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    // Sync the ref whenever activeTab changes (WITHOUT restarting the camera)
    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);

    // UI state
    const [cameraLocked, setCameraLocked] = useState(false);
    const [isCooldown, setIsCooldown] = useState(false);
    const [hasCamera, setHasCamera] = useState(true);

    const [lastResult, setLastResult] = useState<ScanResult | null>(null);
    const [lastError, setLastError] = useState<ScanResult | null>(null);
    const [lastInfo, setLastInfo] = useState<ScanResult | null>(null);

    // This callback is now stable and doesn't depend on activeTab
    const processScan = useCallback(async (data: string) => {
        // Use refs to check current state - keeps the camera feed 100% active but ignores data
        if (cameraLockedRef.current || isCooldownRef.current) return;

        try {
            const currentTab = activeTabRef.current;
            const isCheckIn = currentTab === 'checkin';
            const isInfo = currentTab === 'info';

            // Logically "Pause" reading by setting flags
            if (!isInfo) {
                isCooldownRef.current = true;
                setIsCooldown(true);
            } else {
                cameraLockedRef.current = true;
                setCameraLocked(true);
                // We DON'T call qrScanner.pause() here to keep the video feed live and smooth
            }

            if (isInfo) {
                const { data: seatData } = await supabase
                    .from('seats')
                    .select(`
                        id, seat_number, "Check-in", row_id, booking_id, "last Check-in", name_on_ticket,
                        rows(row_number, zones(name)),
                        bookings(name, email, phone)
                    `)
                    .eq('id', data)
                    .single();

                if (seatData) {
                    const mappedData = {
                        ...seatData,
                        check_in: seatData["Check-in"]
                    };
                    setLastInfo({
                        success: true,
                        message: 'Seat Found',
                        seatInfo: `${(seatData as any).rows?.zones?.name} • ${(seatData as any).rows?.row_number} • ${seatData.seat_number}`,
                        mode: 'info',
                        seatData: mappedData as any
                    });
                } else {
                    setLastError({
                        success: false,
                        message: 'Seat Not Found',
                        details: 'ID: ' + data.substring(0, 8) + '...'
                    });
                    cameraLockedRef.current = true;
                    setCameraLocked(true);
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
                cameraLockedRef.current = true;
                setCameraLocked(true);
                isCooldownRef.current = false;
                setIsCooldown(false);
            } else {
                const { data: seatData } = await supabase
                    .from('seats')
                    .select('seat_number, rows(row_number, zones(name))')
                    .eq('id', data)
                    .single();

                const seatLabel = seatData
                    ? `${(seatData as any).rows?.zones?.name} • ${(seatData as any).rows?.row_number} • ${seatData.seat_number}`
                    : (data.substring(0, 8) + '...');

                setLastResult({
                    success: true,
                    message: `Successfully ${isCheckIn ? 'checked in' : 'checked out'}!`,
                    seatInfo: seatLabel,
                    mode: isCheckIn ? 'checkin' : 'checkout'
                });

                // Standard 2s cooldown for normal scans
                setTimeout(() => {
                    isCooldownRef.current = false;
                    setIsCooldown(false);
                }, 2000);

                if (window.navigator?.vibrate) window.navigator.vibrate(50);
            }
        } catch (err: any) {
            setLastError({
                success: false,
                message: 'An unexpected connection error occurred.',
                details: err.message
            });
            cameraLockedRef.current = true;
            setCameraLocked(true);
            isCooldownRef.current = false;
            setIsCooldown(false);
        }
    }, []); // No dependencies = callback never changes = camera never restarts

    const initScanner = useCallback(async () => {
        if (!videoRef.current) return;
        if (activeTabRef.current === 'attendees') return;

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
                    preferredCamera: isMobile() ? 'environment' : 'user',
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                }
            );

            qrScannerRef.current = scanner;
            await scanner.start();
        } catch (err) {
            console.error('Scanner init failed:', err);
            setHasCamera(false);
        }
    }, [processScan]);

    // Only restart camera if initialized (first time)
    useEffect(() => {
        initScanner();
        return () => {
            qrScannerRef.current?.stop();
            qrScannerRef.current?.destroy();
            qrScannerRef.current = null;
        };
    }, []); // activeTab removed from here = NO RESTART ON TAB SWITCH

    const handleContinue = () => {
        setLastError(null);
        setLastInfo(null);
        cameraLockedRef.current = false;
        setCameraLocked(false);
        isCooldownRef.current = false;
        setIsCooldown(false);
        // We don't need .resume() because we never called .pause()
    };

    return {
        videoRef,
        hasCamera,
        cameraLocked,
        isCooldown,
        lastResult,
        setLastResult,
        lastError,
        lastInfo,
        handleContinue
    };
};
