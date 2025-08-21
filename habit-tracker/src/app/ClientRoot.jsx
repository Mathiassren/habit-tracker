"use client";

import { useState } from "react";
import SplashScreen from "@/app/components/SplashScreen";
import Nav from "@/app/components/nav";

export default function ClientRoot({ children }) {
  const [ready, setReady] = useState(false);

  return (
    <>
      {!ready && <SplashScreen onFinish={() => setReady(true)} />}
      {ready && (
        <>
          <Nav />
          {children}
        </>
      )}
    </>
  );
}
