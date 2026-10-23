"use client";

import { useMemo, useSyncExternalStore } from "react";

const MINUTE = 60_000;

function subscribe(onChange: () => void): () => void {
  const timer = window.setInterval(onChange, 15_000);
  return () => window.clearInterval(timer);
}

/** Current minute as a stable number so the snapshot only changes once a minute. */
function currentMinute(): number {
  return Math.floor(Date.now() / MINUTE);
}

function serverMinute(): null {
  return null;
}

/**
 * The current time, or null during server rendering and hydration. Anything
 * derived from "now" must wait for the client value to avoid hydration drift.
 */
export function useClinicNow(): Date | null {
  const minute = useSyncExternalStore(subscribe, currentMinute, serverMinute);
  return useMemo(() => (minute === null ? null : new Date(minute * MINUTE)), [minute]);
}
