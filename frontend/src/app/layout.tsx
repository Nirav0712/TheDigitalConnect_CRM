import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import { AppShell } from '../components/layout/AppShell';

export const metadata: Metadata = {
  title: 'The Crystal Engage CRM | Smart CRM & Marketing Suite',
  description: 'The Crystal Engage CRM - Group of Chamunda Enterprise helps businesses manage contacts, leads, follow-ups, campaigns, and customer relationships in one platform.',
  icons: {
    icon: [
      { url: '/favicon.png?v=6', type: 'image/png' },
      { url: '/logo.png?v=6', type: 'image/png' },
    ],
    shortcut: '/favicon.png?v=6',
    apple: '/favicon.png?v=6',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.png?v=6" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png?v=6" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png?v=6" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full font-sans antialiased overflow-hidden">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
