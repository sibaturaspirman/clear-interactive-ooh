import Image from "next/image";

type MicrositeLogoProps = {
  /** Larger lockup for generating overlay. */
  variant?: "default" | "overlay";
};

const LOGO_BOX = {
  default: { className: "h-[100px] w-[260px]", sizes: "260px" },
  overlay: { className: "h-[100px] w-[260px]", sizes: "260px" },
} as const;

export function MicrositeLogo({ variant = "default" }: MicrositeLogoProps) {
  const box = LOGO_BOX[variant];

  return (
    <div className={`relative mx-auto ${box.className}`}>
      <Image
        src="/images/microsite/logo-men-ultra.png"
        alt="Clear Men Ultra"
        fill
        className="object-contain"
        priority
        sizes={box.sizes}
      />
    </div>
  );
}
