"use client";

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useActionState } from 'react';
import { useState, useEffect } from 'react';
import { updatePaymentMode } from './payment-mode-action';

export default function PaymentModeForm() {
  const [paymentMode, setPaymentMode] = useState<string>('manual');
  const [state, formAction, isPending] = useActionState(updatePaymentMode, { message: '', success: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Fetch the current payment mode
    const fetchPaymentMode = async () => {
      try {
        const response = await fetch('/api/settings/payment-mode');
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched payment mode:', data.mode);
          setPaymentMode(data.mode);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error fetching payment mode:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentMode();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.message && (
        <div className={`p-3 rounded-md ${state.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {state.message}
        </div>
      )}
      <div className="space-y-2">
        <Label>Payment Mode</Label>
        <div className="grid grid-cols-1 gap-4 mt-2">
          <label className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer ${paymentMode === "manual" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
            <input
              type="radio"
              name="payment-mode"
              value="manual"
              checked={isInitialized && paymentMode === "manual"}
              onChange={() => setPaymentMode("manual")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-medium">Manual Payment Options</div>
              <p className="text-sm text-gray-500 mt-1">Users will see manual payment options like Orange Cash, Instapay, etc.</p>
            </div>
            <div className="ml-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            </div>
          </label>

          <label className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer ${paymentMode === "online" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
            <input
              type="radio"
              name="payment-mode"
              value="online"
              checked={isInitialized && paymentMode === "online"}
              onChange={() => setPaymentMode("online")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-medium">Online Payment Gateway</div>
              <p className="text-sm text-gray-500 mt-1">Users will be redirected to an online payment gateway</p>
            </div>
            <div className="ml-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
            </div>
          </label>
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Updating...' : 'Update Payment Mode'}
      </Button>
    </form>
  );
}
