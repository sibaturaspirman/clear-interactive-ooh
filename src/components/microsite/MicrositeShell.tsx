import type { ReactNode } from "react";

import { MicrositeLogo } from "@/components/microsite/MicrositeLogo";

type MicrositeShellProps = {
  children: ReactNode;
  title?: string;
};

export function MicrositeShell({ children, title }: MicrositeShellProps) {
  return (
    <div className="microsite relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 pb-8 pt-6">
      <div className="flex flex-col gap-6">
        <MicrositeLogo />
        {title ? (
          <h1 className="microsite-title text-center text-2xl leading-8">{title}</h1>
        ) : null}
        {children}
      </div>
    </div>
  );
}
