import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Shift Sense",
  description: "End shift-hunting hell for NHS bank staff.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(
        "min-h-screen bg-slate-50 font-sans antialiased text-slate-900 dark:bg-slate-950 dark:text-slate-50",
        inter.variable
      )}>
        {children}
      </body>
    </html>
  );
}
