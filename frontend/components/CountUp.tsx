"use client";
import { useEffect, useRef, useState } from "react";

export default function CountUp({ value, prefix = "", suffix = "", decimals = 0, dur = 1100 }:
  { value: number; prefix?: string; suffix?: string; decimals?: number; dur?: number }) {
  const [n, setN] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return; started.current = true;
    const t0 = performance.now();
    const tick = (t: number) => {
      let p = Math.min(1, (t - t0) / dur); p = 1 - Math.pow(1 - p, 3);
      setN(value * p);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, dur]);
  return <>{prefix}{n.toFixed(decimals)}{suffix}</>;
}
