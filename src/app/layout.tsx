import type { ReactNode } from 'react';

export const metadata = { title: 'Humanity', description: 'Your Own World' };
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
