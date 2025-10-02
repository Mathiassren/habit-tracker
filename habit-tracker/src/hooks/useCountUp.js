"use client";

import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for animating numbers from 0 to a target value
 * @param {number} end - The target value to animate to
 * @param {number} duration - Duration of animation in milliseconds
 * @param {number} start - Starting value (default: 0)
 * @returns {number} The current animated value
 */
export function useCountUp(end, duration = 1000, start = 0) {
  const [count, setCount] = useState(start);
  const frameRef = useRef();
  const startTimeRef = useRef();
  const startValueRef = useRef(start);

  useEffect(() => {
    // If end value is the same as current, no need to animate
    if (end === count) return;

    // Reset animation state
    startValueRef.current = count;
    startTimeRef.current = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValueRef.current + (end - startValueRef.current) * easeOut;
      
      setCount(currentValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we end exactly at the target value
        setCount(end);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return count;
}

export default useCountUp;



