"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import { LedGbkLayerImage } from "@/components/led/gbk/LedGbkLayerImage";
import { LedGbkLiveAnimatedLayer } from "@/components/led/gbk/LedGbkLiveAnimatedLayer";
import { LedGbkTalentCrossfade } from "@/components/led/gbk/LedGbkTalentCrossfade";
import {
  GBK_ASSETS,
  GBK_LAYOUT_LIVE,
  GBK_LIVE_PACK_FLOAT_CYCLE_MS,
  GBK_LIVE_PACK_FLOAT_DELAY_MS,
  GBK_STATIC_FADE_OUT_MS,
} from "@/lib/led/gbk/gbk-layout";

type LedGbkLiveScreenProps = {
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
  playbackQueueId?: number | null;
  playMs?: number;
  /** QR frame + static code (default on for live layout). */
  showQr?: boolean;
  idleTalentSrc?: string;
};

/** BEI idle + playback — staggered enter after intro; talent crossfade on API changes. */
export function LedGbkLiveScreen({
  liveActive = true,
  chromeRevealed = true,
  talentRevealed = true,
  disableAnimations = false,
  suppressIdleTalent = false,
  photoUrl,
  playbackQueueId = null,
  playMs = 3000,
  showQr = true,
  idleTalentSrc,
}: LedGbkLiveScreenProps) {
  const showQrBlock = showQr;
  const qrBox = GBK_LAYOUT_LIVE.qrFrame;
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
        }, GBK_STATIC_FADE_OUT_MS);
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
      <LedGbkLiveAnimatedLayer
        box={GBK_LAYOUT_LIVE.packGroup}
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
                  "--bei-live-pack-float-ms": `${GBK_LIVE_PACK_FLOAT_CYCLE_MS}ms`,
                  "--bei-live-pack-float-delay-ms": `${GBK_LIVE_PACK_FLOAT_DELAY_MS}ms`,
                } as CSSProperties)
          }
        >
          <LedGbkLayerImage
            src={GBK_ASSETS.packGroup}
            alt=""
            box={GBK_LAYOUT_LIVE.packGroup}
            fillSlot
            className="object-contain object-left-top"
          />
        </div>
      </LedGbkLiveAnimatedLayer>

      {chromeRevealed ? (
        <LedGbkLiveAnimatedLayer
          box={GBK_LAYOUT_LIVE.tagline}
          layerId="tagline"
          enterOrder={1}
          slideEnter="right"
          liveEntered={chromeEntered}
          disableAnimations={disableAnimations}
        >
          <LedGbkLayerImage
            src={GBK_ASSETS.tagline}
            alt="Is clearly controlled"
            box={GBK_LAYOUT_LIVE.tagline}
            fillSlot
            className="object-contain object-left-top"
          />
        </LedGbkLiveAnimatedLayer>
      ) : null}

      {chromeRevealed && showQrBlock ? (
        <LedGbkLiveAnimatedLayer
          box={qrBox}
          layerId="qrFrame"
          enterOrder={2}
          visible
          liveEntered={chromeEntered}
          disableAnimations={disableAnimations}
          className="z-[4]"
        >
          <LedGbkLayerImage
            src={GBK_ASSETS.qrFrame}
            alt=""
            box={qrBox}
            fillSlot
            className="object-contain"
          />
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: `${GBK_LAYOUT_LIVE.qrInset.left * 100}%`,
              top: `${GBK_LAYOUT_LIVE.qrInset.top * 100}%`,
              width: `${GBK_LAYOUT_LIVE.qrInset.width * 100}%`,
              height: `${GBK_LAYOUT_LIVE.qrInset.height * 100}%`,
            }}
          >
            <div className="relative size-full">
              <Image
                src={GBK_ASSETS.qrCode}
                alt="QR microsite"
                fill
                unoptimized
                className="object-contain"
                sizes="447px"
                priority
              />
            </div>
          </div>
        </LedGbkLiveAnimatedLayer>
      ) : null}

      {talentRevealed ? (
        suppressIdleTalent && !photoUrl ? null : (
          <LedGbkTalentCrossfade
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
