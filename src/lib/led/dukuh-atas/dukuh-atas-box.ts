import type { CSSProperties } from "react";

export type DukuhAtasBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Absolute box on BEI canvas (3840×1536) — explicit px for DevTools / relayout. */
export function dukuhAtasBoxStyle(box: DukuhAtasBox): CSSProperties {
  return {
    position: "absolute",
    left: `${box.left}px`,
    top: `${box.top}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
  };
}
