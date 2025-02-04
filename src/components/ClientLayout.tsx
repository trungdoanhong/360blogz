'use client';

import { Toaster } from 'react-hot-toast';

export default function ClientLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <body className={className} suppressHydrationWarning>
      <Toaster position="bottom-right" />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
    </body>
  );
} 