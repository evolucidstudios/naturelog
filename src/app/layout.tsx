import type { Metadata } from "next";
import { CopyrightBadge } from "@/components/copyright-badge";
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
      <body className="min-h-screen">
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <CopyrightBadge />
        </div>
      </body>
    </html>
  );
}
