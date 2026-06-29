import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hostin — Run your PG like a real business",
  description: "A fully managed hostel and PG operating system by 1Forge for rooms, tenants, rent, gate passes, complaints, mess, staff, and parents.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "700x700", type: "image/png" },
    ],
    shortcut: "/icons/favicon-32x32.png",
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Hostin" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
