import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "Mental Health Dashboard",
  description: "Track your mental health journey with mood logging, journaling, and analytics.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
