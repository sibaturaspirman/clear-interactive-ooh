"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createBroadSignStarter,
  installBroadSignPlay,
} from "@/lib/led/cityvision/broadsign-play";

/** When `enabled`, playback waits for BroadSignPlay / postMessage / ?autoplay=1. */
export function useBroadSignPlay(enabled: boolean) {
  const [started, setStarted] = useState(!enabled);

  const markStarted = useCallback(() => {
    setStarted(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStarted(true);
      return;
    }

    setStarted(false);
    const start = createBroadSignStarter(markStarted);
    return installBroadSignPlay(start);
  }, [enabled, markStarted]);

  return { broadSignStarted: started };
}
