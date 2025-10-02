import { Geist, Geist_Mono, Play } from "next/font/google";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";

import ClientRoot from "./ClientRoot";
import { createRscClient } from "../services/supabase/server";

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
export const viewport = { 
  themeColor: "#0a0a0a"
};

export default async function RootLayout({ children }) {
  const supabase = await createRscClient(); // read-only client
  const { data: { user } = { user: null } } = await supabase.auth.getUser();

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
