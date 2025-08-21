// src/app/layout.js  (server component; no "use client")
import { Geist, Geist_Mono, Play } from "next/font/google";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "./globals.css";
import "@mantine/dates/styles.css";
import Head from "next/head";
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

export const metadata = {
  title: "Habify",
  description: "Track your habits with Habify",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${play.variable}`}
    >
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#9333ea" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </Head>
      <body className="antialiased">
        <MantineProvider withGlobalStyles withNormalizeCSS>
          <ClientRoot>{children}</ClientRoot>
        </MantineProvider>
      </body>
    </html>
  );
}
