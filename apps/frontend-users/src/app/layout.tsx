import type { Metadata } from 'next';
import { Fraunces, Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import { SiteChrome } from '@/components/SiteChrome';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });
const hanken = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken', display: 'swap' });

export const metadata: Metadata = {
  title: 'WorkArmy — Find Work',
  description: 'Australia’s workforce, connected. Find work across farms, trades, care and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${fraunces.variable} ${hanken.variable}`}>
      <body className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#1E293B] antialiased">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
