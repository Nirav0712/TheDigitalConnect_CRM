import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import { AppShell } from '../components/layout/AppShell';

export const metadata: Metadata = {
  title: 'The Digital Connect CRM | Smart CRM & Marketing Suite',
  description: 'The Digital Connect CRM - Group of Chamunda Enterprise helps businesses manage contacts, leads, follow-ups, campaigns, and customer relationships in one platform.',
  icons: {
    icon: '/logo.png?v=4',
    shortcut: '/logo.png?v=4',
    apple: '/logo.png?v=4',
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
        <link rel="icon" href="/logo.png?v=4" type="image/png" />
        <link rel="shortcut icon" href="/logo.png?v=4" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png?v=4" />
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
