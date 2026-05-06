import type { ReactNode } from "react";
import "./globals.css";
import Providers from "@/components/Providers";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Mental Health Dashboard",
  description: "Track your mental health journey with mood logging, journaling, and analytics.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <main className="flex-1 animate-page-in">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}