import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dropfile — Share files, instantly',
  description: 'Upload any file and share it with a single link. No compression, no conversion.',
  openGraph: {
    title: 'Dropfile — Share files, instantly',
    description: 'Upload any file and share it with a single link.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
