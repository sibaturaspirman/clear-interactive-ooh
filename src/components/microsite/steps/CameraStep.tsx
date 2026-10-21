"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { CameraCardFrame } from "@/components/microsite/CameraCardFrame";
import { CameraViewfinder } from "@/components/microsite/CameraViewfinder";

type CameraStepProps = {
  onCapture: (blob: Blob) => void;
};

export function CameraStep({ onCapture }: CameraStepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const countdownTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: "user" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setStreamError(
          "Kamera tidak dapat diakses. Izinkan permission kamera di browser.",
        );
      }
    }

    void startCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
      countdownTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(blob);
        }
      },
      "image/jpeg",
      0.92,
    );
  }

  function startCountdown() {
    if (streamError || countdown !== null) {
      return;
    }

    countdownTimersRef.current.forEach(clearTimeout);
    countdownTimersRef.current = [];

    setCountdown(3);

    const tick = (value: number) => {
      const timer = setTimeout(() => {
        if (value > 1) {
          setCountdown(value - 1);
          tick(value - 1);
        } else {
          setCountdown(null);
          capturePhoto();
        }
      }, 1000);
      countdownTimersRef.current.push(timer);
    };

    tick(3);
  }

  const shutterDisabled = Boolean(streamError) || countdown !== null;

  return (
    <CameraCardFrame>
      <h2 className="microsite-camera-title shrink-0 text-center text-[28px] leading-8">
        Look at The Camera
      </h2>

      <CameraViewfinder showGuides>
        {!streamError ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-white/80">
            {streamError}
          </p>
        )}
        {countdown !== null ? (
          <div
            className="microsite-countdown absolute inset-0 z-10 flex items-center justify-center bg-black/35"
            aria-live="polite"
            aria-atomic
          >
            <span className="microsite-countdown-number">{countdown}</span>
          </div>
        ) : null}
      </CameraViewfinder>

      <button
        type="button"
        aria-label="Ambil foto"
        onClick={startCountdown}
        disabled={shutterDisabled}
        className="microsite-shutter-button mx-auto shrink-0 disabled:opacity-50"
      >
        <Image
          src="/images/microsite/shutter.svg"
          alt=""
          width={88}
          height={88}
          className="size-[88px]"
        />
      </button>
    </CameraCardFrame>
  );
}
