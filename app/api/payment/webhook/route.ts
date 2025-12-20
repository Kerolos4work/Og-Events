import { NextResponse } from 'next/server';
import { validateKashierWebhook } from '@/lib/kashier';
import { supabase } from '@/lib/supabase';

export async function OPTIONS(request: Request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Kashier-Signature');

  return new NextResponse(null, { status: 200, headers });
}

export async function POST(request: Request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Kashier-Signature');

  try {
    const body = await request.json();
    const { data, event } = body;

    // Get signature from header
    const headerSignature = request.headers.get('x-kashier-signature');

    const secret = process.env.KASHIER_API_KEY;
    const testMode = process.env.WEBHOOK_TEST_MODE === 'false';

    // Skip signature validation in test mode
    if (!testMode) {
      if (!secret) {
        console.error('Missing API key');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers });
      }

      if (!headerSignature) {
        console.error('Missing x-kashier-signature header');
        return NextResponse.json({ error: 'Missing signature header' }, { status: 401, headers });
      }

      // Validate webhook signature
      const isValid = validateKashierWebhook(data, headerSignature, secret);

      if (!isValid) {
        console.error('Invalid signature');
        console.error('Received signature:', headerSignature);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401, headers });
      }
    } else {
      console.log('TEST MODE: Skipping signature validation');
    }

    console.log('Webhook received successfully:', event);

    // Extract merchant ID from webhook data
    const merchantId = data.merchantOrderId || data.orderId;

    if (merchantId) {
      try {
        // Update the booking with payment method set to Kashier
        const { error } = await supabase
          .from('bookings')
          .update({
            image:
              'https://mmdzysyuazaoyuymjjqu.supabase.co/storage/v1/object/public/Payment/payment-proofs/temp/1766229011189.webp',
            status: 'approved',
            kashier_transaction_Id: data.transactionId,
          })
          .eq('id', merchantId);

        if (error) {
          console.error('Error updating booking payment method:', error);
        } else {
          console.log(`Successfully updated booking ${merchantId} with payment method Kashier`);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    } else {
      console.log('No merchant ID found in webhook data');
    }

    // Return success response
    return NextResponse.json({ status: 'success' }, { headers });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500, headers });
  }
}

// GET endpoint removed as we're only focusing on webhook processing and signature verification
