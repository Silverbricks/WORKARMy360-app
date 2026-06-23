import type { Metadata } from 'next';
import { Fraunces, Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import { Logo } from '@workarmy/ui';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });
const hanken = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken', display: 'swap' });

export const metadata: Metadata = {
  title: 'WorkArmy Admin',
  description: 'Platform operations — verification, moderation and the workforce directory.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${fraunces.variable} ${hanken.variable}`}>
      <body className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#1E293B] antialiased">
        <header className="sticky top-0 z-40 border-b border-[#2A2F36] bg-[#1B1F24]">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
            <span className="inline-flex items-center gap-2">
              <Logo onDark />
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-medium text-white">Admin</span>
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4">{children}</main>
      </body>
    </html>
  );
}
