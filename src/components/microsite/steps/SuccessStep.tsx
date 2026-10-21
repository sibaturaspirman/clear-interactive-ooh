"use client";

import Image from "next/image";

type SuccessStepProps = {
  onBackHome: () => void;
};

export function SuccessStep({ onBackHome }: SuccessStepProps) {
  return (
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col items-center justify-center gap-4 px-8 pb-10">
      <div className="flex w-full max-w-[311px] flex-col items-center gap-4">
        <div className="relative h-[132px] w-[289px] shrink-0">
          <Image
            src="/images/microsite/result.png"
            alt="You are clearly controlled"
            fill
            className="object-contain"
            priority
            sizes="289px"
          />
        </div>
        <p className="microsite-success-copy text-center">
          Nice work! Your personal details and photo are uploaded.
        </p>
      </div>
      <button
        type="button"
        onClick={onBackHome}
        className="microsite-button microsite-button-submit mt-2 w-full max-w-[311px] uppercase"
      >
        back to home
      </button>
    </div>
  );
}
