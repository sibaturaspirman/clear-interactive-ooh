/**
 * Broadsign / Chromium 87 LED player (vanilla). Bundled to /public/broadsign/player.js
 * Queue + motion aligned with `useInteractiveLedQueue` + `led-player.css`.
 */
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
  var prevPlaybackQueueId = null;
  var talentShowGen = 0;
  var preloadCache = {};

  var stageEl = null;
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

    if (site.clearMode === "dual" && site.layout.shared) {
      addImg(stageEl, site.assets.clear, site.layout.shared.clearLeft);
      addImg(stageEl, site.assets.clear, site.layout.shared.clearRight);
    } else if (
      site.clearMode === "shared" &&
      site.layout.shared &&
      site.layout.shared.clear
    ) {
      addImg(stageEl, site.assets.clear, site.layout.shared.clear);
    }

    liveRoot = document.createElement("div");
    liveRoot.className = "bs-live-root";
    stageEl.appendChild(liveRoot);

    var lv = site.layout.live;
    if (site.clearMode === "split" && lv.clear && site.assets.clearLive) {
      addLiveMotionLayer(liveRoot, site.assets.clearLive, lv.clear, null, 0);
    } else if (site.clearMode === "shared" && lv.clear && site.assets.clear) {
      addLiveMotionLayer(liveRoot, site.assets.clear, lv.clear, null, 0);
    }

    packGroupEl = addLiveMotionLayer(
      liveRoot,
      site.assets.packGroup,
      lv.packGroup,
      "led-bei-live-pack-float",
      1,
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
    qrImg.src = site.assets.qrCode;
    qrImg.alt = "QR";
    inset.appendChild(qrImg);
    qrWrap.appendChild(inset);
    liveRoot.appendChild(qrWrap);

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
      a.dummyTalent,
    );
    if (a.clear) urls.push(a.clear);
    if (a.clearStatic) urls.push(a.clearStatic);
    if (a.clearLive) urls.push(a.clearLive);
    for (var i = 0; i < urls.length; i++) {
      var im = new Image();
      im.src = urls[i];
    }
  }

  function slots() {
    var held = (currentItem ? 1 : 0) + upcoming.length;
    return Math.max(0, bufferSize - held);
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
    return Boolean(url && queueId === -1);
  }

  function isQueueSubmission(url, queueId) {
    return Boolean(url && queueId != null && queueId > 0);
  }

  function isVideoMediaUrl(url) {
    return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url || "");
  }

  function preloadMediaUrl(url, done) {
    var trimmed = (url || "").trim();
    if (!trimmed) {
      if (done) done();
      return;
    }
    if (Object.hasOwn(preloadCache, trimmed)) {
      preloadCache[trimmed].then(function () {
        if (done) done();
      });
      return;
    }
    preloadCache[trimmed] = new Promise(function (resolve) {
      if (isVideoMediaUrl(trimmed)) {
        var video = document.createElement("video");
        video.preload = "auto";
        video.muted = true;
        video.playsInline = true;
        var finish = function () {
          resolve();
        };
        video.addEventListener("loadeddata", finish, { once: true });
        video.addEventListener("error", finish, { once: true });
        video.src = trimmed;
        video.load();
        return;
      }
      var img = new Image();
      if (img.decoding) img.decoding = "async";
      var finish = function () {
        resolve();
      };
      img.addEventListener("load", finish, { once: true });
      img.addEventListener("error", finish, { once: true });
      img.src = trimmed;
    });
    preloadCache[trimmed].then(function () {
      if (done) done();
    });
  }

  function preloadQueueItems(items) {
    if (!items || !items.length) return;
    for (var i = 0; i < items.length; i++) {
      if (items[i] && items[i].url) preloadMediaUrl(items[i].url, null);
    }
  }

  function mountTalentImgWhenReady(url, whenReady) {
    preloadMediaUrl(url, function () {
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

    var display = (text || "").trim();
    if (!display || queueId == null || queueId <= 0) {
      if (prevNameQueueId != null && prevNameQueueId > 0) {
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
      applyNameFadeClass("out");
      nameExitTimer = setTimeout(beginNameIn, timing.fadeOutMs);
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

    if (isDummyPlayback(url, queueId)) {
      prevPlaybackQueueId = -1;
      talentPhotoEl.style.visibility = "visible";
      mountTalentImgWhenReady(url, function () {
        if (showGen !== talentShowGen) return;
        applyTalentFadeClass("show");
        if (whenShown) whenShown();
      });
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
      applyTalentFadeClass("out");
      talentSwapTimer = setTimeout(beginEnter, timing.fadeOutMs);
      return;
    }

    beginEnter();
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
      apiQueuePath("/next?limit=" + limit + "&replay=" + (replay ? "1" : "0"));
    fetch(url, { headers: { "x-led-key": ledKey, Accept: "application/json" } })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.message || "pull failed");
          if (data.play_ms) playMs = data.play_ms;
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
            upcoming = data.items.slice();
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
    pullQueue(bufferSize, true, function () {
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
    currentItem = null;
    if (playTimer) clearTimeout(playTimer);
    if (done && done.queue_id > 0 && !replaying) {
      ackQueue(done.queue_id);
    }
    if (done && done.queue_id === -1) {
      hideLiveTalentSlot();
      hideParticipantName();
      maybeScheduleIntroAfterIdle();
      return;
    }
    tryStartPlayback();
    if (!currentItem && upcoming.length === 0 && introDone && liveHadPlayback) {
      maybeScheduleIntroAfterIdle();
    }
  }

  function armCurrent(ms) {
    if (playTimer) clearTimeout(playTimer);
    var wait = capPlayMs(ms);
    playTimer = setTimeout(finishCurrent, wait);
  }

  function itemPlayMs(item) {
    if (item && item.queue_id === -1) return timing.dummyPlayMs;
    return playMs;
  }

  function tryStartPlayback() {
    if (!introDone) return;
    if (currentItem) return;
    if (slotFrozen) {
      if (upcoming.length === 0 && liveHadPlayback) {
        scheduleIntroAfterIdle();
      }
      return;
    }

    if (upcoming.length > 0) {
      var playing = upcoming.shift();
      currentItem = playing;
      liveHadPlayback = true;
      hideLiveTalentSlot();
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
      return;
    }

    hideParticipantName();
    hideLiveTalentSlot();

    if (!dummyPlayed && !liveHadPlayback) {
      dummyPlayed = true;
      liveHadPlayback = true;
      currentItem = {
        queue_id: -1,
        submission_id: 0,
        url: site.assets.dummyTalent,
        nama: "",
      };
      showTalentPhoto(
        site.assets.dummyTalent,
        -1,
        timing.dummyPlayMs,
        function () {
          if (currentItem && currentItem.queue_id === -1) {
            armCurrent(timing.dummyPlayMs);
          }
        },
      );
      return;
    }

    if (liveHadPlayback) {
      scheduleIntroAfterIdle();
    }
  }

  function scheduleIntroAfterIdle() {
    if (!introDone) return;
    if (currentItem || upcoming.length > 0) return;
    setTimeout(runIntroCycle, 400);
  }

  function runIntroCycle() {
    if (!started || introRunning) return;
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
    showLive(true);
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
