import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: {
    template: 'YUGENANIME - %s',
    default: 'YUGENANIME - Home',
  },
  description: 'High-performance YugenAnime rebuild with handcrafted architecture and desktop UI feel.',
  themeColor: '#22c55e',
  openGraph: {
    title: 'YUGENANIME - Watch Anime for Free',
    description: 'High-performance YugenAnime rebuild with handcrafted architecture and desktop UI feel.',
    siteName: 'YUGENANIME',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YUGENANIME - Watch Anime for Free',
    description: 'High-performance YugenAnime rebuild with handcrafted architecture and desktop UI feel.',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
