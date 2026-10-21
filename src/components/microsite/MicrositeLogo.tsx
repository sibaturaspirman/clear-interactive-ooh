import Image from "next/image";

export function MicrositeLogo() {
  return (
    <div className="relative mx-auto h-16 w-[150px]">
      <Image
        src="/images/microsite/logo-men-ultra.png"
        alt="Clear Men Ultra"
        fill
        className="object-contain"
        priority
        sizes="150px"
      />
    </div>
  );
}
