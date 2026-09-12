import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PAU Drama Club workspace",
  description: "Attendance and digital archive workspace for the PAU Drama Club.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
