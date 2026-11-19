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

  let targetPrimary = [161, 211, 200];
  let targetAccent = [155, 191, 201];
  let currentPrimary = [161, 211, 200];
  let currentAccent = [155, 191, 201];
  const paused = motionPref.matches;

  function applyThemeColors(color, accent) {
    targetPrimary = hexToArray(color);
    targetAccent = hexToArray(accent);
    root.style.setProperty("--era-color", color);
    root.style.setProperty("--era-accent", accent);
    root.style.setProperty("--era-rgb", targetPrimary.join(", "));
    root.style.setProperty("--era-accent-rgb", targetAccent.join(", "));
  }

  /* =========================================================
     1. PROJECT CARDS: COLORS, SPOTLIGHT & SCROLL BEAM
     ========================================================= */

  const cards = Array.from(document.querySelectorAll(".featured-project, .project-card"));
  const featuredSection = document.querySelector(".studio-section");
  const gridSection = document.querySelector(".studio-grid-section");
  const gridCards = Array.from(document.querySelectorAll(".project-card"));

  cards.forEach((card) => {
    const color = card.dataset.color || "#a1d3c8";
    const accent = card.dataset.accent || "#9bbfc9";
    card.style.setProperty("--card-color", color);
    card.style.setProperty("--card-accent", accent);

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mouse-x", `${x.toFixed(1)}%`);
      card.style.setProperty("--mouse-y", `${y.toFixed(1)}%`);
    });
  });

  function updateScrollBeam() {
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
    root.style.setProperty("--scroll-progress", progress.toFixed(4));
  }

  window.addEventListener("scroll", updateScrollBeam, { passive: true });
  updateScrollBeam();

  /* =========================================================
     2. MARKETRESEARCHER SCREENSHOT SWITCHER
     ========================================================= */

  document.querySelectorAll(".media-switcher").forEach((switcher) => {
    const tabs = Array.from(switcher.querySelectorAll(".media-tab"));
    const img = switcher.querySelector(".media-box img");
    const expandBtn = switcher.querySelector(".expand-btn");
    if (!tabs.length || !img) return;

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
          if (expandBtn) {
            expandBtn.dataset.mediaSrc = src;
            expandBtn.dataset.mediaCaption = cap;
          }
        }
      });
    });
  });

  /* =========================================================
     3. CATEGORY FILTER TABS & SCULPTURE MORPH SYNC
     ========================================================= */

  const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
  const resultsTitle = document.getElementById("project-results-title");
  const filterThemes = {
    all: { colors: ["#a1d3c8", "#9bbfc9"], mode: 0 },
    ai: { colors: ["#a1d3c8", "#a1d3c8"], mode: 1 },
    games: { colors: ["#c1abc9", "#c7aa8b"], mode: 2 },
    web: { colors: ["#9bbfc9", "#b3a0c6"], mode: 3 }
  };

  let targetMode = 0;
  const shockwaves = [];

  function triggerPulse() {
    shockwaves.push({ radius: 0.15, alpha: 0.95 });
  }

  function applyFilter(filter) {
    filterButtons.forEach((btn) => {
      const active = btn.dataset.filter === filter;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    cards.forEach((card) => {
      const match = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !match);
    });

    if (featuredSection) {
      const featuredCards = Array.from(featuredSection.querySelectorAll(".featured-project"));
      featuredSection.hidden = featuredCards.every((c) => c.classList.contains("is-hidden"));
    }

    if (gridSection) {
      gridSection.hidden = gridCards.every((c) => c.classList.contains("is-hidden"));
    }

    const theme = filterThemes[filter] || filterThemes.all;
    applyThemeColors(theme.colors[0], theme.colors[1]);
    targetMode = theme.mode;
    triggerPulse();

    document.querySelectorAll(".studio-video").forEach((video) => {
      const parentCard = video.closest(".featured-project, .project-card");
      if (parentCard?.classList.contains("is-hidden")) {
        video.pause();
      } else if (!paused) {
        const rect = video.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          video.play().catch(() => {});
        }
      }
    });
  }

  function revealFirstProject() {
    const firstProject = cards.find((card) => !card.classList.contains("is-hidden"));
    if (!firstProject) return;

    const media = firstProject.querySelector(".media-box") || firstProject;
    const viewportHeight = window.innerHeight;
    const { top, height } = media.getBoundingClientRect();
    const previewBottom = top + Math.min(height, viewportHeight * 0.3, 200);
    const distance = Math.ceil(previewBottom + 16 - viewportHeight);

    if (distance > 0) {
      window.scrollBy({ top: distance, behavior: motionPref.matches ? "auto" : "smooth" });
    }
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      applyFilter(btn.dataset.filter || "all");
      const title = btn.textContent.trim();
      if (resultsTitle.textContent !== title) resultsTitle.textContent = title;
      revealFirstProject();
    });
  });

  /* =========================================================
     4. LAZY VIDEO PLAYBACK ON SCROLL
     ========================================================= */

  const studioVideos = Array.from(document.querySelectorAll(".studio-video"));
  if (studioVideos.length) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          const parentCard = video.closest(".featured-project, .project-card");
          if (entry.isIntersecting && !paused && !parentCard?.classList.contains("is-hidden")) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.2 }
    );
    studioVideos.forEach((video) => videoObserver.observe(video));
  }

  /* =========================================================
     5. CINEMA MEDIA LIGHTBOX MODAL (VIDEO & IMAGE)
     ========================================================= */

  const lightbox = document.getElementById("media-lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxVideo = document.getElementById("lightbox-video");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxClose = document.getElementById("lightbox-close");
  const lightboxBackdrop = document.getElementById("lightbox-backdrop");
  let lastTrigger = null;

  function openLightbox(trigger) {
    if (!lightbox || !lightboxImg || !lightboxVideo || !lightboxCaption) return;
    const type = trigger.dataset.mediaType || "image";
    const src = trigger.dataset.mediaSrc || "";
    const cap = trigger.dataset.mediaCaption || "";
    lastTrigger = trigger;

    if (type === "video") {
      lightboxImg.hidden = true;
      lightboxImg.src = "";
      lightboxVideo.hidden = false;
      lightboxVideo.src = src;
      lightboxVideo.play().catch(() => {});
    } else {
      lightboxVideo.pause();
      lightboxVideo.hidden = true;
      lightboxVideo.removeAttribute("src");
      lightboxImg.hidden = false;
      lightboxImg.src = src;
      lightboxImg.alt = cap;
    }

    lightboxCaption.textContent = cap;
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    lightboxClose?.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    lightboxVideo?.pause();
    lightboxVideo?.removeAttribute("src");
    lightboxVideo?.load();
    if (lightboxImg) lightboxImg.src = "";
    lastTrigger?.focus();
    lastTrigger = null;
  }

  document.querySelectorAll(".expand-btn").forEach((btn) => {
    btn.addEventListener("click", () => openLightbox(btn));
  });
  lightboxClose?.addEventListener("click", closeLightbox);
  lightboxBackdrop?.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });

  /* =========================================================
     6. ZERO-TEXT INTERACTIVE 3D PROJECT SCULPTURE (#hero-canvas)
     (Geodesic Engine Core + Dual Neural Rings + Tunnel Frames)
     ========================================================= */

  const heroCanvas = document.getElementById("hero-canvas");
  const heroCtx = heroCanvas?.getContext("2d");
  let scWidth = 0;
  let scHeight = 0;
  let yaw = 0.4;
  let pitch = 0.28;
  let velYaw = 0;
  let velPitch = 0;
  let seconds = 0;
  let pointerNormX = 0;
  let pointerNormY = 0;
  let pointerInside = false;
  let drag = null;
  let heroInView = true;

  // Build 12-vertex regular icosahedron core
  const phi = (1 + Math.sqrt(5)) / 2;
  const rawVerts = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ];
  const coreVerts = rawVerts.map(([x, y, z]) => {
    const len = Math.hypot(x, y, z);
    return [x / len, y / len, z / len];
  });
  const coreEdges = [];
  for (let i = 0; i < coreVerts.length; i += 1) {
    for (let j = i + 1; j < coreVerts.length; j += 1) {
      const d = Math.hypot(
        coreVerts[i][0] - coreVerts[j][0],
        coreVerts[i][1] - coreVerts[j][1],
        coreVerts[i][2] - coreVerts[j][2]
      );
      if (d < 1.2) coreEdges.push([i, j]);
    }
  }

  // Build dual neural/data orbital rings (18 nodes each) + cross fibers
  const RING_NODES = 18;
  const dataPulses = Array.from({ length: 12 }, (_, idx) => ({
    fiber: idx % RING_NODES,
    progress: (idx * 0.17) % 1,
    speed: 0.35 + (idx % 3) * 0.14
  }));

  function project3D(x, y, z, cosY, sinY, cosP, sinP, cx, cy, scale) {
    const x1 = x * cosY + z * sinY;
    const z1 = z * cosY - x * sinY;
    const y2 = y * cosP - z1 * sinP;
    const z2 = z1 * cosP + y * sinP;
    const persp = 3.8 / (3.8 - z2);
    return {
      x: cx + x1 * scale * persp,
      y: cy + y2 * scale * persp,
      z: z2,
      p: persp
    };
  }

  let modeBlend = [1, 0, 0, 0];

  function drawSculpture(dt) {
    if (!heroCtx || !scWidth || !scHeight) return;
    heroCtx.clearRect(0, 0, scWidth, scHeight);

    // Smoothly blend active sculpture mode
    for (let m = 0; m < 4; m += 1) {
      const target = m === targetMode ? 1 : 0;
      modeBlend[m] += (target - modeBlend[m]) * Math.min(1, dt * 4);
    }

    const [r1, g1, b1] = currentPrimary;
    const [r2, g2, b2] = currentAccent;
    const primRgb = `${Math.round(r1)}, ${Math.round(g1)}, ${Math.round(b1)}`;
    const accRgb = `${Math.round(r2)}, ${Math.round(g2)}, ${Math.round(b2)}`;

    const hoverTiltX = pointerInside ? pointerNormX * 0.25 : 0;
    const hoverTiltY = pointerInside ? pointerNormY * 0.25 : 0;

    const totalYaw = yaw + (paused ? 0 : seconds * 0.32) + hoverTiltX;
    const totalPitch = pitch + Math.sin(seconds * 0.45) * 0.12 + hoverTiltY;

    const cosY = Math.cos(totalYaw);
    const sinY = Math.sin(totalYaw);
    const cosP = Math.cos(totalPitch);
    const sinP = Math.sin(totalPitch);

    const cx = scWidth * 0.5;
    const cy = scHeight * 0.5;
    const scale = Math.min(scWidth, scHeight) * 0.31;

    // 1. Tunnel Ball Perspective Octagonal Frames trailing in 3D space
    const tunnelCount = 5;
    const tunnelStretch = 0.75 + modeBlend[2] * 0.85;
    for (let t = 0; t < tunnelCount; t += 1) {
      const cycle = ((t / tunnelCount) + (paused ? 0 : seconds * 0.14)) % 1;
      const zOffset = (cycle - 0.5) * 2.1 * tunnelStretch;
      const ringRadius = 0.65 + (1 - cycle) * 0.95;
      const twist = seconds * 0.25 + t * 0.25;
      const sides = 8;

      heroCtx.beginPath();
      for (let s = 0; s <= sides; s += 1) {
        const ang = (s / sides) * Math.PI * 2 + twist;
        const rx = Math.cos(ang) * ringRadius;
        const ry = Math.sin(ang) * ringRadius;
        const pt = project3D(rx, ry, zOffset, cosY, sinY, cosP, sinP, cx, cy, scale);
        if (s === 0) heroCtx.moveTo(pt.x, pt.y);
        else heroCtx.lineTo(pt.x, pt.y);
      }
      const alpha = Math.sin(cycle * Math.PI) * (0.14 + modeBlend[2] * 0.16);
      heroCtx.strokeStyle = `rgba(${accRgb}, ${alpha.toFixed(3)})`;
      heroCtx.lineWidth = 1;
      heroCtx.stroke();
    }

    // 2. Dual Interconnected Neural/Data Orbital Rings + Cross Fibers
    const ringRadiusA = 1.12 + modeBlend[1] * 0.16;
    const ringRadiusB = 0.96 + modeBlend[3] * 0.2;
    const ptsA = [];
    const ptsB = [];

    for (let i = 0; i < RING_NODES; i += 1) {
      const a = (i / RING_NODES) * Math.PI * 2 + seconds * 0.22;
      const waveA = Math.sin(a * 3 + seconds * 1.4) * 0.12;
      const xA = Math.cos(a) * ringRadiusA;
      const yA = Math.sin(a) * ringRadiusA * 0.45 + waveA;
      const zA = Math.sin(a) * ringRadiusA * 0.88;
      ptsA.push(project3D(xA, yA, zA, cosY, sinY, cosP, sinP, cx, cy, scale));

      const b = -(i / RING_NODES) * Math.PI * 2 - seconds * 0.18;
      const waveB = Math.cos(b * 3 - seconds * 1.2) * 0.12;
      const xB = Math.cos(b) * ringRadiusB * 0.85;
      const yB = Math.sin(b) * ringRadiusB + waveB;
      const zB = Math.cos(b) * ringRadiusB * 0.52;
      ptsB.push(project3D(xB, yB, zB, cosY, sinY, cosP, sinP, cx, cy, scale));
    }

    // Draw orbital ring loops
    [ptsA, ptsB].forEach((pts, ringIdx) => {
      heroCtx.beginPath();
      pts.forEach((pt, idx) => {
        if (idx === 0) heroCtx.moveTo(pt.x, pt.y);
        else heroCtx.lineTo(pt.x, pt.y);
      });
      heroCtx.closePath();
      heroCtx.strokeStyle = ringIdx === 0 ? `rgba(${primRgb}, 0.28)` : `rgba(${accRgb}, 0.24)`;
      heroCtx.lineWidth = 1.1;
      heroCtx.stroke();
    });

    // Cross-layer neural retrieval fibers + traveling data packets
    for (let i = 0; i < RING_NODES; i += 1) {
      const pA = ptsA[i];
      const pB = ptsB[(i * 5) % RING_NODES];
      heroCtx.beginPath();
      heroCtx.moveTo(pA.x, pA.y);
      heroCtx.lineTo(pB.x, pB.y);
      heroCtx.strokeStyle = `rgba(${primRgb}, ${(0.08 + modeBlend[1] * 0.12).toFixed(3)})`;
      heroCtx.lineWidth = 0.75;
      heroCtx.stroke();
    }

    dataPulses.forEach((pulse) => {
      if (!paused) pulse.progress = (pulse.progress + dt * pulse.speed) % 1;
      const pA = ptsA[pulse.fiber];
      const pB = ptsB[(pulse.fiber * 5) % RING_NODES];
      const px = pA.x + (pB.x - pA.x) * pulse.progress;
      const py = pA.y + (pB.y - pA.y) * pulse.progress;

      heroCtx.beginPath();
      heroCtx.arc(px, py, 2.2, 0, Math.PI * 2);
      heroCtx.fillStyle = `rgb(${primRgb})`;
      heroCtx.shadowBlur = 10;
      heroCtx.shadowColor = `rgb(${primRgb})`;
      heroCtx.fill();
      heroCtx.shadowBlur = 0;
    });

    // Orbital ring nodes
    ptsA.concat(ptsB).forEach((pt, idx) => {
      const isA = idx < RING_NODES;
      heroCtx.beginPath();
      heroCtx.arc(pt.x, pt.y, 2.1 * pt.p, 0, Math.PI * 2);
      heroCtx.fillStyle = isA ? `rgba(${primRgb}, 0.78)` : `rgba(${accRgb}, 0.72)`;
      heroCtx.fill();
    });

    // 3. Inner Rotating Geodesic Icosahedron Core
    const coreRadius = 0.56 + Math.sin(seconds * 1.3) * 0.03 + modeBlend[0] * 0.08;
    const projectedCore = coreVerts.map(([vx, vy, vz]) => {
      // Counter-rotate core relative to outer rings for rich 3D depth
      const cSpin = seconds * 0.42;
      const rx = vx * Math.cos(cSpin) + vz * Math.sin(cSpin);
      const rz = vz * Math.cos(cSpin) - vx * Math.sin(cSpin);
      return project3D(
        rx * coreRadius,
        vy * coreRadius,
        rz * coreRadius,
        cosY,
        sinY,
        cosP,
        sinP,
        cx,
        cy,
        scale
      );
    });

    coreEdges.forEach(([i, j]) => {
      const a = projectedCore[i];
      const b = projectedCore[j];
      const depthAlpha = Math.max(0.18, Math.min(0.85, 0.48 + (a.z + b.z) * 0.28));
      heroCtx.beginPath();
      heroCtx.moveTo(a.x, a.y);
      heroCtx.lineTo(b.x, b.y);
      heroCtx.strokeStyle = `rgba(${primRgb}, ${depthAlpha.toFixed(3)})`;
      heroCtx.lineWidth = 1.45;
      heroCtx.stroke();
    });

    projectedCore.forEach((pt) => {
      heroCtx.beginPath();
      heroCtx.arc(pt.x, pt.y, 2.8 * pt.p, 0, Math.PI * 2);
      heroCtx.fillStyle = "#e6fbff";
      heroCtx.shadowBlur = 12;
      heroCtx.shadowColor = `rgb(${primRgb})`;
      heroCtx.fill();
      heroCtx.shadowBlur = 0;
    });

    // 4. Expanding 3D Click Shockwave Pulses
    for (let s = shockwaves.length - 1; s >= 0; s -= 1) {
      const sw = shockwaves[s];
      sw.radius += dt * 1.9;
      sw.alpha -= dt * 1.25;
      if (sw.alpha <= 0) {
        shockwaves.splice(s, 1);
        continue;
      }
      heroCtx.beginPath();
      const segs = 28;
      for (let k = 0; k <= segs; k += 1) {
        const ang = (k / segs) * Math.PI * 2;
        const pt = project3D(
          Math.cos(ang) * sw.radius,
          Math.sin(ang) * sw.radius * 0.65,
          Math.sin(ang) * sw.radius * 0.45,
          cosY,
          sinY,
          cosP,
          sinP,
          cx,
          cy,
          scale
        );
        if (k === 0) heroCtx.moveTo(pt.x, pt.y);
        else heroCtx.lineTo(pt.x, pt.y);
      }
      heroCtx.strokeStyle = `rgba(${primRgb}, ${sw.alpha.toFixed(3)})`;
      heroCtx.lineWidth = 1.8;
      heroCtx.stroke();
    }
  }

  if (heroCanvas && heroCtx) {
    const resizeSculpture = () => {
      const rect = heroCanvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      scWidth = rect.width;
      scHeight = rect.height;
      heroCanvas.width = Math.round(scWidth * dpr);
      heroCanvas.height = Math.round(scHeight * dpr);
      heroCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    heroCanvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      drag = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        moved: false
      };
      heroCanvas.setPointerCapture(event.pointerId);
    });

    heroCanvas.addEventListener("pointermove", (event) => {
      const rect = heroCanvas.getBoundingClientRect();
      pointerNormX = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      pointerNormY = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;
      pointerInside = true;

      if (drag && drag.id === event.pointerId) {
        const dx = event.clientX - drag.lastX;
        const dy = event.clientY - drag.lastY;
        if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 5) {
          drag.moved = true;
        }
        velYaw = dx * 0.012;
        velPitch = dy * 0.012;
        yaw += velYaw;
        pitch = Math.max(-1.2, Math.min(1.2, pitch + velPitch));
        drag.lastX = event.clientX;
        drag.lastY = event.clientY;
      }
    });

    heroCanvas.addEventListener("pointerup", (event) => {
      if (drag && drag.id === event.pointerId && !drag.moved) {
        targetMode = (targetMode + 1) % 4;
        triggerPulse();
      }
      drag = null;
    });

    heroCanvas.addEventListener("lostpointercapture", () => {
      drag = null;
    });

    heroCanvas.addEventListener("pointerleave", () => {
      pointerInside = false;
    });

    new ResizeObserver(resizeSculpture).observe(heroCanvas);
    new IntersectionObserver(([entry]) => {
      heroInView = entry.isIntersecting;
    }).observe(heroCanvas);
    resizeSculpture();
  }

  /* =========================================================
     7. AMBIENT BACKGROUND PARTICLE CONSTELLATION
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
     8. UNIFIED ANIMATION LOOP
     ========================================================= */

  let prevTime = null;
  function tick(now) {
    const dt = prevTime === null ? 0.016 : Math.min(0.05, (now - prevTime) / 1000);
    prevTime = now;

    const ease = Math.min(1, dt * 6);
    for (let i = 0; i < 3; i += 1) {
      currentPrimary[i] += (targetPrimary[i] - currentPrimary[i]) * ease;
      currentAccent[i] += (targetAccent[i] - currentAccent[i]) * ease;
    }

    if (!drag) {
      yaw += velYaw;
      pitch = Math.max(-1.2, Math.min(1.2, pitch + velPitch));
      velYaw *= 0.94;
      velPitch *= 0.94;
    }

    if (!paused) {
      seconds += dt;
    }

    if (heroInView && !document.hidden) {
      drawSculpture(dt);
    }
    if (!document.hidden) {
      drawBackground();
    }
    window.requestAnimationFrame(tick);
  }

  window.requestAnimationFrame(tick);
})();
