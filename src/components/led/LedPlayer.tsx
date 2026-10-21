"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { LedQrScreen } from "@/components/led/LedQrScreen";
import "@/components/led/led-player.css";

type LedQueueItem = {
  queue_id: number;
  submission_id: number;
  nama: string;
  url: string;
  location_id: number;
};

type PullResponse = {
  mode: "fresh" | "empty" | "replay";
  play_ms: number;
  buffer_size: number;
  items: LedQueueItem[];
};

type LedPlayerProps = {
  code: string;
  apiBaseUrl: string;
  ledKey: string;
  locationName: string;
  micrositeUrl: string;
};

function isVideo(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

export function LedPlayer({
  code,
  apiBaseUrl,
  ledKey,
  locationName,
  micrositeUrl,
}: LedPlayerProps) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [ui, setUi] = useState({
    idle: true,
    chrome: false,
    hint: false,
    nama: "",
    loc: locationName,
    pos: "",
  });

  const stateRef = useRef({
    locationName,
    playMs: 3000,
    bufferSize: 5,
    current: null as LedQueueItem | null,
    upcoming: [] as LedQueueItem[],
    replayLoop: [] as LedQueueItem[],
    replaying: false,
    hint: false,
    queued: 0,
    pulling: false,
    startedAt: 0,
    timer: 0 as ReturnType<typeof setTimeout> | 0,
  });

  const shownIdRef = useRef<number | null>(null);
  const bootedRef = useRef(false);
  const chainRef = useRef(Promise.resolve());

  const playerKey = `clear.led.playerId.${code}`;
  const storeKey = `clear.led.queue.${code}`;

  function enqueue(task: () => Promise<void>) {
    chainRef.current = chainRef.current.then(task, task).catch((error) => {
      setStatus(error instanceof Error ? error.message : "Error player");
    });
  }

  function persist() {
    const state = stateRef.current;
    localStorage.setItem(
      storeKey,
      JSON.stringify({
        current: state.current,
        upcoming: state.upcoming,
        replayLoop: state.replayLoop,
        replaying: state.replaying,
        startedAt: state.startedAt,
        playMs: state.playMs,
      }),
    );
  }

  function loadStore() {
    try {
      const raw = JSON.parse(localStorage.getItem(storeKey) || "null") as {
        current?: LedQueueItem | null;
        upcoming?: LedQueueItem[];
        replayLoop?: LedQueueItem[];
        replaying?: boolean;
        startedAt?: number;
        playMs?: number;
      } | null;
      if (!raw) return;
      const state = stateRef.current;
      state.current = raw.current || null;
      state.upcoming = Array.isArray(raw.upcoming) ? raw.upcoming : [];
      state.replayLoop = Array.isArray(raw.replayLoop) ? raw.replayLoop : [];
      state.replaying = Boolean(raw.replaying);
      state.startedAt = raw.startedAt || 0;
      if (raw.playMs) state.playMs = raw.playMs;
    } catch {
      localStorage.removeItem(storeKey);
    }
  }

  function slots() {
    const state = stateRef.current;
    return (
      state.bufferSize -
      ((state.current ? 1 : 0) + state.upcoming.length)
    );
  }

  function held(queueId: number) {
    const state = stateRef.current;
    if (state.current?.queue_id === queueId) return true;
    return state.upcoming.some((item) => item.queue_id === queueId);
  }

  function restartBar(remaining: number) {
    const bar = barRef.current;
    if (!bar) return;
    const state = stateRef.current;
    const elapsed = Math.max(state.playMs - remaining, 0);
    bar.style.animation = "none";
    void bar.offsetWidth;
    bar.style.animation = `led-shrink ${state.playMs}ms linear forwards`;
    bar.style.animationDelay = `-${elapsed}ms`;
  }

  function mount(item: LedQueueItem, remaining: number) {
    const media = mediaRef.current;
    if (!media) return;
    media.replaceChildren();
    if (isVideo(item.url)) {
      const video = document.createElement("video");
      video.src = item.url;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.play().catch(() => {});
      media.append(video);
    } else {
      const img = document.createElement("img");
      img.alt = item.nama;
      img.src = item.url;
      media.append(img);
    }
    shownIdRef.current = item.queue_id;
    restartBar(remaining);
  }

  function render(remaining?: number) {
    const state = stateRef.current;
    if (!state.current) {
      shownIdRef.current = null;
      mediaRef.current?.replaceChildren();
      setUi({
        idle: true,
        chrome: false,
        hint: state.hint,
        nama: "",
        loc: state.locationName,
        pos: "",
      });
      return;
    }

    setUi({
      idle: false,
      chrome: true,
      hint: state.hint,
      nama: state.current.nama,
      loc: state.locationName,
      pos: `${state.upcoming.length} di belakang`,
    });

    if (shownIdRef.current !== state.current.queue_id) {
      mount(state.current, remaining ?? state.playMs);
    }
  }

  async function pull() {
    const state = stateRef.current;
    if (state.pulling) return;
    const free = slots();
    if (free <= 0) return;
    const askReplay = !state.current && state.upcoming.length === 0;
    state.pulling = true;
    try {
      const base = apiBaseUrl.replace(/\/$/, "");
      const res = await fetch(
        `${base}/api/led/${encodeURIComponent(code)}/next?limit=${free}&replay=${askReplay ? "1" : "0"}`,
        { headers: { "x-led-key": ledKey } },
      );
      const data = (await res.json()) as PullResponse & { message?: string };
      if (!res.ok) throw new Error(data.message || "Gagal ambil antrian");
      state.playMs = data.play_ms || state.playMs;
      state.bufferSize = data.buffer_size || state.bufferSize;
      if (data.mode === "fresh") {
        state.replaying = false;
        state.replayLoop = [];
        state.hint = false;
        for (const item of data.items) {
          if (!held(item.queue_id) && slots() > 0) state.upcoming.push(item);
        }
      } else if (data.mode === "replay" && askReplay) {
        state.replaying = true;
        state.replayLoop = data.items.slice();
        state.upcoming = data.items.slice();
        state.hint = false;
      }
      persist();
    } finally {
      state.pulling = false;
    }
  }

  function ack(queueId: number) {
    const base = apiBaseUrl.replace(/\/$/, "");
    fetch(`${base}/api/led/${encodeURIComponent(code)}/played`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-led-key": ledKey,
      },
      body: JSON.stringify({ queue_ids: [queueId] }),
    }).catch(() => {});
  }

  function arm(remaining: number) {
    const state = stateRef.current;
    if (state.timer) clearTimeout(state.timer);
    state.startedAt = Date.now() - (state.playMs - remaining);
    persist();
    render(remaining);
    state.timer = setTimeout(() => {
      enqueue(finish);
    }, remaining);
  }

  async function startIfIdle() {
    const state = stateRef.current;
    if (!state.replaying && slots() > 0) await pull();
    if (state.current) return;
    if (!state.upcoming.length) {
      if (state.replaying && state.replayLoop.length && !state.hint) {
        state.upcoming = state.replayLoop.map((item) => ({ ...item }));
      } else if (!state.replaying) {
        await pull();
      }
    }
    if (state.current || !state.upcoming.length) {
      persist();
      render();
      return;
    }
    state.current = state.upcoming.shift() ?? null;
    state.startedAt = Date.now();
    persist();
    arm(state.playMs);
  }

  async function finish() {
    const state = stateRef.current;
    const done = state.current;
    state.current = null;
    state.startedAt = 0;
    shownIdRef.current = null;
    if (done && !state.replaying) ack(done.queue_id);
    if (state.replaying && state.hint) {
      state.upcoming = [];
      state.replayLoop = [];
      state.replaying = false;
    }
    persist();
    await startIfIdle();
  }

  async function resume() {
    loadStore();
    const state = stateRef.current;
    if (!state.current) {
      await startIfIdle();
      return;
    }
    const elapsed = state.startedAt ? Date.now() - state.startedAt : 0;
    const remaining = state.playMs - elapsed;
    if (remaining < 250) await finish();
    else arm(remaining);
  }

  useEffect(() => {
    stateRef.current.locationName = locationName;
    setUi((current) => ({ ...current, loc: locationName }));
  }, [locationName]);

  useEffect(() => {
    let cancelled = false;
    void import("qrcode").then((QRCode) =>
      QRCode.default.toDataURL(micrositeUrl, {
        margin: 1,
        width: 420,
        color: { dark: "#000000", light: "#ffffff" },
      }).then((url) => {
        if (!cancelled) setQrDataUrl(url);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [micrositeUrl]);

  useEffect(() => {
    let playerId = localStorage.getItem(playerKey);
    if (!playerId) {
      playerId = crypto.randomUUID();
      localStorage.setItem(playerKey, playerId);
    }

    const socket: Socket = io(apiBaseUrl.replace(/\/$/, ""), {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setStatus("");
      socket.emit("led:hello", { code, key: ledKey, playerId });
    });

    socket.on("led:ready", (msg: {
      location_name?: string;
      play_ms?: number;
      buffer_size?: number;
      queued?: number;
    }) => {
      enqueue(async () => {
        const state = stateRef.current;
        state.locationName = msg.location_name || locationName;
        state.playMs = msg.play_ms || state.playMs;
        state.bufferSize = msg.buffer_size || state.bufferSize;
        state.queued = msg.queued || 0;
        setStatus("");
        if (!bootedRef.current) {
          bootedRef.current = true;
          await resume();
        }
        if (!state.replaying && slots() > 0 && state.queued > 0) await pull();
        render();
      });
    });

    socket.on("led:error", (msg: { message?: string }) => {
      setStatus(msg.message || "Player ditolak");
    });

    socket.on("queue:hint", (msg: { queued?: number }) => {
      enqueue(async () => {
        const state = stateRef.current;
        state.hint = true;
        state.queued = msg.queued ?? state.queued;
        if (state.replaying) {
          render();
          return;
        }
        if (slots() > 0) await pull();
        if (!state.current) await startIfIdle();
        else render();
      });
    });

    socket.on("disconnect", () => {
      setStatus("Putus dari server, menyambung lagi...");
    });

    return () => {
      socket.disconnect();
      const state = stateRef.current;
      if (state.timer) clearTimeout(state.timer);
    };
  }, [apiBaseUrl, code, ledKey, locationName]);

  return (
    <main
      className="led-player-stage"
      onClick={() => {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }}
    >
      <div ref={mediaRef} className="led-player-media" />

      {!ui.idle ? null : (
        <div className="led-player-idle-layer relative size-full">
          {qrDataUrl ? (
            <LedQrScreen qrDataUrl={qrDataUrl} />
          ) : null}
        </div>
      )}

      <footer className="led-player-chrome" hidden={!ui.chrome}>
        <div ref={barRef} className="led-player-bar" />
        <div className="led-player-meta">
          <strong className="led-player-nama">{ui.nama}</strong>
          <span className="led-player-loc">{ui.loc}</span>
        </div>
        <div className="led-player-side">
          <span className="led-player-pos">{ui.pos}</span>
          <span className="led-player-hint" hidden={!ui.hint}>
            Konten baru menunggu giliran
          </span>
        </div>
      </footer>

      {status ? <p className="led-player-status">{status}</p> : null}
    </main>
  );
}
