import type { ReactNode } from "react";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "Mental Health Dashboard",
  description: "Track your mental health journey with mood logging, journaling, and analytics.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="animate-page-in">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
