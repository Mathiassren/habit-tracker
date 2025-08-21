"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function SplashScreen({ onFinish, durationMs = 2000 }) {
  const [visible, setVisible] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, durationMs);
    return () => clearTimeout(t);
  }, [durationMs, onFinish]);

  if (!visible) return null;

  // Timing helpers
  const tIn = 0.7;
  const tOut = 0.5;

  // Breathing ring (one gentle pulse)
  const ringAnim = useMemo(
    () =>
      reduceMotion
        ? {}
        : {
            scale: [0.9, 1.05, 1],
            opacity: [0.0, 0.35, 0.0],
            transition: { duration: 1.6, ease: "easeInOut", delay: 0.4 },
          },
    [reduceMotion]
  );

  // Floating blobs
  const blobAnimA = useMemo(
    () =>
      reduceMotion
        ? {}
        : {
            y: [0, -10, 0],
            x: [0, 6, 0],
            transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          },
    [reduceMotion]
  );

  const blobAnimB = useMemo(
    () =>
      reduceMotion
        ? {}
        : {
            y: [0, 10, 0],
            x: [0, -6, 0],
            transition: { duration: 4.6, repeat: Infinity, ease: "easeInOut" },
          },
    [reduceMotion]
  );

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#0b0b0f]">
      {/* Blurry gradient blobs */}
      <motion.div
        className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(40% 40% at 50% 50%, #a78bfa 0%, #7e22ce 60%, transparent 70%)",
          opacity: 0.65,
        }}
        animate={blobAnimA}
      />
      <motion.div
        className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(40% 40% at 50% 50%, #f0abfc 0%, #9333ea 60%, transparent 70%)",
          opacity: 0.55,
        }}
        animate={blobAnimB}
      />

      {/* Center content */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative flex items-center justify-center">
          {/* Breathing ring */}
          {!reduceMotion && (
            <motion.div
              className="absolute inset-0 grid place-items-center"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={ringAnim}
            >
              <div className="w-44 h-44 rounded-full border border-purple-300/30" />
            </motion.div>
          )}

          {/* Logo / wordmark */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: tIn, ease: "easeOut" }}
            className="relative"
          >
            {/* Replace with your SVG logo if you have one */}
            <div className="text-5xl font-extrabold tracking-wide">
              <span className="bg-gradient-to-r from-[#a78bfa] via-[#9333ea] to-[#7e22ce] bg-clip-text text-transparent">
                Habify
              </span>
            </div>
            <div className="text-center text-sm text-gray-400 mt-2">
              breathe in • breathe out
            </div>
          </motion.div>
        </div>
      </div>

      {/* Fade out overlay for a smooth exit */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        exit={{ opacity: 1 }}
        transition={{
          duration: tOut,
          ease: "easeInOut",
          delay: (durationMs - 300) / 1000,
        }}
      />
    </div>
  );
}
