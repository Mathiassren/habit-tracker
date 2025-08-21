// src/app/layout.js (server component)
import { Geist, Geist_Mono, Play } from "next/font/google";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "./globals.css";
import "@mantine/dates/styles.css";
import ClientRoot from "./ClientRoot";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});
const play = Play({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-play",
});

// ✅ App Router: manifest + icons here
export const metadata = {
  title: "Habify",
  description: "Track your habits with Habify",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

// ✅ App Router: themeColor goes in viewport export (fixes your warning)
export const viewport = {
  themeColor: "#9333EA",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${play.variable}`}
    >
      <body className="antialiased">
        <MantineProvider withGlobalStyles withNormalizeCSS>
          <ClientRoot>{children}</ClientRoot>
        </MantineProvider>
      </body>
    </html>
  );
}
