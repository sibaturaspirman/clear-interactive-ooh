import "server-only";

import { getWaveSpeedApiKey } from "@/lib/env";

const WAVESPEED_API_BASE = "https://api.wavespeed.ai/api/v3";

type WaveSpeedEnvelope = {
  code?: number;
  message?: string;
  data?: WaveSpeedPrediction;
};

type WaveSpeedPrediction = {
  id?: string;
  status?: string;
  outputs?: unknown[];
  error?: string;
};

function unwrapPrediction(payload: WaveSpeedEnvelope): WaveSpeedPrediction {
  if (payload.data && typeof payload.data === "object") {
    return payload.data;
  }
  return payload as WaveSpeedPrediction;
}

function outputUrl(outputs: unknown[] | undefined): string | null {
  if (!outputs?.length) {
    return null;
  }
  const first = outputs[0];
  if (typeof first === "string" && first.trim()) {
    return first.trim();
  }
  if (first && typeof first === "object" && "url" in first) {
    const url = (first as { url?: string }).url;
    if (url?.trim()) {
      return url.trim();
    }
  }
  return null;
}

async function parseJsonResponse(response: Response): Promise<WaveSpeedEnvelope> {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text) as WaveSpeedEnvelope;
  } catch {
    throw new Error(
      `WaveSpeed ${response.status}: respons bukan JSON (${text.slice(0, 200)})`,
    );
  }
}

function formatHttpError(response: Response, body: WaveSpeedEnvelope): string {
  const detail =
    body.message ||
    body.data?.error ||
    JSON.stringify(body).slice(0, 300);
  return `WaveSpeed ${response.status}: ${detail}`;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Submit a v3 model job and poll until completed. modelPath e.g. google/nano-banana-2.1/edit */
export async function wavespeedRunModel(
  modelPath: string,
  input: Record<string, unknown>,
  options?: { pollIntervalMs?: number; maxWaitMs?: number },
): Promise<string> {
  const apiKey = getWaveSpeedApiKey();
  const pollIntervalMs = options?.pollIntervalMs ?? 2000;
  const maxWaitMs = options?.maxWaitMs ?? 300000;
  const started = Date.now();

  const submitResponse = await fetch(`${WAVESPEED_API_BASE}/${modelPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const submitBody = await parseJsonResponse(submitResponse);
  if (!submitResponse.ok) {
    throw new Error(formatHttpError(submitResponse, submitBody));
  }

  const predictionId = unwrapPrediction(submitBody).id;
  if (!predictionId) {
    throw new Error("WaveSpeed: submit tidak mengembalikan prediction id.");
  }

  const resultUrl =
    WAVESPEED_API_BASE +
    "/predictions/" +
    encodeURIComponent(predictionId) +
    "/result";

  while (Date.now() - started < maxWaitMs) {
    await sleep(pollIntervalMs);

    const resultResponse = await fetch(resultUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    const resultBody = await parseJsonResponse(resultResponse);
    if (!resultResponse.ok) {
      if (resultResponse.status >= 500 || resultResponse.status === 429) {
        continue;
      }
      throw new Error(formatHttpError(resultResponse, resultBody));
    }

    const prediction = unwrapPrediction(resultBody);
    const status = prediction.status?.toLowerCase();

    if (status === "completed") {
      const url = outputUrl(prediction.outputs);
      if (!url) {
        throw new Error("WaveSpeed: task selesai tanpa output URL.");
      }
      return url;
    }

    if (
      status === "failed" ||
      status === "cancelled" ||
      status === "timeout" ||
      status === "deleted"
    ) {
      throw new Error(
        prediction.error ||
          `WaveSpeed task ${predictionId} berstatus ${status ?? "unknown"}.`,
      );
    }
  }

  throw new Error(
    `WaveSpeed: timeout menunggu hasil (${modelPath}, id ${predictionId}).`,
  );
}
