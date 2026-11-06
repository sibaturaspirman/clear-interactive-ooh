"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import { LedMicrositeQr } from "@/components/led/LedMicrositeQr";
import { LedParticipantNameCrossfade } from "@/components/led/LedParticipantNameCrossfade";
import { LedPublicImage } from "@/components/led/LedPublicImage";
import { LedSudirmanLayerImage } from "@/components/led/sudirman/LedSudirmanLayerImage";
import { LedSudirmanLiveAnimatedLayer } from "@/components/led/sudirman/LedSudirmanLiveAnimatedLayer";
import { LedSudirmanTalentCrossfade } from "@/components/led/sudirman/LedSudirmanTalentCrossfade";
import {
  SUDIRMAN_ASSETS,
  SUDIRMAN_LAYOUT_LIVE,
  SUDIRMAN_LIVE_PACK_FLOAT_CYCLE_MS,
  SUDIRMAN_LIVE_PACK_FLOAT_DELAY_MS,
  SUDIRMAN_STATIC_FADE_OUT_MS,
} from "@/lib/led/sudirman/sudirman-layout";

type LedSudirmanLiveScreenProps = {
  locationCode: string;
  /** Pack handoff + full live layers (intro→live). */
  liveActive?: boolean;
  /** Tagline + QR (may start under intro fade). */
  chromeRevealed?: boolean;
  /** Live talent slot — after static fully handoff. */
  talentRevealed?: boolean;
  disableAnimations?: boolean;
  /** Hide idle `bei-talent` briefly after intro handoff (same asset as intro). */
  suppressIdleTalent?: boolean;
  photoUrl?: string;
  participantName?: string;
  playbackQueueId?: number | null;
  playMs?: number;
  /** QR frame + static code (default on for live layout). */
  showQr?: boolean;
  idleTalentSrc?: string;
  nameLayoutDebug?: boolean;
};

