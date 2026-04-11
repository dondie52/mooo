import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LMHTS — Livestock Management & Health Tracking",
  description:
    "Digital livestock management for smallholder farmers in Botswana. BMC-compliant vaccination tracking, health monitoring, and analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
