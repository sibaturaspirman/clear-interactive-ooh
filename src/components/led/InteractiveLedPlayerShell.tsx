"use client";

import type { ReactNode } from "react";

import { LedFixedCanvas } from "@/components/led/LedFixedCanvas";
import type { LedConnectionStatus } from "@/lib/led/led-queue-types";
import type { LedCanvasSpec } from "@/lib/led/location-specs";
import "@/components/led/led-player.css";

type InteractiveLedPlayerShellProps = {
  canvas: LedCanvasSpec;
  stageClassName?: string;
  connectionStatus: LedConnectionStatus;
  children: ReactNode;
};

export function InteractiveLedPlayerShell({
  canvas,
  stageClassName = "",
  connectionStatus,
  children,
}: InteractiveLedPlayerShellProps) {
  return (
    <main
      className={`led-player-stage led-player-stage--fixed ${stageClassName}`.trim()}
      onClick={() => {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }}
    >
      <LedFixedCanvas width={canvas.width} height={canvas.height}>
        {children}
      </LedFixedCanvas>

      {connectionStatus === "connected" ? (
        <span
          className="led-player-status led-player-status-dot led-player-status-dot--ok"
          role="status"
          aria-label="Terhubung"
        />
      ) : connectionStatus === "reconnecting" ||
        connectionStatus === "standby" ? (
        <span
          className="led-player-status led-player-status-dot led-player-status-dot--warn"
          role="status"
          aria-label={
            connectionStatus === "standby"
              ? "Player lain aktif"
              : "Menyambung ulang"
          }
        />
      ) : connectionStatus === "error" ? (
        <span
          className="led-player-status led-player-status-dot led-player-status-dot--bad"
          role="status"
          aria-label="Tidak terhubung"
        />
      ) : null}
    </main>
  );
}
