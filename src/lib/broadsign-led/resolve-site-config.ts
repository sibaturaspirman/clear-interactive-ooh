import {
  LED_SEQUENCE,
  LED_SEQUENCE_LIVE_START_AT_MS,
  LED_SEQUENCE_STATIC_DURATION_MS,
  LED_SEQUENCE_STATIC_FADE_OUT_MS,
} from "@/lib/led/led-sequence-loop";
import {
  DUKUH_ATAS_ASSETS,
  DUKUH_ATAS_LAYOUT_LIVE,
  DUKUH_ATAS_LAYOUT_SHARED,
  DUKUH_ATAS_LAYOUT_STATIC,
  DUKUH_ATAS_CANVAS,
} from "@/lib/led/dukuh-atas/dukuh-atas-layout";
import {
  RATU_PLAZA_ASSETS,
  RATU_PLAZA_LAYOUT_LIVE,
  RATU_PLAZA_LAYOUT_SHARED,
  RATU_PLAZA_LAYOUT_STATIC,
  RATU_PLAZA_CANVAS,
} from "@/lib/led/ratu-plaza/ratu-plaza-layout";
import {
  SUDIRMAN_ASSETS,
  SUDIRMAN_LAYOUT_LIVE,
  SUDIRMAN_LAYOUT_STATIC,
  SUDIRMAN_CANVAS,
} from "@/lib/led/sudirman/sudirman-layout";
import {
  BEI_ASSETS,
  BEI_LAYOUT_LIVE,
  BEI_LAYOUT_SHARED,
  BEI_LAYOUT_STATIC,
  BEI_CANVAS,
} from "@/lib/led/bei/bei-layout";
import { isCityvisionLedLocation } from "@/lib/led/led-vendors";
import type { BroadsignSitePayload } from "@/lib/broadsign-led/types";

function sequenceTiming() {
  return {
    staticDurationMs: LED_SEQUENCE_STATIC_DURATION_MS,
    fadeOutMs: LED_SEQUENCE_STATIC_FADE_OUT_MS,
    liveStartMs: LED_SEQUENCE_LIVE_START_AT_MS,
    slotPlayableMs: LED_SEQUENCE.slotMs,
    dummyPlayMs: LED_SEQUENCE.submissionMs,
    liveDurationMs: LED_SEQUENCE.liveMs,
    outroDurationMs: LED_SEQUENCE.outroMs,
    submissionPlayMs: LED_SEQUENCE.submissionMs,
  };
}

