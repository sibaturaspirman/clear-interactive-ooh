import type {
  BroadsignRuntimeSecrets,
  BroadsignSitePayload,
} from "@/lib/broadsign-led/types";

/** Inline in &lt;head&gt; before app bundle (Cityvision §5.4). ES5-safe. */
export const BROADSIGN_HEAD_SCRIPT = `<script>
window.__bsStarted = false;
function __bsStart() {
  if (window.__bsStarted) return;
  window.__bsStarted = true;
  if (window.dispatchEvent) {
    window.dispatchEvent(new Event("bs-start"));
  }
}
window.BroadSignPlay = __bsStart;
window.addEventListener("message", function (e) {
  if (e.data && e.data.type === "BroadSignPlay") __bsStart();
});
(function () {
  var search = window.location.search || "";
  if (search.indexOf("autoplay=1") !== -1 || search.indexOf("autoplay=true") !== -1) {
    __bsStart();
  }
})();
</script>`;

export function renderBroadsignHtml(
  site: BroadsignSitePayload,
  runtime: BroadsignRuntimeSecrets,
): string {
  const payload = {
    site,
    apiBaseUrl: runtime.apiBaseUrl.replace(/\/$/, ""),
    ledKey: runtime.ledKey,
    useLedProxy: Boolean(runtime.useLedProxy),
  };
  const json = JSON.stringify(payload).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Clear LED Broadsign — ${site.code}</title>
  ${BROADSIGN_HEAD_SCRIPT}
  <link rel="stylesheet" href="/broadsign/player.css" />
  <link rel="stylesheet" href="/broadsign/motion.css" />
</head>
<body>
  <div id="bs-root"></div>
  <script>window.__CLEAR_BROADSIGN__ = ${json};</script>
  <script src="/broadsign/player.js" defer></script>
</body>
</html>`;
}
