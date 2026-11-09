// src/app/layout.tsx
import './globals.css';
import './admin.css';
import './polish.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'KamarKu — Hotel & Retreat',
  description: 'Temukan kamar, fasilitas, menu, dan pengalaman menginap yang tepat di KamarKu.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  );
}

