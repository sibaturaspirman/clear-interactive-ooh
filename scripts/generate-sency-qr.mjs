import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";

function readAppOrigin() {
  for (const file of [".env.local", ".env"]) {
    try {
      const env = fs.readFileSync(file, "utf8");
      const match = env.match(/^NEXT_PUBLIC_APP_URL=(.+)$/m);
      if (match) {
        return match[1].trim().replace(/\/$/, "");
      }
    } catch {
      // ignore
    }
  }
  return "http://localhost:3000";
}

const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? readAppOrigin();
const target = `${origin}/microsite/sency`;
const out = path.join("public/images/led/sency-qr.png");

await QRCode.toFile(out, target, {
  width: 480,
  margin: 1,
  color: { dark: "#000000", light: "#ffffff" },
});

console.log(`sency-qr.png → ${target}`);
