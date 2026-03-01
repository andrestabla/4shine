import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { UserProvider } from '@/context/UserContext';
import { AppDialogProvider } from '@/components/ui/AppDialogProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '4Shine Platform',
  description: 'Plataforma ejecutiva de liderazgo y mentoring',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className} suppressHydrationWarning={true}>
        <UserProvider>
          <AppDialogProvider>{children}</AppDialogProvider>
        </UserProvider>
      </body>
    </html>
  );
}
