import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TopNavbar } from "@/components/layout/top-navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HPB AI Tool",
  description: "Internal HPB tools for interview rehearsal and question quality analysis",
  creator: "Swapnil Bapat",
  other: {
    "created-by": "Created by Swapnil Bapat © 2026",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Mobile disclaimer — visible only on small screens */}
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white p-8 md:hidden">
          <div className="flex flex-col items-center text-center max-w-sm">
            <img
              src="/hpb-logo.png"
              alt="HPB Logo"
              className="h-12 w-auto object-contain mb-6"
            />
            <h1 className="text-xl font-semibold tracking-tight text-foreground mb-2">
              Desktop Only
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This tool is optimised for laptop and desktop screens. Please switch to a device with a larger display to continue.
            </p>
          </div>
        </div>

        {/* App shell — hidden on mobile */}
        <div className="hidden md:flex min-h-screen flex-col bg-background text-foreground">
          <TopNavbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </main>
          <footer className="w-full py-4 mt-12 border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  Version 1.0.0. Aleph Pte Ltd.
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Use
                  </a>
                  <span className="text-border">|</span>
                  <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Statement
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
