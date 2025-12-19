import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { amount, currency, orderId } = await request.json();

    // Get merchant ID and API key from environment variables
    const mid = process.env.KASHIER_MERCHANT_ID;
    const secret = process.env.KASHIER_API_KEY;

    if (!mid || !secret) {
      return NextResponse.json(
        { error: 'Missing merchant ID or API key' },
        { status: 500 }
      );
    }

    // Generate the hash - updated format for Kashier
    const path = `?payment=${mid}.${orderId}.${amount}.${currency}`;
    const hash = crypto.createHmac('sha256', secret).update(path).digest('hex');

    return NextResponse.json({ hash });
  } catch (error) {
    console.error('Error generating payment hash:', error);
    return NextResponse.json(
      { error: 'Failed to generate payment hash' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());

  // Get API key from environment variables
  const secret = process.env.KASHIER_API_KEY;

  if (!secret) {
    return NextResponse.json(
      { error: 'Missing API key' },
      { status: 500 }
    );
  }

  // Validate the signature
  let queryString = '';
  for (const key in query) {
    if (key === 'signature' || key === 'mode') continue;
    queryString += '&' + key + '=' + query[key];
  }
  const finalUrl = queryString.substr(1);
  const signature = crypto.createHmac('sha256', secret).update(finalUrl).digest('hex');

  const isValid = signature === query.signature;

  return NextResponse.json({ isValid });
}
