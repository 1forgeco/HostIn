import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hostin — Run your PG like a real business",
  description: "A fully managed hostel and PG operating system by 1Forge for rooms, tenants, rent, gate passes, complaints, mess, staff, and parents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = window.localStorage.getItem("hostin-color-theme") || "hostin-coral";
                document.documentElement.dataset.theme = theme;
                if (theme === "custom") {
                  var hex = window.localStorage.getItem("hostin-custom-color") || "#22a06b";
                  var parse = function(value) { return [1, 3, 5].map(function(index) { return parseInt(value.slice(index, index + 2), 16); }); };
                  var mix = function(target, weight) { var source = parse(hex); var destination = parse(target); return "#" + source.map(function(value, index) { return Math.round(value + (destination[index] - value) * weight).toString(16).padStart(2, "0"); }).join(""); };
                  var rgb = parse(hex).join(", ");
                  var vars = { "--accent": hex, "--accent-strong": mix("#000000", .2), "--accent-soft": mix("#ffffff", .9), "--accent-soft-border": mix("#ffffff", .68), "--accent-gradient-start": mix("#ffffff", .18), "--accent-gradient-end": mix("#000000", .16), "--accent-shadow": "rgba(" + rgb + ", .22)", "--accent-focus": "rgba(" + rgb + ", .16)", "--nav-active-start": mix("#ffffff", .92), "--nav-active-end": mix("#ffffff", .96) };
                  Object.keys(vars).forEach(function(name) { document.documentElement.style.setProperty(name, vars[name]); });
                }
              } catch (error) {
                document.documentElement.dataset.theme = "hostin-coral";
              }
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
