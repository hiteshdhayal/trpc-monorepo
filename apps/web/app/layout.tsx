import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";
import { ErrorBoundary } from "~/components/error-boundary";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "FinalForms | Beautiful Typeform-Style Form Builder",
  description:
    "Create premium interactive forms, shareable links, and gather insights with advanced analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ErrorBoundary>
          <GlobalProviders>{children}</GlobalProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
