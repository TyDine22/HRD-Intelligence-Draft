import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Albert_Sans } from "next/font/google";

import { Providers } from "@/components/providers/providers";
import "./globals.css";

const albertSans = Albert_Sans({
  subsets: ["latin"],
  variable: "--font-albert-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HRD Intelligence",
    template: "%s · HRD Intelligence",
  },
  description: "AI-powered HRD management platform for students, alumni, attendance, allowances and insights.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${albertSans.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
