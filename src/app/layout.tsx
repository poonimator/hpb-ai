import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TopNavbar } from "@/components/layout/top-navbar";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HPB AI Tool",
  description: "Internal HPB tools for interview rehearsal and question quality analysis",
  creator: "Swapnil Bapat",
  other: { "created-by": "Created by Swapnil Bapat © 2026" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.variable} suppressHydrationWarning>
        {/* Mobile disclaimer — desktop-only app */}
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-8 md:hidden">
          <div className="flex flex-col items-center text-center max-w-sm">
            <img src="/hpb-logo.png" alt="HPB Logo" className="h-12 w-auto object-contain mb-6" />
            <h1 className="text-display-3 mb-2">Desktop Only</h1>
            <p className="text-body-sm text-muted-foreground">
              This tool is optimised for laptop and desktop screens. Please switch to a device with a larger display to continue.
            </p>
          </div>
        </div>

        {/* App shell — hidden on mobile */}
        <div className="hidden md:flex h-screen overflow-hidden flex-col bg-background text-foreground">
          <TopNavbar />
          <main className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
            {children}
          </main>
          {/* Footer frame matches the TopNav: full-width, px-7, no max-width */}
          <footer className="w-full border-t border-[color:var(--border-subtle)] bg-[color:var(--surface)]">
            <div className="flex items-center justify-between gap-4 px-7 py-4">
              <p className="text-caption text-muted-foreground">Version 1.0.0. Aleph Pte Ltd.</p>
              <div className="flex items-center gap-5 text-caption">
                <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Use</a>
                <span className="text-[color:var(--border-subtle)]">|</span>
                <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Statement</a>
              </div>
            </div>
          </footer>
        </div>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--surface)",
              color: "var(--ink)",
              borderRadius: "var(--radius-card)",
              boxShadow: "var(--shadow-outline-ring)",
              fontSize: "13.5px",
              letterSpacing: "0.01em",
              fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
            },
            className: "hpb-toast",
          }}
        />
      </body>
    </html>
  );
}
