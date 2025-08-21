"use client";

import { useEffect, useState } from "react";
import Nav from "@/app/components/nav";

export default function ClientRoot({ children }) {
  // If you had splash state logic here, remove it or adapt for your new login
  return (
    <>
      <Nav />
      {children}
    </>
  );
}