const PAYLOADS: Record<string, BroadsignSitePayload> = {
  "dukuh-atas": {
    code: "dukuh-atas",
    canvas: { width: DUKUH_ATAS_CANVAS.width, height: DUKUH_ATAS_CANVAS.height },
    timing: sequenceTiming(),
    clearMode: "dual",
    assets: {
      background: DUKUH_ATAS_ASSETS.background,
      clear: DUKUH_ATAS_ASSETS.clear,
      clearLive: DUKUH_ATAS_ASSETS.clearLive,
      pack: DUKUH_ATAS_ASSETS.pack,
      packGroup: DUKUH_ATAS_ASSETS.packGroup,
      talent: DUKUH_ATAS_ASSETS.talent,
      text: DUKUH_ATAS_ASSETS.text,
      tagline: DUKUH_ATAS_ASSETS.tagline,
      qrFrame: DUKUH_ATAS_ASSETS.qrFrame,
      qrCode: DUKUH_ATAS_ASSETS.qrCode,
      dummyTalent: DUKUH_ATAS_ASSETS.layoutTalentDummy,
      end: DUKUH_ATAS_ASSETS.end,
    },
    layout: {
      shared: {
        clearLeft: { ...DUKUH_ATAS_LAYOUT_SHARED.clearLeft },
        clearRight: { ...DUKUH_ATAS_LAYOUT_SHARED.clearRight },
      },
      static: {
        pack: { ...DUKUH_ATAS_LAYOUT_STATIC.pack },
        talent: { ...DUKUH_ATAS_LAYOUT_STATIC.talent },
        text: { ...DUKUH_ATAS_LAYOUT_STATIC.text },
      },
      live: {
        clearLeft: { ...DUKUH_ATAS_LAYOUT_LIVE.clearLeft },
        clearRight: { ...DUKUH_ATAS_LAYOUT_LIVE.clearRight },
        packGroup: { ...DUKUH_ATAS_LAYOUT_LIVE.packGroup },
        talent: { ...DUKUH_ATAS_LAYOUT_LIVE.talent },
        tagline: { ...DUKUH_ATAS_LAYOUT_LIVE.tagline },
        qrFrame: { ...DUKUH_ATAS_LAYOUT_LIVE.qrFrame },
        qrInset: { ...DUKUH_ATAS_LAYOUT_LIVE.qrInset },
        participantName: { ...DUKUH_ATAS_LAYOUT_LIVE.participantName },
      },
    },
  },
  "ratu-plaza": {
    code: "ratu-plaza",
    canvas: { width: RATU_PLAZA_CANVAS.width, height: RATU_PLAZA_CANVAS.height },
    timing: sequenceTiming(),
    clearMode: "shared",
    assets: {
      background: RATU_PLAZA_ASSETS.background,
      clear: RATU_PLAZA_ASSETS.clear,
      clearLive: RATU_PLAZA_ASSETS.clearLive,
      pack: RATU_PLAZA_ASSETS.pack,
      packGroup: RATU_PLAZA_ASSETS.packGroup,
      talent: RATU_PLAZA_ASSETS.talent,
      text: RATU_PLAZA_ASSETS.text,
      tagline: RATU_PLAZA_ASSETS.tagline,
      qrFrame: RATU_PLAZA_ASSETS.qrFrame,
      qrCode: RATU_PLAZA_ASSETS.qrCode,
      dummyTalent: RATU_PLAZA_ASSETS.layoutTalentDummy,
      end: RATU_PLAZA_ASSETS.end,
    },
    layout: {
      shared: { clear: { ...RATU_PLAZA_LAYOUT_SHARED.clear } },
      static: {
        clear: { ...RATU_PLAZA_LAYOUT_STATIC.clear },
        pack: { ...RATU_PLAZA_LAYOUT_STATIC.pack },
        talent: { ...RATU_PLAZA_LAYOUT_STATIC.talent },
        text: { ...RATU_PLAZA_LAYOUT_STATIC.text },
      },
      live: {
        clear: { ...RATU_PLAZA_LAYOUT_LIVE.clear },
        packGroup: { ...RATU_PLAZA_LAYOUT_LIVE.packGroup },
        talent: { ...RATU_PLAZA_LAYOUT_LIVE.talent },
        tagline: { ...RATU_PLAZA_LAYOUT_LIVE.tagline },
        qrFrame: { ...RATU_PLAZA_LAYOUT_LIVE.qrFrame },
        qrInset: { ...RATU_PLAZA_LAYOUT_LIVE.qrInset },
        participantName: { ...RATU_PLAZA_LAYOUT_LIVE.participantName },
      },
    },
  },
  sudirman: {
    code: "sudirman",
    canvas: { width: SUDIRMAN_CANVAS.width, height: SUDIRMAN_CANVAS.height },
    timing: sequenceTiming(),
    clearMode: "split",
    assets: {
      background: SUDIRMAN_ASSETS.background,
      clearStatic: SUDIRMAN_ASSETS.clearStatic,
      clearLive: SUDIRMAN_ASSETS.clearLive,
      pack: SUDIRMAN_ASSETS.pack,
      packGroup: SUDIRMAN_ASSETS.packGroup,
      talent: SUDIRMAN_ASSETS.talent,
      text: SUDIRMAN_ASSETS.text,
      tagline: SUDIRMAN_ASSETS.tagline,
      qrFrame: SUDIRMAN_ASSETS.qrFrame,
      qrCode: SUDIRMAN_ASSETS.qrCode,
      dummyTalent: SUDIRMAN_ASSETS.layoutTalentDummy,
      end: SUDIRMAN_ASSETS.end,
    },
    layout: {
      static: {
        clear: { ...SUDIRMAN_LAYOUT_STATIC.clear },
        pack: { ...SUDIRMAN_LAYOUT_STATIC.pack },
        talent: { ...SUDIRMAN_LAYOUT_STATIC.talent },
        text: { ...SUDIRMAN_LAYOUT_STATIC.text },
      },
      live: {
        clear: { ...SUDIRMAN_LAYOUT_LIVE.clear },
        packGroup: { ...SUDIRMAN_LAYOUT_LIVE.packGroup },
        talent: { ...SUDIRMAN_LAYOUT_LIVE.talent },
        tagline: { ...SUDIRMAN_LAYOUT_LIVE.tagline },
        qrFrame: { ...SUDIRMAN_LAYOUT_LIVE.qrFrame },
        qrInset: { ...SUDIRMAN_LAYOUT_LIVE.qrInset },
        participantName: { ...SUDIRMAN_LAYOUT_LIVE.participantName },
      },
    },
  },
  bei: {
    code: "bei",
    canvas: { width: BEI_CANVAS.width, height: BEI_CANVAS.height },
    timing: sequenceTiming(),
    clearMode: "shared",
    assets: {
      background: BEI_ASSETS.background,
      clear: BEI_ASSETS.clear,
      pack: BEI_ASSETS.pack,
      packGroup: BEI_ASSETS.packGroup,
      talent: BEI_ASSETS.talent,
      text: BEI_ASSETS.text,
      tagline: BEI_ASSETS.tagline,
      qrFrame: BEI_ASSETS.qrFrame,
      qrCode: BEI_ASSETS.qrCode,
      dummyTalent: BEI_ASSETS.layoutTalentDummy,
      end: BEI_ASSETS.end,
    },
    layout: {
      shared: { clear: { ...BEI_LAYOUT_SHARED.clear } },
      static: {
        clear: { ...BEI_LAYOUT_STATIC.clear },
        pack: { ...BEI_LAYOUT_STATIC.pack },
        talent: { ...BEI_LAYOUT_STATIC.talent },
        text: { ...BEI_LAYOUT_STATIC.text },
      },
      live: {
        clear: { ...BEI_LAYOUT_LIVE.clear },
        packGroup: { ...BEI_LAYOUT_LIVE.packGroup },
        talent: { ...BEI_LAYOUT_LIVE.talent },
        tagline: { ...BEI_LAYOUT_LIVE.tagline },
        qrFrame: { ...BEI_LAYOUT_LIVE.qrFrame },
        qrInset: { ...BEI_LAYOUT_LIVE.qrInset },
        participantName: { ...BEI_LAYOUT_LIVE.participantName },
      },
    },
  },
};

export function getBroadsignSitePayload(
  code: string,
): BroadsignSitePayload | null {
  if (!isCityvisionLedLocation(code)) {
    return null;
  }
  return PAYLOADS[code] ?? null;
}

export function listBroadsignLocationCodes(): string[] {
  return Object.keys(PAYLOADS);
}
