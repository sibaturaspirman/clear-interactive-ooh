export type LedQueueItem = {
  queue_id: number;
  submission_id: number;
  nama: string;
  url: string;
  location_id: number;
};

export type LedPullResponse = {
  mode: "fresh" | "empty" | "replay";
  play_ms: number;
  buffer_size: number;
  items: LedQueueItem[];
};

export type LedConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "standby"
  | "error";

export type InteractiveLedUiState = {
  idle: boolean;
  chrome: boolean;
  hint: boolean;
  nama: string;
  loc: string;
  pos: string;
  playbackUrl: string;
  playbackQueueId: number | null;
  playMs: number;
};
