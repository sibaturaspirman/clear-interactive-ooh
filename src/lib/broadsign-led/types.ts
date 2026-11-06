export type BroadsignBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type BroadsignParticipantName = BroadsignBox & {
  fontSize: number;
  rotate: number;
};

/** Serializable site payload for vanilla player (Chromium 87). */
export type BroadsignSitePayload = {
  code: string;
  canvas: { width: number; height: number };
  timing: {
    staticDurationMs: number;
    fadeOutMs: number;
    liveStartMs: number;
    slotPlayableMs: number;
    dummyPlayMs: number;
    liveDurationMs?: number;
    outroDurationMs?: number;
    submissionPlayMs?: number;
  };
  assets: {
    background: string;
    pack: string;
    packGroup: string;
    talent: string;
    text: string;
    tagline: string;
    qrFrame: string;
    /** Legacy static PNG; live player prefers `dynamicMicrositeQrUrl` when set. */
    qrCode: string;
    /** Same-origin path: PNG QR with fresh signed `?w=` (e.g. `/api/microsite/led-qr?code=sency`). */
    dynamicMicrositeQrUrl?: string;
    /** Legacy single dummy image (prefer `dummyTalents`). */
    dummyTalent?: string;
    /** Empty-queue filler: Natasha / Fado / Dimas — 3s each (queue_id -1..-3). */
    dummyTalents: Array<{ url: string; nama: string; queue_id: number }>;
    /** Single clear (static + live). */
    clear?: string;
    clearLeft?: string;
    clearRight?: string;
    clearStatic?: string;
    clearLive?: string;
    end?: string;
  };
  layout: {
    shared?: {
      clear?: BroadsignBox;
      clearLeft?: BroadsignBox;
      clearRight?: BroadsignBox;
    };
    static: {
      clear?: BroadsignBox;
      pack: BroadsignBox;
      talent: BroadsignBox;
      text: BroadsignBox;
    };
    live: {
      clear?: BroadsignBox;
      clearLeft?: BroadsignBox;
      clearRight?: BroadsignBox;
      packGroup: BroadsignBox;
      talent: BroadsignBox;
      tagline: BroadsignBox;
      qrFrame: BroadsignBox;
      qrInset: { left: number; top: number; width: number; height: number };
      participantName: BroadsignParticipantName;
    };
  };
  /** sudirman: separate clear art static vs live */
  clearMode: "shared" | "dual" | "split";
};

export type BroadsignRuntimeSecrets = {
  /** Page origin when `useLedProxy` — otherwise Clear API base URL. */
  apiBaseUrl: string;
  ledKey: string;
  /** Fetch queue via same-origin `/api/broadsign-led/*` (server proxies to Clear API). */
  useLedProxy?: boolean;
};
