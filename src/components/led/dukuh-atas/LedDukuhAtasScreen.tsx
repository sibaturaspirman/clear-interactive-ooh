"use client";

import { useEffect, useState } from "react";

import { LedDukuhAtasLiveScreen } from "@/components/led/dukuh-atas/LedDukuhAtasLiveScreen";
import { LedDukuhAtasSharedLayers } from "@/components/led/dukuh-atas/LedDukuhAtasSharedLayers";
import { LedDukuhAtasStaticScreen } from "@/components/led/dukuh-atas/LedDukuhAtasStaticScreen";
import {
  DUKUH_ATAS_LIVE_HANDOFF_MS,
  DUKUH_ATAS_LIVE_LAYER_FADE_MS,
} from "@/lib/led/dukuh-atas/dukuh-atas-layout";

type LedDukuhAtasScreenProps = {
  phase: "static" | "live";
  disableAnimations?: boolean;
  debugActive?: boolean;
  holdStatic?: boolean;
  staticExiting?: boolean;
  introCycleKey?: number;
  liveReady?: boolean;
  photoUrl?: string;
  playbackQueueId?: number | null;
  playMs?: number;
  showQr?: boolean;
  holdLiveLayout?: boolean;
  idleTalentSrc?: string;
};

export function LedDukuhAtasScreen({
  phase,
  disableAnimations = false,
  debugActive = false,
  holdStatic = false,
  staticExiting = false,
  introCycleKey = 0,
  liveReady = false,
  photoUrl,
  playbackQueueId = null,
  playMs = 3000,
  showQr = true,
  holdLiveLayout = false,
  idleTalentSrc,
}: LedDukuhAtasScreenProps) {
  const liveMounted = !holdStatic;
  const liveVisible = !holdStatic && phase === "live" && liveReady;
  const showStatic = holdStatic || phase === "static";
  const [suppressLiveTalent, setSuppressLiveTalent] = useState(false);

  useEffect(() => {
    if (!liveVisible || holdLiveLayout) {
      setSuppressLiveTalent(false);
      return;
    }
    setSuppressLiveTalent(true);
    const delay = disableAnimations ? 0 : DUKUH_ATAS_LIVE_HANDOFF_MS + 450;
    const timer = window.setTimeout(() => {
      setSuppressLiveTalent(!photoUrl);
    }, delay);
    return () => clearTimeout(timer);
  }, [liveVisible, introCycleKey, photoUrl, disableAnimations, holdLiveLayout]);

  const liveFadeMs = disableAnimations ? 0 : DUKUH_ATAS_LIVE_LAYER_FADE_MS;

  return (
    <div className="relative size-full overflow-hidden">
      {debugActive ? ledDebugBadge(holdStatic, holdLiveLayout) : null}
      <div className="absolute inset-0 z-0">
        <LedDukuhAtasSharedLayers />
      </div>

      {liveMounted ? (
        <div
          className="absolute inset-0 z-[1] overflow-hidden transition-opacity ease-out"
          style={{
            opacity: liveVisible ? 1 : 0,
            transitionDuration: `${liveFadeMs}ms`,
            visibility: liveVisible ? "visible" : "hidden",
            pointerEvents: liveVisible ? "auto" : "none",
          }}
          aria-hidden={!liveVisible}
        >
          <LedDukuhAtasLiveScreen
            key={`live-${introCycleKey}`}
            liveActive={liveVisible}
            chromeRevealed={liveVisible}
            talentRevealed={liveVisible}
            disableAnimations={disableAnimations}
            suppressIdleTalent={!holdLiveLayout && suppressLiveTalent && !photoUrl}
            photoUrl={liveVisible && !holdLiveLayout ? photoUrl : undefined}
            playbackQueueId={
              liveVisible && !holdLiveLayout ? playbackQueueId : null
            }
            playMs={playMs}
            showQr={liveVisible && showQr}
            idleTalentSrc={idleTalentSrc}
          />
        </div>
      ) : null}

      {showStatic ? (
        <div className="absolute inset-0 z-[2] overflow-hidden">
          <LedDukuhAtasStaticScreen
            key={introCycleKey}
            disableAnimations={disableAnimations}
            exiting={staticExiting && !disableAnimations}
          />
        </div>
      ) : null}
    </div>
  );
}

function ledDebugBadge(holdStatic: boolean, holdLiveLayout: boolean) {
  const mode = holdStatic ? " · static" : holdLiveLayout ? " · live" : "";
  return (
    <div className="pointer-events-none absolute right-3 top-3 z-[60] rounded bg-black/70 px-2 py-1 font-mono text-xs text-amber-300">
      LED debug{mode}
    </div>
  );
}
