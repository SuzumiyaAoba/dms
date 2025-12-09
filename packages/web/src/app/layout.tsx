import type { Metadata } from 'next';
import 'katex/dist/katex.min.css';
import './globals.css';
import { SyncDirectoriesProvider } from '@/shared/providers/sync-directories';

export const metadata: Metadata = {
  title: 'DMS',
  description: 'Document Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SyncDirectoriesProvider>{children}</SyncDirectoriesProvider>
      </body>
    </html>
  );
}