/** BEI idle + playback — staggered enter after intro; talent crossfade on API changes. */
export function LedSudirmanLiveScreen({
  locationCode,
  liveActive = true,
  chromeRevealed = true,
  talentRevealed = true,
  disableAnimations = false,
  suppressIdleTalent = false,
  photoUrl,
  participantName,
  playbackQueueId = null,
  playMs = 3000,
  showQr = true,
  idleTalentSrc,
  nameLayoutDebug,
}: LedSudirmanLiveScreenProps) {
  const showQrBlock = showQr;
  const qrBox = SUDIRMAN_LAYOUT_LIVE.qrFrame;
  const [liveEntered, setLiveEntered] = useState(false);
  const [packExiting, setPackExiting] = useState(false);
  const liveEnteredRef = useRef(false);
  liveEnteredRef.current = liveEntered;

  const [chromeEntered, setChromeEntered] = useState(false);
  const [talentEntered, setTalentEntered] = useState(false);

  useEffect(() => {
    if (!chromeRevealed) {
      setChromeEntered(false);
      return;
    }
    if (disableAnimations) {
      setChromeEntered(true);
      return;
    }
    const frame = requestAnimationFrame(() => setChromeEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [chromeRevealed, disableAnimations]);

  useEffect(() => {
    if (!talentRevealed) {
      setTalentEntered(false);
      return;
    }
    if (disableAnimations) {
      setTalentEntered(true);
      return;
    }
    const frame = requestAnimationFrame(() => setTalentEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [talentRevealed, disableAnimations]);

  useEffect(() => {
    if (!liveActive) {
      if (disableAnimations) {
        setPackExiting(false);
        setLiveEntered(false);
        return;
      }
      if (liveEnteredRef.current) {
        setPackExiting(true);
        const timer = window.setTimeout(() => {
          setPackExiting(false);
          setLiveEntered(false);
        }, SUDIRMAN_STATIC_FADE_OUT_MS);
        return () => clearTimeout(timer);
      }
      setPackExiting(false);
      setLiveEntered(false);
      return;
    }
    if (disableAnimations) {
      setPackExiting(false);
      setLiveEntered(true);
      return;
    }
    setPackExiting(false);
    const frame = requestAnimationFrame(() => setLiveEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [liveActive, disableAnimations]);

  return (
    <>
      {chromeRevealed ? (
        <LedSudirmanLayerImage
          src={SUDIRMAN_ASSETS.clearLive}
          alt="Clear x Oracle Red Bull Racing"
          box={SUDIRMAN_LAYOUT_LIVE.clear}
          className="object-contain object-left-top"
        />
      ) : null}

      <LedSudirmanLiveAnimatedLayer
        box={SUDIRMAN_LAYOUT_LIVE.packGroup}
        layerId="packGroup"
        enterOrder={0}
        slideEnter="right"
        slideExitLeft
        exiting={packExiting}
        liveEntered={liveEntered}
        disableAnimations={disableAnimations}
      >
        <div
          className={
            disableAnimations || !liveEntered
              ? "relative size-full"
              : "led-bei-live-pack-float relative size-full"
          }
          style={
            disableAnimations || !liveEntered
              ? undefined
              : ({
                  "--bei-live-pack-float-ms": `${SUDIRMAN_LIVE_PACK_FLOAT_CYCLE_MS}ms`,
                  "--bei-live-pack-float-delay-ms": `${SUDIRMAN_LIVE_PACK_FLOAT_DELAY_MS}ms`,
                } as CSSProperties)
          }
        >
          <LedSudirmanLayerImage
            src={SUDIRMAN_ASSETS.packGroup}
            alt=""
            box={SUDIRMAN_LAYOUT_LIVE.packGroup}
            fillSlot
            className="object-contain object-left-top"
          />
        </div>
      </LedSudirmanLiveAnimatedLayer>

      {chromeRevealed ? (
        <LedSudirmanLiveAnimatedLayer
          box={SUDIRMAN_LAYOUT_LIVE.tagline}
          layerId="tagline"
          enterOrder={1}
          slideEnter="right"
          liveEntered={chromeEntered}
          disableAnimations={disableAnimations}
        >
          <LedSudirmanLayerImage
            src={SUDIRMAN_ASSETS.tagline}
            alt="Is clearly controlled"
            box={SUDIRMAN_LAYOUT_LIVE.tagline}
            fillSlot
            className="object-contain object-left-top"
          />
        </LedSudirmanLiveAnimatedLayer>
      ) : null}

      {chromeRevealed ? (
        <LedParticipantNameCrossfade
          slot={SUDIRMAN_LAYOUT_LIVE.participantName}
          nama={participantName}
          playbackQueueId={playbackQueueId}
          playMs={playMs}
          disableAnimations={disableAnimations}
          layoutDebug={
            nameLayoutDebug ??
            (Boolean(participantName?.trim()) && playbackQueueId == null)
          }
        />
      ) : null}

      {chromeRevealed && showQrBlock ? (
        <LedSudirmanLiveAnimatedLayer
          box={qrBox}
          layerId="qrFrame"
          enterOrder={2}
          visible
          liveEntered={chromeEntered}
          disableAnimations={disableAnimations}
          className="z-[4]"
        >
          <LedSudirmanLayerImage
            src={SUDIRMAN_ASSETS.qrFrame}
            alt=""
            box={qrBox}
            fillSlot
            className="object-contain"
          />
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: `${SUDIRMAN_LAYOUT_LIVE.qrInset.left * 100}%`,
              top: `${SUDIRMAN_LAYOUT_LIVE.qrInset.top * 100}%`,
              width: `${SUDIRMAN_LAYOUT_LIVE.qrInset.width * 100}%`,
              height: `${SUDIRMAN_LAYOUT_LIVE.qrInset.height * 100}%`,
            }}
          >
            <div className="relative size-full">
              <LedMicrositeQr
                locationCode={locationCode}
                staticSrc={SUDIRMAN_ASSETS.qrCode}
                alt="QR microsite"
                className="absolute inset-0 size-full object-contain"
              />
            </div>
          </div>
        </LedSudirmanLiveAnimatedLayer>
      ) : null}

      {talentRevealed ? (
        suppressIdleTalent && !photoUrl ? null : (
          <LedSudirmanTalentCrossfade
            photoUrl={photoUrl}
            playbackQueueId={playbackQueueId}
            playMs={playMs}
            idleTalentSrc={idleTalentSrc}
            disableAnimations={disableAnimations}
            liveEntered={talentEntered}
            enterOrder={3}
          />
        )
      ) : null}
    </>
  );
}
