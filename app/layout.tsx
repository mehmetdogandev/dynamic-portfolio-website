import type { Metadata } from 'next'
import {
  Cormorant_Garamond,
  Inter,
  JetBrains_Mono,
  Playfair_Display,
  Prata,
} from 'next/font/google'
import './globals.css'
import './theme-christmas.css'
import Providers from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'
import { HydrateClient } from '@/lib/trpc/server'

const fontSans = Inter({
  variable: '--font-sans-impl',
  subsets: ['latin'],
})

const fontSerif = Playfair_Display({
  variable: '--font-serif-impl',
  subsets: ['latin'],
})

const fontMono = JetBrains_Mono({
  variable: '--font-mono-impl',
  subsets: ['latin'],
})

const fontPrata = Prata({
  variable: '--font-prata-impl',
  subsets: ['latin'],
  weight: '400',
})

const fontCormorant = Cormorant_Garamond({
  variable: '--font-cormorant-impl',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Aksiyon Soft',
  description: 'Aksiyon Soft',
  icons: {
    icon: [
      {
        url: '/favicon_io/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon_io/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    shortcut: '/favicon_io/favicon.ico',
    apple: '/favicon_io/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const consoleCaptureScript = `
    (function() {
      if (typeof window === 'undefined') return;
      
      // Store logs in a global variable that persists across page navigations
      if (!window.__consoleLogs) {
        window.__consoleLogs = [];
      }
      
      const maxLogs = 100;
      const logs = window.__consoleLogs;
      
      // Store original console methods
      const originalConsole = {
        log: console.log.bind(console),
        error: console.error.bind(console),
        warn: console.warn.bind(console),
      };
      
      function safeArgToString(arg) {
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'bigint') return arg.toString();
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
        if (typeof arg === 'symbol' || typeof arg === 'function') return String(arg);

        if (arg instanceof Error) {
          const stack = arg.stack ? '\\n' + arg.stack : '';
          return (arg.name + ': ' + arg.message + stack).trim();
        }

        try {
          const seen = new WeakSet();
          return JSON.stringify(arg, function(_key, value) {
            if (typeof value === 'bigint') return value.toString();
            if (typeof value === 'function') return '[Function ' + (value.name || 'anonymous') + ']';
            if (typeof value === 'symbol') return value.toString();
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) return '[Circular]';
              seen.add(value);
            }
            return value;
          }, 2);
        } catch (e) {
          try {
            return String(arg);
          } catch {
            return '[Unserializable]';
          }
        }
      }

      // Helper to format log arguments
      function formatLogArgs(args) {
        return args.map(function(arg) {
          if (typeof arg === 'string') {
            return arg;
          }
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }).join(' ');
      }
      
      // Override console methods
      console.log = function() {
        const args = Array.prototype.slice.call(arguments);
        const message = formatLogArgs(args);
        logs.push({
          timestamp: Date.now(),
          level: 'log',
          message: message,
          args: args.length > 1 ? args.map(safeArgToString) : undefined,
        });
        // Keep only the last maxLogs entries
        if (logs.length > maxLogs) {
          logs.shift();
        }
        originalConsole.log.apply(console, args);
      };
      
      console.error = function() {
        const args = Array.prototype.slice.call(arguments);
        const message = formatLogArgs(args);
        logs.push({
          timestamp: Date.now(),
          level: 'error',
          message: message,
          args: args.length > 1 ? args.map(safeArgToString) : undefined,
        });
        // Keep only the last maxLogs entries
        if (logs.length > maxLogs) {
          logs.shift();
        }
        originalConsole.error.apply(console, args);
      };
      
      console.warn = function() {
        const args = Array.prototype.slice.call(arguments);
        const message = formatLogArgs(args);
        logs.push({
          timestamp: Date.now(),
          level: 'warn',
          message: message,
          args: args.length > 1 ? args.map(safeArgToString) : undefined,
        });
        // Keep only the last maxLogs entries
        if (logs.length > maxLogs) {
          logs.shift();
        }
        originalConsole.warn.apply(console, args);
      };
    })();
  `

  return (
    <html
      suppressHydrationWarning
      lang="tr"
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} ${fontPrata.variable} ${fontCormorant.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: consoleCaptureScript }} />
      </head>
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} ${fontPrata.variable} ${fontCormorant.variable} font-sans antialiased`}
      >
        <Providers>
          <HydrateClient>{children}</HydrateClient>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
