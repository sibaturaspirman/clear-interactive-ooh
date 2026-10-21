import Image from "next/image";

export function MicrositeBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#1a1030]"
      aria-hidden
    >
      <Image
        src="/images/microsite/background.png"
        alt=""
        fill
        priority
        className="size-full object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-transparent" />
    </div>
  );
}
