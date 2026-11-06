import { Outfit, Public_Sans } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { LibraryProvider } from "@/context/LibraryContext";
import "./globals.css";

const sans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });
const display = Outfit({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata = {
  title: "SmartLib",
  description: "IoT-based smart library seat management: live monitoring, reservations and analytics.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        {/* One provider for every interface (admin, student site, kiosk) */}
        <AuthProvider>
          <LibraryProvider>{children}</LibraryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
