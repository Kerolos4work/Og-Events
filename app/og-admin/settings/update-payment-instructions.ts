'use server';

import fs from 'fs';
import path from 'path';

export async function updatePaymentInstructions(prevState: any, formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const paymentMethodsJson = formData.get('paymentMethods') as string;
    const paymentMethods = JSON.parse(paymentMethodsJson) as {
      image: string;
      title: string;
      phoneNumber: string;
      name: string;
      color: string;
    }[];

    // Read the current settings file
    const settingsPath = path.resolve(process.cwd(), 'config/settings.json');
    const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    // Update the payment instructions
    settingsData.payment.instructions.title = title;
    settingsData.payment.instructions.paymentMethods = paymentMethods;

    // Write the updated settings back to the file
    fs.writeFileSync(settingsPath, JSON.stringify(settingsData, null, 2), 'utf8');

    // Return success message
    return { message: 'Payment methods updated successfully!', success: true };
  } catch (error) {
    console.error('Error updating payment methods:', error);
    return { message: 'Failed to update payment methods. Please try again.', success: false };
  }
}
