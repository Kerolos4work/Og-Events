'use server';

import fs from 'fs';
import path from 'path';

export async function updatePaymentMode(prevState: any, formData: FormData) {
  try {
    const paymentMode = formData.get('payment-mode') as string;

    // Validate payment mode
    if (!paymentMode || (paymentMode !== 'manual' && paymentMode !== 'online')) {
      return { message: 'Invalid payment mode selected. Please try again.', success: false };
    }

    // Read current settings file
    const settingsPath = path.resolve(process.cwd(), 'config/settings.json');
    const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    // Update payment mode
    settingsData.payment.mode = paymentMode;

    // Write updated settings back to the file
    fs.writeFileSync(settingsPath, JSON.stringify(settingsData, null, 2), 'utf8');

    // Return success message
    return { message: `Payment mode updated to ${paymentMode === 'manual' ? 'Manual Payment Options' : 'Online Payment Gateway'}!`, success: true };
  } catch (error) {
    console.error('Error updating payment mode:', error);
    return { message: 'Failed to update payment mode. Please try again.', success: false };
  }
}
