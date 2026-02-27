import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Attendance Admin",
  description: "Admin panel for smart attendance management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased font-sans"
      >
        {children}
      </body>
    </html>
  );
}
