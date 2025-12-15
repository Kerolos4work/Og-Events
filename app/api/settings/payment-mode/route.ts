import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read the current settings file
    const settingsPath = path.resolve(process.cwd(), 'config/settings.json');
    const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    // Return the payment mode
    return NextResponse.json({ mode: settingsData.payment.mode });
  } catch (error) {
    console.error('Error fetching payment mode:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment mode' },
      { status: 500 }
    );
  }
}
