import Image from "next/image";

export function LedIdleScreen() {
  return (
    <>
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
      <div className="absolute bottom-0 left-0 h-[89.6%] w-[35.8%]">
        <Image
          src="/images/led/product-pack.png"
          alt=""
          fill
          className="object-contain object-left-bottom"
          sizes="600px"
        />
      </div>
      <div className="absolute bottom-0 right-0 h-[93.1%] w-[79.6%]">
        <Image
          src="/images/led/talent-idle.png"
          alt=""
          fill
          className="object-contain object-right-bottom"
          sizes="1200px"
        />
      </div>
      <div className="absolute bottom-0 left-[17.6%] h-[22.3%] w-[69.2%]">
        <Image
          src="/images/led/tagline.png"
          alt="Official shampoo partner of Oracle Red Bull Racing"
          fill
          className="object-contain object-left-bottom"
          sizes="900px"
        />
      </div>
    </>
  );
}
