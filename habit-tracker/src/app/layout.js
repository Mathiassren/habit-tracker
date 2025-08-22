// src/app/layout.js
import { Geist, Geist_Mono, Play } from "next/font/google";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";
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

// App Router generates <head> for you from this:
export const metadata = {
  title: "Habify",
  description: "Track your habits with Habify",
};

// Next.js wants viewport (incl. themeColor) here:
export const viewport = {
  themeColor: "#9333ea",
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
