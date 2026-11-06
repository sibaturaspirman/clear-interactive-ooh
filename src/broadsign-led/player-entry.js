/**
 * Broadsign / Chromium 87 LED player (vanilla). Bundled to /public/broadsign/player.js
 * Queue + motion aligned with `useInteractiveLedQueue` + `led-player.css`.
 */
import { ledParticipantDisplayName } from "../lib/led/led-participant-display-name.ts";

(function () {
  "use strict";

  if (!Object.hasOwn) {
    Object.hasOwn = function (obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    };
  }

  if (!Array.prototype.at) {
    Array.prototype.at = function (index) {
      var len = this.length;
      var relative = index >= 0 ? index : len + index;
      if (relative < 0 || relative >= len) return undefined;
      return this[relative];
    };
  }

  function randomUUID() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    var bytes = new Uint8Array(16);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (var i = 0; i < 16; i++) bytes[i] = (Math.random() * 256) | 0;
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = [];
    for (var j = 0; j < 16; j++) {
      var h = bytes[j].toString(16);
      hex.push(h.length === 1 ? "0" + h : h);
    }
    return (
      hex.slice(0, 4).join("") +
      "-" +
      hex.slice(4, 6).join("") +
      "-" +
      hex.slice(6, 8).join("") +
      "-" +
      hex.slice(8, 10).join("") +
      "-" +
      hex.slice(10, 16).join("")
    );
  }

  var boot = window.__CLEAR_BROADSIGN__;
  if (!boot || !boot.site) return;

  var site = boot.site;

  /** Natasha → Fado → Dimas (see `LED_DUMMY_ROTATION` / `dummyTalents` in site config). */
  function resolveDummyTalents() {
    var a = site.assets;
    if (a.dummyTalents && a.dummyTalents.length) {
      return a.dummyTalents;
    }
    if (a.dummyTalent) {
      return [
        {
          url: a.dummyTalent,
          nama: "Natasha",
          queue_id: -1,
        },
      ];
    }
    return [];
  }

  var dummyTalents = resolveDummyTalents();

  function isDummyQueueId(queueId) {
    if (queueId == null || queueId >= 0) return false;
    for (var i = 0; i < dummyTalents.length; i++) {
      if (dummyTalents[i].queue_id === queueId) return true;
    }
    return false;
  }

  var apiBase = boot.apiBaseUrl;
  var ledKey = boot.ledKey;
  var useLedProxy = Boolean(boot.useLedProxy);
  var code = site.code;

  function apiQueuePath(suffix) {
    var base = apiBase.replace(/\/$/, "");
    if (useLedProxy) {
      return (
        base +
        "/api/broadsign-led/" +
        encodeURIComponent(code) +
        suffix
      );
    }
    return base + "/api/led/" + encodeURIComponent(code) + suffix;
  }
  var timing = site.timing;
  var isSequenceLoop = Boolean(
    timing.liveDurationMs && timing.submissionPlayMs,
  );

  var MOTION = {
    liveEnterMs: 900,
    liveStaggerMs: 140,
    slideOffsetPx: 72,
    liveTalentFadeInMs: 1000,
    livePackFloatMs: 5600,
    livePackFloatDelayMs: 900,
    liveLayerFadeMs: 550,
    liveHandoffMs: 250,
  };

  var started = false;
  var introDone = false;
  var slotStart = 0;
  var slotTimer = 0;
  var slotFrozen = false;
  var playTimer = 0;
  var pollTimer = 0;
  var micrositeQrTimer = 0;
  var micrositeQrImgEl = null;
  var introRunning = false;
  var talentExitTimer = 0;
  var talentSwapTimer = 0;

  var bufferSize = 5;
  var replaying = false;
  var upcoming = [];
  var currentItem = null;
  var playMs = 3000;
  var liveHadPlayback = false;
  var dummyPlayed = false;
  var pulling = false;
  /** While we are async-loading the next queue item, block tryStartPlayback to avoid double-dequeue. */
  var playbackAdvancing = false;
  var prevPlaybackQueueId = null;
  var talentShowGen = 0;
  /** url -> Promise\<boolean\> — true only when media actually loads (errors delete cache entry for retry). */
  var preloadCache = {};

  var stageEl = null;
  var sharedClearEl = null;
  var staticRoot = null;
  var staticContentEl = null;
  var staticForegroundEl = null;
  var packMotionEl = null;
  var staticTalentWrap = null;
  var liveRoot = null;
  var suppressLiveTalentUntil = 0;
  var packGroupEl = null;
  var talentPhotoEl = null;
  var talentFadeEl = null;
  var talentZoomEl = null;
  var talentPhotoImg = null;
  var nameWrapEl = null;
  var nameFadeEl = null;
  var nameTextEl = null;
  var prevNameQueueId = null;
  var nameExitTimer = 0;
  var outroRoot = null;
  var liveSegmentTimer = 0;
  var outroTimer = 0;
  var liveSegmentEnd = 0;
  var liveSegmentPlayMs = 3000;

  function planLiveSegmentPlayback() {
    var n = upcoming.length + (currentItem ? 1 : 0);
    var slots = n === 0 ? 1 : Math.min(3, n);
    var liveMs = timing.liveDurationMs || 9000;
    if (slots <= 1) liveSegmentPlayMs = liveMs;
    else if (slots === 2) liveSegmentPlayMs = liveMs / 2;
    else liveSegmentPlayMs = timing.submissionPlayMs || 3000;
  }

  function boxStyle(box) {
    return (
      "left:" +
      box.left +
      "px;top:" +
      box.top +
      "px;width:" +
      box.width +
      "px;height:" +
      box.height +
      "px;"
    );
  }

  function setMotionVars(el, vars) {
    if (!el) return;
    for (var key in vars) {
      if (Object.hasOwn(vars, key)) {
        el.style.setProperty(key, vars[key]);
      }
    }
  }

  function addImg(parent, src, box, className, cover) {
    var layer = document.createElement("div");
    layer.className = "bs-layer" + (className ? " " + className : "");
    if (cover) layer.className += " bs-layer--cover";
    layer.style.cssText = boxStyle(box);
    var img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.draggable = false;
    layer.appendChild(img);
    parent.appendChild(layer);
    return layer;
  }

  function addLiveMotionLayer(parent, src, box, extraClass, staggerOrder) {
    var layer = document.createElement("div");
    layer.className =
      "bs-layer led-bei-live-layer" + (extraClass ? " " + extraClass : "");
    layer.style.cssText = boxStyle(box);
    setMotionVars(layer, {
      "--bei-slide-offset": MOTION.slideOffsetPx + "px",
      "--bei-live-enter-ms": MOTION.liveEnterMs + "ms",
      transitionDuration: MOTION.liveLayerFadeMs + "ms",
    });
    if (typeof staggerOrder === "number") {
      layer.style.transitionDelay = staggerOrder * MOTION.liveStaggerMs + "ms";
    }
    var img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.draggable = false;
    img.style.cssText = "width:100%;height:100%;object-fit:contain;object-position:left top;";
    layer.appendChild(img);
    parent.appendChild(layer);
    return layer;
  }

  function scaleStage() {
    if (!stageEl) return;
    var canvasW = site.canvas.width;
    var canvasH = site.canvas.height;
    // Stretch to fill the Broadsign frame; no letterbox if its ratio differs from the canvas
    var sx = window.innerWidth / canvasW;
    var sy = window.innerHeight / canvasH;
    stageEl.style.width = canvasW + "px";
    stageEl.style.height = canvasH + "px";
    stageEl.style.transformOrigin = "0 0";
    stageEl.style.transform = "scale(" + sx + "," + sy + ")";
  }

  function buildDom() {
    var root = document.getElementById("bs-root");
    if (!root) return;

    stageEl = document.createElement("div");
    stageEl.className = "bs-stage";
    root.appendChild(stageEl);

    addImg(
      stageEl,
      site.assets.background,
      { left: 0, top: 0, width: site.canvas.width, height: site.canvas.height },
      null,
      true,
    );

    if (
      site.clearMode === "dual" &&
      site.layout.shared &&
      !site.assets.clearLive
    ) {
      addImg(stageEl, site.assets.clear, site.layout.shared.clearLeft);
      addImg(stageEl, site.assets.clear, site.layout.shared.clearRight);
    } else if (
      site.clearMode === "shared" &&
      site.layout.shared &&
      site.layout.shared.clear
    ) {
      sharedClearEl = addImg(
        stageEl,
        site.assets.clear,
        site.layout.shared.clear,
      );
    }

    liveRoot = document.createElement("div");
    liveRoot.className = "bs-live-root";
    stageEl.appendChild(liveRoot);

    var lv = site.layout.live;
    if (site.clearMode === "split" && lv.clear && site.assets.clearLive) {
      addLiveMotionLayer(liveRoot, site.assets.clearLive, lv.clear, null, 0);
    } else if (
      site.clearMode === "dual" &&
      site.assets.clearLive &&
      lv.clearLeft &&
      lv.clearRight
    ) {
      addLiveMotionLayer(
        liveRoot,
        site.assets.clearLive,
        lv.clearLeft,
        null,
        0,
      );
      addLiveMotionLayer(
        liveRoot,
        site.assets.clearLive,
        lv.clearRight,
        null,
        0,
      );
    } else if (site.clearMode === "shared" && lv.clear) {
      var liveClearAsset = site.assets.clearLive || site.assets.clear;
      if (liveClearAsset) {
        addLiveMotionLayer(liveRoot, liveClearAsset, lv.clear, null, 0);
      }
    }

    var hasLiveClearLayer =
      (site.clearMode === "split" && lv.clear && site.assets.clearLive) ||
      (site.clearMode === "dual" &&
        site.assets.clearLive &&
        lv.clearLeft &&
        lv.clearRight) ||
      (site.clearMode === "shared" &&
        lv.clear &&
        (site.assets.clearLive || site.assets.clear));
    packGroupEl = addLiveMotionLayer(
      liveRoot,
      site.assets.packGroup,
      lv.packGroup,
      "led-bei-live-pack-float",
      hasLiveClearLayer ? 1 : 0,
    );
    setMotionVars(packGroupEl, {
      "--bei-live-pack-float-ms": MOTION.livePackFloatMs + "ms",
      "--bei-live-pack-float-delay-ms": MOTION.livePackFloatDelayMs + "ms",
    });

    addLiveMotionLayer(liveRoot, site.assets.tagline, lv.tagline, null, 2);

    nameWrapEl = document.createElement("div");
    nameWrapEl.className =
      "pointer-events-none absolute bs-z-name led-bei-live-layer";
    nameWrapEl.style.cssText = boxStyle(lv.participantName);
    nameWrapEl.style.transitionDuration = MOTION.liveLayerFadeMs + "ms";
    nameWrapEl.style.transitionDelay = 3 * MOTION.liveStaggerMs + "ms";

    nameFadeEl = document.createElement("div");
    nameFadeEl.className =
      "size-full led-bei-live-talent-fade led-bei-live-talent-fade--show";

    var nameRotateWrap = document.createElement("div");
    nameRotateWrap.className =
      "led-live-participant-name-wrap flex size-full items-end justify-start";
    nameRotateWrap.style.transform =
      "rotate(" + lv.participantName.rotate + "deg)";

    nameTextEl = document.createElement("p");
    nameTextEl.className = "led-live-participant-name";
    nameTextEl.style.fontSize = lv.participantName.fontSize + "px";
    nameTextEl.style.lineHeight = "1.05";
    nameTextEl.style.fontFamily =
      '"Segoe UI", "Helvetica Neue", Arial, sans-serif';

    nameRotateWrap.appendChild(nameTextEl);
    nameFadeEl.appendChild(nameRotateWrap);
    nameWrapEl.appendChild(nameFadeEl);
    liveRoot.appendChild(nameWrapEl);

    var qrWrap = document.createElement("div");
    qrWrap.className = "bs-layer led-bei-live-layer";
    qrWrap.style.cssText = boxStyle(lv.qrFrame);
    qrWrap.style.transitionDuration = MOTION.liveLayerFadeMs + "ms";
    qrWrap.style.transitionDelay = 3 * MOTION.liveStaggerMs + "ms";
    var qrFrameImg = document.createElement("img");
    qrFrameImg.src = site.assets.qrFrame;
    qrFrameImg.alt = "";
    qrFrameImg.style.cssText = "width:100%;height:100%;object-fit:contain;";
    qrWrap.appendChild(qrFrameImg);

    var inset = document.createElement("div");
    inset.className = "bs-qr-inset";
    inset.style.left = lv.qrInset.left * 100 + "%";
    inset.style.top = lv.qrInset.top * 100 + "%";
    inset.style.width = lv.qrInset.width * 100 + "%";
    inset.style.height = lv.qrInset.height * 100 + "%";
    var qrImg = document.createElement("img");
    qrImg.alt = "QR";
    qrImg.style.cssText = "width:100%;height:100%;object-fit:contain;";
    inset.appendChild(qrImg);
    qrWrap.appendChild(inset);
    liveRoot.appendChild(qrWrap);

    micrositeQrImgEl = qrImg;
    function refreshMicrositeQr() {
      if (!micrositeQrImgEl) return;
      var base =
        site.assets.dynamicMicrositeQrUrl || site.assets.qrCode;
      var sep = String(base).indexOf("?") >= 0 ? "&" : "?";
      micrositeQrImgEl.src = base + sep + "t=" + Date.now();
    }
    refreshMicrositeQr();
    if (site.assets.dynamicMicrositeQrUrl) {
      if (micrositeQrTimer) clearInterval(micrositeQrTimer);
      micrositeQrTimer = setInterval(refreshMicrositeQr, 3 * 60 * 1000);
    }

    talentPhotoEl = document.createElement("div");
    talentPhotoEl.className =
      "bs-talent-photo led-bei-live-layer led-bei-live-talent-slot";
    talentPhotoEl.style.cssText = boxStyle(lv.talent);
    talentPhotoEl.style.transitionDuration = MOTION.liveLayerFadeMs + "ms";
    talentPhotoEl.style.transitionDelay = MOTION.liveStaggerMs + "ms";

    var talentInner = document.createElement("div");
    talentInner.className = "bs-fill";
    talentFadeEl = document.createElement("div");
    talentFadeEl.className = "led-bei-live-talent-fade led-bei-live-talent-fade--show";
    talentZoomEl = document.createElement("div");
    talentZoomEl.className = "led-bei-talent-zoom relative size-full";
    talentPhotoImg = document.createElement("img");
    talentPhotoImg.alt = "";
    talentPhotoImg.style.cssText =
      "width:100%;height:100%;object-fit:contain;object-position:bottom center;";
    talentZoomEl.appendChild(talentPhotoImg);
    talentFadeEl.appendChild(talentZoomEl);
    talentInner.appendChild(talentFadeEl);
    talentPhotoEl.appendChild(talentInner);
    liveRoot.appendChild(talentPhotoEl);

    staticRoot = document.createElement("div");
    staticRoot.className =
      "bs-static-root led-bei-static-layer led-bei-static-layer--enter";
    stageEl.appendChild(staticRoot);

    staticContentEl = document.createElement("div");
    staticContentEl.className = "bs-fill";
    staticRoot.appendChild(staticContentEl);

    var st = site.layout.static;
    if (site.clearMode === "split" && st.clear && site.assets.clearStatic) {
      addImg(staticContentEl, site.assets.clearStatic, st.clear);
    } else if (site.clearMode === "shared" && st.clear && site.assets.clear) {
      addImg(staticContentEl, site.assets.clear, st.clear);
    } else if (
      site.clearMode === "dual" &&
      site.assets.clearLive &&
      site.layout.shared
    ) {
      addImg(
        staticContentEl,
        site.assets.clear,
        site.layout.shared.clearLeft,
      );
      addImg(
        staticContentEl,
        site.assets.clear,
        site.layout.shared.clearRight,
      );
    }

    packMotionEl = document.createElement("div");
    packMotionEl.className =
      "led-bei-static-pack-motion led-bei-static-pack-motion--in-right absolute";
    packMotionEl.style.cssText = boxStyle(st.pack);
    setMotionVars(packMotionEl, {
      "--bei-slide-offset": MOTION.slideOffsetPx + "px",
      "--bei-live-enter-ms": MOTION.liveEnterMs + "ms",
    });
    var packImg = document.createElement("img");
    packImg.src = site.assets.pack;
    packImg.alt = "";
    packImg.style.cssText = "width:100%;height:100%;object-fit:contain;object-position:left top;";
    packMotionEl.appendChild(packImg);
    staticContentEl.appendChild(packMotionEl);

    staticForegroundEl = document.createElement("div");
    staticForegroundEl.className = "pointer-events-none absolute inset-0";
    staticContentEl.appendChild(staticForegroundEl);

    staticTalentWrap = document.createElement("div");
    staticTalentWrap.className = "led-bei-talent-zoom absolute";
    staticTalentWrap.style.cssText = boxStyle(st.talent);
    setMotionVars(staticTalentWrap, {
      animationDuration: timing.staticDurationMs + "ms",
    });
    var talentImg = document.createElement("img");
    talentImg.src = site.assets.talent;
    talentImg.alt = "";
    talentImg.style.cssText =
      "width:100%;height:100%;object-fit:contain;object-position:bottom center;";
    staticTalentWrap.appendChild(talentImg);
    staticForegroundEl.appendChild(staticTalentWrap);

    var textLayer = document.createElement("div");
    textLayer.className = "bs-layer";
    textLayer.style.cssText = boxStyle(st.text);
    var textImg = document.createElement("img");
    textImg.src = site.assets.text;
    textImg.alt = "";
    textImg.draggable = false;
    textImg.style.cssText =
      "width:100%;height:100%;object-fit:contain;object-position:left bottom;";
    textLayer.appendChild(textImg);
    staticForegroundEl.appendChild(textLayer);

    if (site.assets.end) {
      outroRoot = document.createElement("div");
      outroRoot.className = "bs-static-root bs-outro-root bs-static-hidden";
      stageEl.appendChild(outroRoot);
      addImg(
        outroRoot,
        site.assets.end,
        {
          left: 0,
          top: 0,
          width: site.canvas.width,
          height: site.canvas.height,
        },
        null,
        true,
      );
    }

    scaleStage();
    window.addEventListener("resize", scaleStage);
    preloadAssets();
  }

  function preloadAssets() {
    var urls = [];
    var a = site.assets;
    urls.push(
      a.background,
      a.pack,
      a.packGroup,
      a.talent,
      a.text,
      a.tagline,
      a.qrFrame,
      a.qrCode,
    );
    if (dummyTalents.length) {
      for (var d = 0; d < dummyTalents.length; d++) {
        if (dummyTalents[d].url) urls.push(dummyTalents[d].url);
      }
    } else if (a.dummyTalent) {
      urls.push(a.dummyTalent);
    }
    if (a.clear) urls.push(a.clear);
    if (a.clearStatic) urls.push(a.clearStatic);
    if (a.clearLive) urls.push(a.clearLive);
    if (a.end) urls.push(a.end);
    for (var i = 0; i < urls.length; i++) {
      var im = new Image();
      im.src = urls[i];
    }
  }

  function queueCapacity() {
    if (isSequenceLoop) return Math.min(bufferSize, 3);
    return bufferSize;
  }

  function slots() {
    var held = (currentItem ? 1 : 0) + upcoming.length;
    return Math.max(0, queueCapacity() - held);
  }

  function heldQueueId(queueId) {
    if (currentItem && currentItem.queue_id === queueId) return true;
    for (var i = 0; i < upcoming.length; i++) {
      if (upcoming[i].queue_id === queueId) return true;
    }
    return false;
  }

  function armSlotDeadline() {
    if (slotTimer) clearTimeout(slotTimer);
    slotStart = Date.now();
    slotFrozen = false;
    document.body.classList.remove("bs-frozen");
    slotTimer = setTimeout(function () {
      if (playTimer) {
        clearTimeout(playTimer);
        playTimer = 0;
      }
      if (currentItem && currentItem.queue_id > 0 && !replaying) {
        ackQueue(currentItem.queue_id);
      }
      currentItem = null;
      hideLiveTalentSlot();
      hideParticipantName();
      if (introDone && !introRunning) {
        runIntroCycle();
      }
    }, timing.slotPlayableMs);
  }

  function capPlayMs(requested) {
    if (isSequenceLoop && liveSegmentEnd) {
      var liveLeft = liveSegmentEnd - Date.now();
      if (liveLeft <= 0) return 800;
      return Math.max(800, Math.min(requested, liveLeft));
    }
    if (!slotStart) return requested;
    var elapsed = Date.now() - slotStart;
    var budget = timing.slotPlayableMs - elapsed;
    if (budget <= 0) return 800;
    return Math.max(800, Math.min(requested, budget));
  }

  function revealLiveLayers() {
    if (!liveRoot) return;
    var layers = liveRoot.querySelectorAll(".led-bei-live-layer");
    for (var i = 0; i < layers.length; i++) {
      layers[i].classList.add("led-bei-live-layer--visible");
    }
  }

  function hideLiveLayers() {
    if (!liveRoot) return;
    var layers = liveRoot.querySelectorAll(".led-bei-live-layer");
    for (var i = 0; i < layers.length; i++) {
      layers[i].classList.remove("led-bei-live-layer--visible");
    }
  }

  function showLive(visible) {
    if (!liveRoot) return;
    if (sharedClearEl && site.assets.clearLive) {
      sharedClearEl.style.visibility =
        visible ? "hidden" : "visible";
    }
    if (visible) {
      liveRoot.style.display = "block";
      liveRoot.classList.add("bs-live-active");
      suppressLiveTalentUntil =
        Date.now() + MOTION.liveHandoffMs + 450;
      window.requestAnimationFrame(function () {
        revealLiveLayers();
      });
    } else {
      liveRoot.classList.remove("bs-live-active");
      liveRoot.style.display = "none";
      hideLiveLayers();
    }
  }

  function showStatic(visible) {
    if (!staticRoot) return;
    if (visible) staticRoot.classList.remove("bs-static-hidden");
    else staticRoot.classList.add("bs-static-hidden");
  }

  function showOutro(visible) {
    if (!outroRoot) return;
    if (visible) outroRoot.classList.remove("bs-static-hidden");
    else outroRoot.classList.add("bs-static-hidden");
  }

  function clearSequencePhaseTimers() {
    if (liveSegmentTimer) clearTimeout(liveSegmentTimer);
    liveSegmentTimer = 0;
    if (outroTimer) clearTimeout(outroTimer);
    outroTimer = 0;
    liveSegmentEnd = 0;
  }

  function resetStaticMotion() {
    if (!staticRoot || !staticContentEl || !packMotionEl) return;
    staticRoot.className =
      "bs-static-root led-bei-static-layer led-bei-static-layer--enter";
    staticContentEl.className = "bs-fill";
    packMotionEl.className =
      "led-bei-static-pack-motion led-bei-static-pack-motion--in-right absolute";
    packMotionEl.style.cssText = boxStyle(site.layout.static.pack);
    setMotionVars(packMotionEl, {
      "--bei-slide-offset": MOTION.slideOffsetPx + "px",
      "--bei-live-enter-ms": MOTION.liveEnterMs + "ms",
    });
    if (staticRoot) {
      staticRoot.classList.remove("led-bei-static-layer--enter");
      void staticRoot.offsetWidth;
      staticRoot.classList.add("led-bei-static-layer--enter");
    }
    if (staticForegroundEl) {
      staticForegroundEl.className = "pointer-events-none absolute inset-0";
    }
    if (staticTalentWrap) {
      staticTalentWrap.className = "led-bei-talent-zoom absolute";
      staticTalentWrap.style.cssText = boxStyle(site.layout.static.talent);
      setMotionVars(staticTalentWrap, {
        animationDuration: timing.staticDurationMs + "ms",
      });
      void staticTalentWrap.offsetWidth;
      var staticImg = staticTalentWrap.querySelector("img");
      if (staticImg) staticImg.src = site.assets.talent;
    }
  }

  function resetCityvisionSlotForIntro() {
    slotFrozen = false;
    document.body.classList.remove("bs-frozen");
    if (slotTimer) clearTimeout(slotTimer);
    slotStart = Date.now();
    armSlotDeadline();
  }

  function isDummyPlayback(url, queueId) {
    return Boolean(url && isDummyQueueId(queueId));
  }

  function isQueueSubmission(url, queueId) {
    return Boolean(url && queueId != null && queueId > 0);
  }

  function isVideoMediaUrl(url) {
    return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url || "");
  }

  function sleepMs(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  /**
   * One attempt: resolve(true) when bytes are usable, false on error (entry removed so retries work).
   * Do not treat error as success — avoids empty talent slot on bad OOH links.
   */
  function preloadMediaUrlOnce(url) {
    var trimmed = (url || "").trim();
    if (!trimmed) {
      return Promise.resolve(false);
    }
    var existing = preloadCache[trimmed];
    if (existing) {
      return existing;
    }
    var task = new Promise(function (resolve) {
      if (isVideoMediaUrl(trimmed)) {
        var video = document.createElement("video");
        video.preload = "auto";
        video.muted = true;
        video.playsInline = true;
        video.addEventListener("loadeddata", function () {
          resolve(true);
        }, { once: true });
        video.addEventListener("error", function () {
          delete preloadCache[trimmed];
          resolve(false);
        }, { once: true });
        video.src = trimmed;
        video.load();
        return;
      }
      var img = new Image();
      if (img.decoding) img.decoding = "async";
      function onImgLoad() {
        if (typeof img.decode === "function") {
          img.decode().then(
            function () {
              resolve(true);
            },
            function () {
              resolve(true);
            },
          );
          return;
        }
        resolve(true);
      }
      img.addEventListener("load", onImgLoad, { once: true });
      img.addEventListener("error", function () {
        delete preloadCache[trimmed];
        resolve(false);
      }, { once: true });
      img.src = trimmed;
    });
    preloadCache[trimmed] = task;
    return task;
  }

  /** Background warm-cache: failures are ignored (no callback contract). */
  function preloadMediaUrl(url) {
    void preloadMediaUrlOnce(url);
  }

  function waitUntilMediaReady(url, maxWaitMs) {
    var trimmed = (url || "").trim();
    if (!trimmed) {
      return Promise.resolve(false);
    }
    var cap = typeof maxWaitMs === "number" ? maxWaitMs : 90000;
    var started = Date.now();
    var gap = 250;
    return (function tryLoad() {
      return preloadMediaUrlOnce(trimmed).then(function (ok) {
        if (ok) {
          return true;
        }
        if (Date.now() - started >= cap) {
          return false;
        }
        return sleepMs(gap).then(function () {
          gap = Math.min(Math.floor(gap * 1.4), 3000);
          return tryLoad();
        });
      });
    })();
  }

  function preloadQueueItems(items) {
    if (!items || !items.length) return;
    for (var i = 0; i < items.length; i++) {
      if (items[i] && items[i].url) preloadMediaUrl(items[i].url);
    }
  }

  function isQueueSubmissionItem(item) {
    return Boolean(
      item &&
        item.url &&
        item.queue_id != null &&
        item.queue_id > 0,
    );
  }

  /**
   * Pop the next playable item once its media is ready. On failure, rotate to back (same as web player).
   */
  function takeNextReadyQueueItem(maxWaitMs) {
    var maxAttempts = Math.max(upcoming.length * 3, 3);
    var attempt = 0;

    function step() {
      if (upcoming.length === 0) {
        return Promise.resolve(null);
      }
      if (attempt >= maxAttempts) {
        return Promise.resolve(upcoming.shift());
      }
      attempt += 1;
      var next = upcoming[0];
      if (!next || !next.url || !String(next.url).trim()) {
        return Promise.resolve(upcoming.shift());
      }
      if (isDummyQueueId(next.queue_id)) {
        return Promise.resolve(upcoming.shift());
      }
      if (!isQueueSubmissionItem(next)) {
        return Promise.resolve(upcoming.shift());
      }
      return waitUntilMediaReady(next.url, maxWaitMs).then(function (ok) {
        if (ok) {
          return upcoming.shift();
        }
        var failed = upcoming.shift();
        if (failed) {
          upcoming.push(failed);
        }
        return step();
      });
    }

    return step();
  }

  function maybeScheduleIntroAfterIdle() {
    scheduleIntroAfterIdle();
  }

  function mountTalentImgWhenReady(url, whenReady) {
    if (!talentPhotoImg) return;
    waitUntilMediaReady(url, 60000).then(function () {
      if (!talentPhotoImg) return;

      function ready() {
        if (whenReady) whenReady();
      }

      function onDone() {
        talentPhotoImg.onload = null;
        talentPhotoImg.onerror = null;
        ready();
      }

      talentPhotoImg.onload = onDone;
      talentPhotoImg.onerror = onDone;
      talentPhotoImg.src = url;

      if (talentPhotoImg.complete && talentPhotoImg.naturalWidth > 0) {
        onDone();
      }
    });
  }

  function hideLiveTalentSlot() {
    if (!talentPhotoEl || !talentPhotoImg) return;
    clearTalentTimers();
    prevPlaybackQueueId = null;
    talentPhotoEl.style.visibility = "hidden";
    talentPhotoImg.removeAttribute("src");
    applyTalentFadeClass("show");
  }

  function applyNameFadeClass(mode) {
    if (!nameFadeEl) return;
    nameFadeEl.className = "size-full led-bei-live-talent-fade";
    if (mode === "in") {
      nameFadeEl.classList.add("led-bei-live-talent-fade--in-subtle");
      setMotionVars(nameFadeEl, {
        "--bei-live-talent-fade-in-ms": MOTION.liveTalentFadeInMs + "ms",
      });
    } else if (mode === "out") {
      nameFadeEl.classList.add("led-bei-live-talent-fade--out");
    } else if (mode === "show") {
      nameFadeEl.classList.add("led-bei-live-talent-fade--show");
    }
  }

  function hideParticipantName() {
    if (nameExitTimer) clearTimeout(nameExitTimer);
    nameExitTimer = 0;
    prevNameQueueId = null;
    if (nameTextEl) nameTextEl.textContent = "";
    if (nameWrapEl) nameWrapEl.style.visibility = "hidden";
    applyNameFadeClass("show");
  }

  function setParticipantName(text, queueId, durationMs) {
    if (!nameTextEl || !nameWrapEl) return;
    if (nameExitTimer) clearTimeout(nameExitTimer);
    nameExitTimer = 0;

    var display = ledParticipantDisplayName(text);
    if (!display || queueId == null || queueId === 0) {
      if (prevNameQueueId != null && prevNameQueueId !== 0) {
        applyNameFadeClass("out");
        nameExitTimer = setTimeout(hideParticipantName, timing.fadeOutMs);
      } else {
        hideParticipantName();
      }
      return;
    }

    nameWrapEl.style.visibility = "visible";
    nameTextEl.textContent = display;

    var prevId = prevNameQueueId;
    prevNameQueueId = queueId;
    var ms = durationMs || playMs;

    function beginNameIn() {
      applyNameFadeClass("in");
      nameExitTimer = setTimeout(function () {
        applyNameFadeClass("out");
      }, Math.max(0, ms - timing.fadeOutMs));
    }

    if (prevId != null && prevId > 0 && prevId !== queueId) {
      beginNameIn();
      return;
    }

    beginNameIn();
  }

  function clearTalentTimers() {
    if (talentExitTimer) clearTimeout(talentExitTimer);
    if (talentSwapTimer) clearTimeout(talentSwapTimer);
    talentExitTimer = 0;
    talentSwapTimer = 0;
  }

  function liveTalentZoomMs(durationMs) {
    var holdMs = durationMs - timing.fadeOutMs;
    return Math.max(2400, holdMs);
  }

  function applyTalentFadeClass(mode) {
    if (!talentFadeEl || !talentZoomEl) return;
    talentFadeEl.className = "led-bei-live-talent-fade";
    if (mode === "in") {
      talentFadeEl.classList.add("led-bei-live-talent-fade--in-subtle");
      talentZoomEl.className =
        "led-bei-live-talent-zoom relative size-full";
      setMotionVars(talentZoomEl, {
        "--bei-live-talent-zoom-ms":
          liveTalentZoomMs(playMs) + "ms",
        "--bei-live-talent-fade-in-ms": MOTION.liveTalentFadeInMs + "ms",
      });
    } else if (mode === "out") {
      talentFadeEl.classList.add("led-bei-live-talent-fade--out");
      talentZoomEl.className =
        "led-bei-live-talent-zoom led-bei-live-talent-zoom--hold relative size-full";
    } else {
      talentFadeEl.classList.add("led-bei-live-talent-fade--show");
      talentZoomEl.className = "led-bei-talent-zoom relative size-full";
    }
  }

  function showTalentPhoto(url, queueId, durationMs, whenShown) {
    if (!talentPhotoImg || !talentPhotoEl) return;
    clearTalentTimers();
    var showGen = ++talentShowGen;

    if (
      introDone &&
      !isQueueSubmission(url, queueId) &&
      !isDummyPlayback(url, queueId) &&
      Date.now() < suppressLiveTalentUntil
    ) {
      hideLiveTalentSlot();
      return;
    }

    /** Dummy slots use the same enter→hold→exit fade as real submissions (not static "show"). */
    if (isDummyPlayback(url, queueId)) {
      var prevDummyId = prevPlaybackQueueId;
      prevPlaybackQueueId = queueId;
      talentPhotoEl.style.visibility = "visible";

      function beginDummyEnter() {
        mountTalentImgWhenReady(url, function () {
          if (showGen !== talentShowGen) return;
          applyTalentFadeClass("in");
          talentExitTimer = setTimeout(function () {
            applyTalentFadeClass("out");
          }, Math.max(0, durationMs - timing.fadeOutMs));
          if (whenShown) whenShown();
        });
      }

      if (prevDummyId != null && prevDummyId !== queueId) {
        beginDummyEnter();
        return;
      }
      beginDummyEnter();
      return;
    }

    if (!isQueueSubmission(url, queueId)) {
      var had = prevPlaybackQueueId != null && prevPlaybackQueueId > 0;
      if (!had) {
        hideLiveTalentSlot();
        return;
      }
      applyTalentFadeClass("out");
      talentSwapTimer = setTimeout(hideLiveTalentSlot, timing.fadeOutMs);
      return;
    }

    var prevId = prevPlaybackQueueId;
    prevPlaybackQueueId = queueId;
    talentPhotoEl.style.visibility = "visible";

    function beginEnter() {
      mountTalentImgWhenReady(url, function () {
        if (showGen !== talentShowGen) return;
        applyTalentFadeClass("in");
        talentExitTimer = setTimeout(function () {
          applyTalentFadeClass("out");
        }, Math.max(0, durationMs - timing.fadeOutMs));
        if (whenShown) whenShown();
      });
    }

    if (prevId != null && prevId > 0 && prevId !== queueId) {
      beginEnter();
      return;
    }

    beginEnter();
  }

  function replayItemsForPlayback(items) {
    var sorted = items.slice().sort(function (a, b) {
      return b.queue_id - a.queue_id;
    });
    if (!isSequenceLoop) return sorted;
    return sorted.slice(0, 3);
  }

  function pullQueue(limit, replay, done) {
    if (pulling || slotFrozen || !started) {
      if (done) done(false);
      return;
    }
    if (introDone && replay) {
      if (done) done(false);
      return;
    }
    if (introDone && !replay && slots() <= 0) {
      if (done) done(false);
      return;
    }

    pulling = true;
    var beforeLen = upcoming.length;
    var url =
      apiQueuePath(
        "/next?limit=" +
          limit +
          "&replay=" +
          (replay ? "1" : "0") +
          "&order=desc",
      );
    fetch(url, { headers: { "x-led-key": ledKey, Accept: "application/json" } })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.message || "pull failed");
          if (data.play_ms && !isSequenceLoop) playMs = data.play_ms;
          if (data.buffer_size) bufferSize = data.buffer_size;
          if (data.mode === "fresh") {
            replaying = false;
            if (data.items && data.items.length) {
              var buffered = [];
              for (var i = 0; i < data.items.length; i++) {
                var item = data.items[i];
                if (!heldQueueId(item.queue_id) && slots() > 0) {
                  upcoming.push(item);
                  buffered.push(item);
                }
              }
              preloadQueueItems(buffered);
            }
          } else if (data.mode === "replay" && replay && data.items) {
            replaying = true;
            upcoming = replayItemsForPlayback(data.items);
            preloadQueueItems(upcoming);
          }
        });
      })
      .catch(function () {
        /* keep playing with empty queue */
      })
      .then(function () {
        pulling = false;
        if (done) done(upcoming.length !== beforeLen);
      });
  }

  function maybeReplayFill(done) {
    if (upcoming.length > 0 || currentItem || replaying) {
      if (done) done();
      return;
    }
    var replayLimit = isSequenceLoop ? queueCapacity() : bufferSize;
    pullQueue(replayLimit, true, function () {
      if (done) done();
    });
  }

  function fillQueueDuringIntro(done) {
    if (introDone || slotFrozen || !started) {
      if (done) done();
      return;
    }
    var free = slots();
    if (free <= 0) {
      maybeReplayFill(done);
      return;
    }
    pullQueue(free, false, function (progress) {
      if (introDone) {
        if (done) done();
        return;
      }
      if (!progress) {
        maybeReplayFill(done);
        return;
      }
      fillQueueDuringIntro(done);
    });
  }

  function ackQueue(queueId) {
    fetch(apiQueuePath("/played"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-led-key": ledKey,
      },
      body: JSON.stringify({ queue_ids: [queueId] }),
    }).catch(function () {});
  }

  function finishCurrent() {
    var done = currentItem;
    if (done && done.queue_id > 0 && !replaying) {
      ackQueue(done.queue_id);
    }
    if (done && isDummyQueueId(done.queue_id)) {
      if (upcoming.length > 0) {
        playbackAdvancing = true;
        takeNextReadyQueueItem(60000).then(function (next) {
          playbackAdvancing = false;
          if (!introDone || slotFrozen) return;
          if (!next) {
            currentItem = null;
            tryStartPlayback();
            return;
          }
          if (playTimer) clearTimeout(playTimer);
          playTimer = 0;
          currentItem = next;
          liveHadPlayback = true;
          hideParticipantName();
          showTalentPhoto(
            next.url,
            next.queue_id,
            itemPlayMs(next),
            function () {
              if (currentItem !== next) return;
              if (!introDone || slotFrozen) return;
              setParticipantName(
                next.nama || "",
                next.queue_id,
                itemPlayMs(next),
              );
              armCurrent(itemPlayMs(next));
            },
          );
        });
        return;
      }
      currentItem = null;
      if (playTimer) clearTimeout(playTimer);
      hideLiveTalentSlot();
      hideParticipantName();
      if (!isSequenceLoop) maybeScheduleIntroAfterIdle();
      return;
    }
    if (
      isSequenceLoop &&
      !slotFrozen &&
      introDone &&
      upcoming.length > 0
    ) {
      playbackAdvancing = true;
      takeNextReadyQueueItem(60000).then(function (next) {
        playbackAdvancing = false;
        if (!introDone || slotFrozen) return;
        if (!next) {
          currentItem = null;
          tryStartPlayback();
          return;
        }
        if (playTimer) clearTimeout(playTimer);
        playTimer = 0;
        currentItem = next;
        liveHadPlayback = true;
        hideParticipantName();
        showTalentPhoto(
          next.url,
          next.queue_id,
          itemPlayMs(next),
          function () {
            if (currentItem !== next) return;
            if (!introDone || slotFrozen) return;
            setParticipantName(
              next.nama || "",
              next.queue_id,
              itemPlayMs(next),
            );
            armCurrent(itemPlayMs(next));
          },
        );
      });
      return;
    }
    currentItem = null;
    if (playTimer) clearTimeout(playTimer);
    tryStartPlayback();
    if (
      !isSequenceLoop &&
      !currentItem &&
      upcoming.length === 0 &&
      introDone &&
      liveHadPlayback
    ) {
      maybeScheduleIntroAfterIdle();
    }
  }

  function armCurrent(ms) {
    if (playTimer) clearTimeout(playTimer);
    var wait = capPlayMs(ms);
    playTimer = setTimeout(finishCurrent, wait);
  }

  function itemPlayMs(item) {
    if (item && isDummyQueueId(item.queue_id)) {
      return timing.dummyPlayMs;
    }
    if (isSequenceLoop) return liveSegmentPlayMs;
    return playMs;
  }

  function tryStartPlayback() {
    if (!introDone) return;
    if (currentItem) return;
    if (playbackAdvancing) return;
    if (slotFrozen) {
      if (upcoming.length === 0 && liveHadPlayback) {
        scheduleIntroAfterIdle();
      }
      return;
    }

    if (upcoming.length > 0) {
      playbackAdvancing = true;
      takeNextReadyQueueItem(60000).then(function (playing) {
        playbackAdvancing = false;
        if (!introDone || slotFrozen) return;
        if (!playing) {
          tryStartPlayback();
          return;
        }
        currentItem = playing;
        liveHadPlayback = true;
        hideParticipantName();
        showTalentPhoto(
          playing.url,
          playing.queue_id,
          itemPlayMs(playing),
          function () {
            if (currentItem !== playing) return;
            if (!introDone || slotFrozen) return;
            setParticipantName(
              playing.nama || "",
              playing.queue_id,
              itemPlayMs(playing),
            );
            armCurrent(itemPlayMs(playing));
          },
        );
      });
      return;
    }

    hideParticipantName();
    hideLiveTalentSlot();

    if (
      !dummyPlayed &&
      upcoming.length === 0 &&
      dummyTalents.length > 0 &&
      (isSequenceLoop || !liveHadPlayback)
    ) {
      dummyPlayed = true;
      liveHadPlayback = true;
      var firstDummy = dummyTalents[0];
      for (var qi = 1; qi < dummyTalents.length; qi++) {
        var row = dummyTalents[qi];
        upcoming.push({
          queue_id: row.queue_id,
          submission_id: 0,
          url: row.url,
          nama: row.nama || "",
        });
      }
      currentItem = {
        queue_id: firstDummy.queue_id,
        submission_id: 0,
        url: firstDummy.url,
        nama: firstDummy.nama || "",
      };
      var dummySlotMs = itemPlayMs(currentItem);
      showTalentPhoto(
        firstDummy.url,
        firstDummy.queue_id,
        dummySlotMs,
        function () {
          if (
            currentItem &&
            currentItem.queue_id === firstDummy.queue_id &&
            isDummyQueueId(firstDummy.queue_id)
          ) {
            setParticipantName(
              firstDummy.nama || "",
              firstDummy.queue_id,
              dummySlotMs,
            );
            armCurrent(dummySlotMs);
          }
        },
      );
      return;
    }

    if (!isSequenceLoop && liveHadPlayback) {
      scheduleIntroAfterIdle();
    }
  }

  function endLiveSegment() {
    liveSegmentTimer = 0;
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = 0;
    }
    if (playTimer) clearTimeout(playTimer);
    playTimer = 0;
    if (currentItem && currentItem.queue_id > 0 && !replaying) {
      ackQueue(currentItem.queue_id);
    }
    currentItem = null;
    clearTalentTimers();
    hideLiveTalentSlot();
    hideParticipantName();
    upcoming = [];
    runOutroPhase();
  }

  function runOutroPhase() {
    if (!isSequenceLoop) {
      scheduleIntroAfterIdle();
      return;
    }
    introDone = false;
    showLive(false);
    showStatic(false);
    showOutro(true);
    if (outroTimer) clearTimeout(outroTimer);
    outroTimer = setTimeout(function () {
      outroTimer = 0;
      showOutro(false);
      runIntroCycle();
    }, timing.outroDurationMs || 4000);
  }

  function scheduleIntroAfterIdle() {
    if (!introDone) return;
    if (currentItem || upcoming.length > 0) return;
    setTimeout(runIntroCycle, 400);
  }

  function runIntroCycle() {
    if (!started || introRunning) return;
    clearSequencePhaseTimers();
    showOutro(false);
    resetCityvisionSlotForIntro();
    introRunning = true;
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = 0;
    }
    introDone = false;
    replaying = false;
    liveHadPlayback = false;
    dummyPlayed = false;
    upcoming = [];
    currentItem = null;
    prevPlaybackQueueId = null;
    if (playTimer) clearTimeout(playTimer);
    clearTalentTimers();
    hideParticipantName();
    hideLiveTalentSlot();
    showLive(false);
    showStatic(true);
    resetStaticMotion();

    var exitAt = Math.max(0, timing.staticDurationMs - timing.fadeOutMs);
    setTimeout(function () {
      if (introDone) return;
      if (staticForegroundEl) {
        staticForegroundEl.classList.add("led-bei-static-exit-fade");
        setMotionVars(staticForegroundEl, {
          "--bei-static-fade-out-ms": timing.fadeOutMs + "ms",
        });
      }
      if (packMotionEl) {
        packMotionEl.classList.remove("led-bei-static-pack-motion--in-right");
        packMotionEl.classList.add("led-bei-static-pack-motion--out-left");
      }
    }, exitAt);

    setTimeout(startLivePhase, timing.liveStartMs);
    fillQueueDuringIntro(function () {});
  }

  function startLivePhase() {
    introRunning = false;
    introDone = true;
    showStatic(false);
    showOutro(false);
    showLive(true);
    if (isSequenceLoop) {
      planLiveSegmentPlayback();
      var liveMs = timing.liveDurationMs || 9000;
      liveSegmentEnd = Date.now() + liveMs;
      if (liveSegmentTimer) clearTimeout(liveSegmentTimer);
      liveSegmentTimer = setTimeout(endLiveSegment, liveMs);
    }
    tryStartPlayback();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(function () {
      if (!introDone || slotFrozen || slots() <= 0) return;
      pullQueue(Math.min(3, slots()), false, function () {
        if (!currentItem) tryStartPlayback();
      });
    }, 5000);
  }

  function onBroadSignStart() {
    if (started) return;
    started = true;
    document.body.classList.add("bs-playing");
    armSlotDeadline();
    showStatic(true);
    showLive(false);
    runIntroCycle();
  }

  function waitForStart() {
    if (window.__bsStarted) {
      onBroadSignStart();
      return;
    }
    window.addEventListener("bs-start", onBroadSignStart);
  }

  buildDom();
  waitForStart();
})();
