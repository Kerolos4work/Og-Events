import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { PendingBookingRedirect } from '@/components/pending-booking-redirect';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LanguageDirection } from '@/components/LanguageDirection';
import './globals.css';

const defaultUrl = process.env.NEXT_PUBLIC_BASE_URL
  ? process.env.NEXT_PUBLIC_BASE_URL
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Seat Map',
  description: 'Interactive seat map for event booking',
};

const geistSans = Geist({
  variable: '--font-geist-sans',
  display: 'swap',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning dir="ltr">
      <body className={`${geistSans.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <LanguageDirection>
              <PendingBookingRedirect />
              {children}
            </LanguageDirection>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
