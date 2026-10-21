"use client";

import { useEffect, useState } from "react";

import { LedRatuPlazaLiveScreen } from "@/components/led/ratu-plaza/LedRatuPlazaLiveScreen";
import { LedRatuPlazaSharedLayers } from "@/components/led/ratu-plaza/LedRatuPlazaSharedLayers";
import { LedRatuPlazaStaticScreen } from "@/components/led/ratu-plaza/LedRatuPlazaStaticScreen";
import {
  RATU_PLAZA_LIVE_HANDOFF_MS,
  RATU_PLAZA_LIVE_LAYER_FADE_MS,
} from "@/lib/led/ratu-plaza/ratu-plaza-layout";

type LedRatuPlazaScreenProps = {
  phase: "static" | "live";
  disableAnimations?: boolean;
  debugActive?: boolean;
  holdStatic?: boolean;
  staticExiting?: boolean;
  introCycleKey?: number;
  liveReady?: boolean;
  photoUrl?: string;
  participantName?: string;
  playbackQueueId?: number | null;
  playMs?: number;
  showQr?: boolean;
  holdLiveLayout?: boolean;
  idleTalentSrc?: string;
};

export function LedRatuPlazaScreen({
  phase,
  disableAnimations = false,
  debugActive = false,
  holdStatic = false,
  staticExiting = false,
  introCycleKey = 0,
  liveReady = false,
  photoUrl,
  participantName,
  playbackQueueId = null,
  playMs = 3000,
  showQr = true,
  holdLiveLayout = false,
  idleTalentSrc,
}: LedRatuPlazaScreenProps) {
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
    const delay = disableAnimations ? 0 : RATU_PLAZA_LIVE_HANDOFF_MS + 450;
    const timer = window.setTimeout(() => {
      setSuppressLiveTalent(!photoUrl);
    }, delay);
    return () => clearTimeout(timer);
  }, [liveVisible, introCycleKey, photoUrl, disableAnimations, holdLiveLayout]);

  const liveFadeMs = disableAnimations ? 0 : RATU_PLAZA_LIVE_LAYER_FADE_MS;

  return (
    <div className="relative size-full overflow-hidden">
      {debugActive ? ledDebugBadge(holdStatic, holdLiveLayout) : null}
      <div className="absolute inset-0 z-0">
        <LedRatuPlazaSharedLayers />
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
          <LedRatuPlazaLiveScreen
            key={`live-${introCycleKey}`}
            liveActive={liveVisible}
            chromeRevealed={liveVisible}
            talentRevealed={liveVisible}
            disableAnimations={disableAnimations}
            suppressIdleTalent={!holdLiveLayout && suppressLiveTalent && !photoUrl}
            photoUrl={liveVisible && !holdLiveLayout ? photoUrl : undefined}
            participantName={liveVisible ? participantName : undefined}
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
          <LedRatuPlazaStaticScreen
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
