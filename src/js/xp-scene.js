(() => {
  const root = document.documentElement;
  const motionPref = window.matchMedia("(prefers-reduced-motion: reduce)");

  function hexToArray(hex) {
    const clean = hex.replace("#", "").trim();
    if (clean.length === 3) {
      return [
        parseInt(clean[0] + clean[0], 16),
        parseInt(clean[1] + clean[1], 16),
        parseInt(clean[2] + clean[2], 16)
      ];
    }
    const num = parseInt(clean, 16);
    if (Number.isNaN(num)) return [161, 211, 200];
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  let scrollEraCard = null;
  let targetPrimary = [161, 211, 200];
  let targetAccent = [155, 191, 201];
  let currentPrimary = [161, 211, 200];
  let currentAccent = [155, 191, 201];
  let waveEnergy = 1.15;
  let targetWaveEnergy = 1.15;
  let paused = motionPref.matches;

  function applyThemeColors(color, accent) {
    targetPrimary = hexToArray(color);
    targetAccent = hexToArray(accent);
    root.style.setProperty("--era-color", color);
    root.style.setProperty("--era-accent", accent);
    root.style.setProperty("--era-rgb", targetPrimary.join(", "));
    root.style.setProperty("--era-accent-rgb", targetAccent.join(", "));
  }

  /* =========================================================
     1. SCROLL PROGRESS, ERA ENGINE & TICKER TELEMETRY
     ========================================================= */

  const chapters = Array.from(document.querySelectorAll(".chapter-card"));
  const eraLinks = Array.from(document.querySelectorAll(".era-link"));
  const railFill = document.getElementById("era-track-fill");

  function setActiveEra(card) {
    if (!card) return;
    scrollEraCard = card;
    const color = card.dataset.color || "#a1d3c8";
    const accent = card.dataset.accent || "#9bbfc9";

    applyThemeColors(color, accent);

    const idx = chapters.indexOf(card);
    if (railFill && idx >= 0) {
      const pct = ((idx + 1) / chapters.length) * 100;
      railFill.style.setProperty("--rail-progress", `${pct}%`);
    }

    chapters.forEach((c) => c.classList.toggle("is-active-era", c === card));
    eraLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.eraTarget === card.id);
    });
  }

  function updateScrollBeam() {
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
    root.style.setProperty("--scroll-progress", progress.toFixed(4));
    if (window.scrollY < 160 && chapters.length) {
      setActiveEra(chapters[0]);
    }
  }

  window.addEventListener("scroll", updateScrollBeam, { passive: true });
  updateScrollBeam();

  if (chapters.length) {
    const visibleObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.16 }
    );
    chapters.forEach((card) => visibleObserver.observe(card));

    const eraObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveEra(visible[0].target);
        }
      },
      {
        rootMargin: "-22% 0px -48% 0px",
        threshold: [0.1, 0.35, 0.65]
      }
    );
    chapters.forEach((card) => eraObserver.observe(card));
    setActiveEra(chapters[0]);
  }

  /* =========================================================
     2. TRAJECTORY SWITCHBOARD INTERACTION
     ========================================================= */

  const trajectoryList = document.querySelector(".trajectory-list");
  const trajectoryRows = Array.from(document.querySelectorAll(".trajectory-row"));

  function previewTrajectoryRow(row) {
    trajectoryRows.forEach((r) => r.classList.toggle("is-active", r === row));
    const color = row.dataset.color || "#a1d3c8";
    const accent = row.dataset.accent || "#9bbfc9";
    targetWaveEnergy = parseFloat(row.dataset.energy || "1.1") || 1.1;
    applyThemeColors(color, accent);
  }

  trajectoryRows.forEach((row) => {
    row.addEventListener("mouseenter", () => previewTrajectoryRow(row));
    row.addEventListener("focus", () => previewTrajectoryRow(row));
    row.addEventListener("click", () => {
      previewTrajectoryRow(row);
      const target = document.querySelector(row.dataset.target || "#salesforce");
      target?.scrollIntoView({ behavior: motionPref.matches ? "auto" : "smooth", block: "start" });
    });
  });

  trajectoryList?.addEventListener("mouseleave", () => {
    targetWaveEnergy = 1.15;
    if (scrollEraCard) {
      applyThemeColors(
        scrollEraCard.dataset.color || "#a1d3c8",
        scrollEraCard.dataset.accent || "#9bbfc9"
      );
    }
  });

  /* =========================================================
     3. CARD SPOTLIGHT & PLATFORM STACK INSPECTOR
     ========================================================= */

  chapters.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mouse-x", `${x.toFixed(1)}%`);
      card.style.setProperty("--mouse-y", `${y.toFixed(1)}%`);
    });
  });

  const archNodes = Array.from(document.querySelectorAll(".arch-node"));
  const archDetail = document.getElementById("arch-stage-detail");
  if (archNodes.length && archDetail) {
    const selectArchNode = (node) => {
      archNodes.forEach((n) => n.classList.toggle("is-selected", n === node));
      archDetail.textContent = node.dataset.archInfo || "";
    };
    archNodes.forEach((node) => {
      node.addEventListener("mouseenter", () => selectArchNode(node));
      node.addEventListener("focus", () => selectArchNode(node));
      node.addEventListener("click", () => selectArchNode(node));
    });
    selectArchNode(archNodes[0]);
  }

  /* =========================================================
     4. INTERACTIVE PHOTO SWITCHER & LIGHTBOX MODAL
     ========================================================= */

  document.querySelectorAll(".media-switcher").forEach((switcher) => {
    const tabs = Array.from(switcher.querySelectorAll(".media-tab"));
    const trigger = switcher.querySelector(".photo-trigger");
    const img = trigger?.querySelector("img");
    const caption = switcher.querySelector(".media-caption");
    if (!tabs.length || !trigger || !img) return;

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle("is-active", active);
          t.setAttribute("aria-selected", String(active));
        });
        const src = tab.dataset.photoSrc;
        const alt = tab.dataset.photoAlt || img.alt;
        const cap = tab.dataset.photoCaption || "";
        if (src) {
          img.src = src;
          img.alt = alt;
          trigger.dataset.src = src;
          trigger.dataset.caption = cap;
        }
        if (caption && cap) caption.textContent = cap;
      });
    });
  });

  const lightbox = document.getElementById("photo-lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxClose = document.getElementById("lightbox-close");
  const lightboxBackdrop = document.getElementById("lightbox-backdrop");
  let lastFocusedTrigger = null;

  function openLightbox(trigger) {
    if (!lightbox || !lightboxImg || !lightboxCaption) return;
    const img = trigger.querySelector("img");
    const src = trigger.dataset.src || img?.src || "";
    const cap = trigger.dataset.caption || img?.alt || "";
    lastFocusedTrigger = trigger;
    lightboxImg.src = src;
    lightboxImg.alt = img?.alt || cap;
    lightboxCaption.textContent = cap;
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    lightboxClose?.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    lightboxImg.src = "";
    lastFocusedTrigger?.focus();
    lastFocusedTrigger = null;
  }

  document.querySelectorAll(".photo-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => openLightbox(trigger));
  });
  lightboxClose?.addEventListener("click", closeLightbox);
  lightboxBackdrop?.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });

  /* =========================================================
     5. 3D LUMINOUS COMPUTE WAVEFIELD (#hero-canvas)
     ========================================================= */

  const heroDeck = document.querySelector(".trajectory-deck");
  const heroCanvas = document.getElementById("hero-canvas");
  const heroCtx = heroCanvas?.getContext("2d");
  const motionToggleBtn = document.getElementById("motion-toggle-btn");

  const RIBBONS = 15;
  const SEGMENTS = 38;
  let waveWidth = 0;
  let waveHeight = 0;
  let wavePhase = 0;
  let waveYaw = 0.24;
  let wavePitch = 0.48;
  let pointerX = 0.5;
  let pointerY = 0.5;
  let pointerActive = false;
  let drag = null;
  let heroInView = true;

  function updateMotionButton() {
    if (motionToggleBtn) {
      motionToggleBtn.textContent = paused ? "Play wave" : "Pause wave";
    }
  }

  motionToggleBtn?.addEventListener("click", () => {
    paused = !paused;
    updateMotionButton();
  });
  updateMotionButton();

  function drawWavefield() {
    if (!heroCtx || !waveWidth || !waveHeight) return;
    heroCtx.clearRect(0, 0, waveWidth, waveHeight);

    const cosY = Math.cos(waveYaw);
    const sinY = Math.sin(waveYaw);
    const cosP = Math.cos(wavePitch);
    const sinP = Math.sin(wavePitch);

    const cx = waveWidth * 0.52;
    const cy = waveHeight * 0.54;
    const scaleBase = Math.min(waveWidth, waveHeight) * 0.54;

    const [r1, g1, b1] = currentPrimary;
    const [r2, g2, b2] = currentAccent;

    for (let r = 0; r < RIBBONS; r += 1) {
      const v = (r / (RIBBONS - 1)) * 2 - 1;
      const z0 = v * 1.15;
      const blend = r / (RIBBONS - 1);
      const mr = Math.round(r1 + (r2 - r1) * blend);
      const mg = Math.round(g1 + (g2 - g1) * blend);
      const mb = Math.round(b1 + (b2 - b1) * blend);

      heroCtx.beginPath();
      const crestPoints = [];

      for (let c = 0; c < SEGMENTS; c += 1) {
        const u = (c / (SEGMENTS - 1)) * 2 - 1;
        const x0 = u * 1.55;

        // Multi-harmonic 3D compute wave + cursor ripple
        let y0 =
          Math.sin(u * 2.7 + wavePhase + v * 1.6) * 0.24 +
          Math.cos(v * 3.0 - wavePhase * 0.8 + u * 1.2) * 0.16;

        if (pointerActive) {
          const dx = u - (pointerX * 2 - 1);
          const dz = v - (pointerY * 2 - 1);
          const d = Math.hypot(dx, dz);
          y0 -= Math.exp(-d * d * 4.5) * 0.24;
        }

        const x1 = x0 * cosY + z0 * sinY;
        const z1 = z0 * cosY - x0 * sinY;
        const y2 = y0 * cosP - z1 * sinP;
        const z2 = z1 * cosP + y0 * sinP;

        const persp = 3.4 / (3.4 - z2);
        const sx = cx + x1 * scaleBase * persp;
        const sy = cy + y2 * scaleBase * persp;

        if (c === 0) {
          heroCtx.moveTo(sx, sy);
        } else {
          heroCtx.lineTo(sx, sy);
        }

        if ((c + r) % 4 === 0) {
          crestPoints.push({ sx, sy, persp });
        }
      }

      const depthOpacity = 0.12 + (1 - Math.abs(v)) * 0.26;
      heroCtx.strokeStyle = `rgba(${mr}, ${mg}, ${mb}, ${depthOpacity.toFixed(3)})`;
      heroCtx.lineWidth = 1.15;
      heroCtx.stroke();

      // Luminous crest particles along wave ribbons
      crestPoints.forEach(({ sx, sy, persp }) => {
        heroCtx.beginPath();
        heroCtx.arc(sx, sy, 1.35 * persp, 0, Math.PI * 2);
        heroCtx.fillStyle = `rgba(${mr}, ${mg}, ${mb}, ${(depthOpacity * 1.65).toFixed(3)})`;
        heroCtx.fill();
      });
    }
  }

  if (heroCanvas && heroCtx) {
    const resizeWave = () => {
      const rect = heroCanvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      waveWidth = rect.width;
      waveHeight = rect.height;
      heroCanvas.width = Math.round(waveWidth * dpr);
      heroCanvas.height = Math.round(waveHeight * dpr);
      heroCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    heroDeck?.addEventListener("pointermove", (event) => {
      const rect = heroDeck.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / Math.max(1, rect.width);
      pointerY = (event.clientY - rect.top) / Math.max(1, rect.height);
      pointerActive = true;

      if (drag && drag.id === event.pointerId) {
        waveYaw += (event.clientX - drag.x) * 0.008;
        wavePitch = Math.max(0.15, Math.min(0.95, wavePitch + (event.clientY - drag.y) * 0.006));
        drag.x = event.clientX;
        drag.y = event.clientY;
      }
    });

    heroDeck?.addEventListener("pointerleave", () => {
      pointerActive = false;
    });

    heroCanvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      heroCanvas.setPointerCapture(event.pointerId);
    });

    heroCanvas.addEventListener("pointerup", () => {
      drag = null;
    });

    heroCanvas.addEventListener("lostpointercapture", () => {
      drag = null;
    });

    new ResizeObserver(resizeWave).observe(heroCanvas);
    new IntersectionObserver(([entry]) => {
      heroInView = entry.isIntersecting;
    }).observe(heroCanvas);
    resizeWave();
  }

  /* =========================================================
     6. AMBIENT BACKGROUND PARTICLE CONSTELLATION
     ========================================================= */

  const bgCanvas = document.getElementById("constellation-canvas");
  const bgCtx = bgCanvas?.getContext("2d");
  let bgWidth = 0;
  let bgHeight = 0;
  let stars = [];

  function initStars() {
    const count = Math.min(60, Math.max(22, Math.floor((bgWidth * bgHeight) / 28000)));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * bgWidth,
      y: Math.random() * bgHeight,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: 0.9 + Math.random() * 1.3
    }));
  }

  function resizeBg() {
    if (!bgCanvas || !bgCtx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    bgWidth = window.innerWidth;
    bgHeight = window.innerHeight;
    bgCanvas.width = Math.round(bgWidth * dpr);
    bgCanvas.height = Math.round(bgHeight * dpr);
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initStars();
  }

  function drawBackground() {
    if (!bgCtx || !bgWidth || !bgHeight) return;
    bgCtx.clearRect(0, 0, bgWidth, bgHeight);

    const rgbStr = `${Math.round(currentPrimary[0])}, ${Math.round(currentPrimary[1])}, ${Math.round(currentPrimary[2])}`;

    stars.forEach((s) => {
      if (!paused) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = bgWidth;
        if (s.x > bgWidth) s.x = 0;
        if (s.y < 0) s.y = bgHeight;
        if (s.y > bgHeight) s.y = 0;
      }
      bgCtx.beginPath();
      bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(${rgbStr}, 0.32)`;
      bgCtx.fill();
    });

    const maxDist = 130;
    bgCtx.lineWidth = 0.6;
    for (let i = 0; i < stars.length; i += 1) {
      for (let j = i + 1; j < stars.length; j += 1) {
        const dx = stars[i].x - stars[j].x;
        const dy = stars[i].y - stars[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * 0.13;
          bgCtx.strokeStyle = `rgba(${rgbStr}, ${opacity.toFixed(3)})`;
          bgCtx.beginPath();
          bgCtx.moveTo(stars[i].x, stars[i].y);
          bgCtx.lineTo(stars[j].x, stars[j].y);
          bgCtx.stroke();
        }
      }
    }
  }

  if (bgCanvas && bgCtx) {
    window.addEventListener("resize", resizeBg, { passive: true });
    resizeBg();
  }

  /* =========================================================
     7. UNIFIED ANIMATION LOOP (SMOOTH COLOR & ENERGY LERP)
     ========================================================= */

  let prevTime = null;
  function tick(now) {
    const dt = prevTime === null ? 0.016 : Math.min(0.05, (now - prevTime) / 1000);
    prevTime = now;

    // Smoothly interpolate theme colors & wave energy
    const ease = Math.min(1, dt * 6);
    for (let i = 0; i < 3; i += 1) {
      currentPrimary[i] += (targetPrimary[i] - currentPrimary[i]) * ease;
      currentAccent[i] += (targetAccent[i] - currentAccent[i]) * ease;
    }
    waveEnergy += (targetWaveEnergy - waveEnergy) * ease;

    if (!paused) {
      wavePhase += dt * 1.45 * waveEnergy;
    }

    if (heroInView && !document.hidden) {
      drawWavefield();
    }
    if (!document.hidden) {
      drawBackground();
    }
    window.requestAnimationFrame(tick);
  }

  motionPref.addEventListener("change", (event) => {
    paused = event.matches;
    updateMotionButton();
  });

  window.requestAnimationFrame(tick);
})();
