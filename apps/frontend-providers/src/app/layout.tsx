import type { Metadata } from 'next';
import { Fraunces, Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });
const hanken = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken', display: 'swap' });

export const metadata: Metadata = {
  title: 'WorkArmy for Business',
  description: 'Hire and manage your workforce — employers, farms, contractors and agencies.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${fraunces.variable} ${hanken.variable}`}>
      <body className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#1E293B] antialiased">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
