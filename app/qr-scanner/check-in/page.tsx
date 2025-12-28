'use client';

import React from 'react';
import { useScannerLogic } from '../shared/hooks/useScannerLogic';
import { ScannerView } from '../shared/components/ScannerView';
import { SuccessToaster, ErrorOverlay, InfoOverlay } from '../shared/components/Overlays';

export default function CheckInPage() {
    const {
        videoRef,
        hasCamera,
        isCooldown,
        lastResult,
        setLastResult,
        lastError,
        lastInfo,
        handleContinue
    } = useScannerLogic('checkin');

    return (
        <div className="fixed inset-0 bg-black font-sans select-none overflow-hidden">
            {/* Global Overlays */}
            {lastError && <ErrorOverlay error={lastError} onContinue={handleContinue} />}
            {lastResult && <SuccessToaster result={lastResult} onClose={() => setLastResult(null)} />}
            {lastInfo && <InfoOverlay info={lastInfo} onContinue={handleContinue} />}

            <main className="h-full">
                <ScannerView
                    activeTab="checkin"
                    videoRef={videoRef}
                    hasCamera={hasCamera}
                    isCooldown={isCooldown}
                />
            </main>
        </div>
    );
}
