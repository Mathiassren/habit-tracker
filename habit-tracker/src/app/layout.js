// src/app/layout.js

import { Geist, Geist_Mono, Play } from "next/font/google";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import ClientRoot from "./ClientRoot"; // make sure the file is exactly "ClientRoot.jsx"

// Fonts
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

export const viewport = { themeColor: "#9333ea" };

export default async function RootLayout({ children }) {
  // 🔑 Read-only Supabase client (prevents illegal cookie writes in Server Components)
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {}, // noop: block cookie writes
        remove: () => {}, // noop: block cookie deletes
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${play.variable}`}
    >
      <body className="antialiased">
        <MantineProvider withGlobalStyles withNormalizeCSS>
          <ClientRoot user={user}>{children}</ClientRoot>
        </MantineProvider>
      </body>
    </html>
  );
}
