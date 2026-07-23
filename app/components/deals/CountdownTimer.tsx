"use client";

import { useEffect, useState } from "react";

const INITIAL_SECONDS = 5 * 3600 + 30 * 60;

function splitDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

export function CountdownTimer() {
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { hours, minutes, seconds } = splitDuration(secondsLeft);

  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-outline-variant bg-white p-4 shadow-md">
      <span className="text-sm text-on-surface-variant">Ends in:</span>
      <div className="flex gap-3 text-2xl font-bold text-error" aria-live="polite">
        <div className="flex flex-col items-center">
          {hours.toString().padStart(2, "0")}
          <span className="text-[10px] font-normal uppercase">h</span>
        </div>
        <span>:</span>
        <div className="flex flex-col items-center">
          {minutes.toString().padStart(2, "0")}
          <span className="text-[10px] font-normal uppercase">m</span>
        </div>
        <span>:</span>
        <div className="flex flex-col items-center">
          {seconds.toString().padStart(2, "0")}
          <span className="text-[10px] font-normal uppercase">s</span>
        </div>
      </div>
    </div>
  );
}
