import Image from "next/image";

type LedQrScreenProps = {
  participantName?: string;
  qrDataUrl: string;
  photoUrl?: string;
  showDynamicHeadline?: boolean;
};

export function LedQrScreen({
  participantName,
  qrDataUrl,
  photoUrl,
  showDynamicHeadline = false,
}: LedQrScreenProps) {
  const displayName = participantName?.trim() || "NAMA";

  return (
    <div className="relative size-full">
      <Image
        src="/images/led/background.png"
        alt=""
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />
      <div className="absolute left-[2.3%] top-[6%] h-[17%] w-[23%]">
        <Image
          src="/images/led/logo-partner.png"
          alt="Clear x Oracle Red Bull Racing"
          fill
          className="object-contain object-left"
          sizes="400px"
        />
      </div>

      <div className="absolute bottom-[-0.04%] left-[-8.5%] h-[94.4%] w-[52.2%]">
        <Image
          src="/images/led/product-trio.png"
          alt=""
          fill
          className="object-contain object-left-bottom"
          sizes="900px"
        />
        <div className="absolute bottom-[8%] left-[21%] h-[7.2%] w-[50.5%] mix-blend-lighten">
          <Image
            src="/images/led/product-glow.png"
            alt=""
            fill
            className="object-contain"
            sizes="500px"
          />
        </div>
      </div>

      <div className="absolute bottom-0 left-[32.4%] h-[93.3%] w-[31.1%]">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={displayName}
            fill
            className="object-cover object-top"
            unoptimized
            sizes="520px"
          />
        ) : (
          <Image
            src="/images/led/talent-qr.png"
            alt=""
            fill
            className="object-contain object-bottom"
            sizes="520px"
          />
        )}
      </div>

      <div className="absolute left-[61.2%] top-[6.4%] h-[34.5%] w-[35.4%]">
        <Image
          src="/images/led/headline-copy.png"
          alt=""
          fill
          className="object-contain object-left-top"
          sizes="600px"
        />
        {showDynamicHeadline ? (
          <p className="absolute left-[8%] top-[18%] max-w-[88%] font-sans text-[clamp(1.4rem,3.2vw,2.6rem)] font-black uppercase leading-none tracking-tight text-white">
            {displayName} IS CLEARLY
            <br />
            CONTROLLED
          </p>
        ) : null}
      </div>

      <div className="absolute left-[66.9%] top-[44.6%] h-[48.6%] w-[25%] rounded-sm bg-[#050f3d]/80 p-[3%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="QR microsite"
          className="size-full object-contain"
        />
      </div>
    </div>
  );
}
