import type { Metadata } from "next";
import { FloatingMapButton } from "@/components/floating-map-button";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nature Log",
  description:
    "A collectible field journal for logging wildlife, plants, maps, and richly tagged nature cards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <FloatingMapButton />
      </body>
    </html>
  );
}
