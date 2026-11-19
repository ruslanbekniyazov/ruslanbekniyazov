/* An introduction and three direct entrances, with a small canvas sculpture. */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const motionButton = document.querySelector(".motion-control");
  let paused = reducedMotion.matches;
  let heroVisible = true;
  let drawOrbit = () => {};
  let syncOrbit = () => {};

  function setMotion(value) {
    paused = value;
    document.body.classList.toggle("motion-paused", paused);
    motionButton.setAttribute("aria-pressed", String(paused));
    motionButton.querySelector(".motion-label").textContent = paused ? "Play motion" : "Pause motion";
    motionButton.querySelector(".motion-symbol").textContent = paused ? "▷" : "Ⅱ";
    syncOrbit();
    if (paused) drawOrbit();
  }

  motionButton.hidden = false;
  motionButton.addEventListener("click", () => setMotion(!paused));
  reducedMotion.addEventListener("change", event => setMotion(event.matches));
  document.addEventListener("visibilitychange", () => {
    syncOrbit();
  });

  let scrollQueued = false;
  function updateScroll() {
    scrollQueued = false;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    document.documentElement.style.setProperty("--reading-progress", scrollable > 0 ? String(window.scrollY / scrollable) : "0");
  }
  function queueScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(updateScroll);
  }
  window.addEventListener("scroll", queueScroll, { passive: true });
  window.addEventListener("resize", queueScroll, { passive: true });
  updateScroll();
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      syncOrbit();
    }).observe(document.querySelector(".hero-stage"));
  }

  const canvas = document.querySelector("#orbit-canvas");
  const context = canvas.getContext("2d");
  if (!context) { setMotion(paused); return; }

  let width = 0;
  let height = 0;
  let frameId = 0;
  let lastFrame = 0;
  let phase = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let points = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = width < 450 ? 2700 : 5200;
    points = Array.from({ length: count }, (_, i) => {
      const u = (i / count) * Math.PI * 2;
      const v = i * 2.399963229728653;
      const radius = 1.48 + .47 * Math.cos(v);
      return { x: radius * Math.cos(u), y: radius * Math.sin(u), z: .47 * Math.sin(v), seed: i % 17 };
    });
    drawOrbit();
  }

  drawOrbit = () => {
    context.clearRect(0, 0, width, height);
    pointerX += (targetX - pointerX) * .035;
    pointerY += (targetY - pointerY) * .035;
    const rotateY = -.35 + Math.sin(phase * .6) * .3 + pointerX * .22;
    const rotateX = .95 + Math.cos(phase * .4) * .15 + pointerY * .2;
    const rotateZ = -.48 + phase * .12;
    const cy = Math.cos(rotateY), sy = Math.sin(rotateY);
    const cx = Math.cos(rotateX), sx = Math.sin(rotateX);
    const cz = Math.cos(rotateZ), sz = Math.sin(rotateZ);
    // The orbital trace extends beyond the torus's projected radius at every tilt.
    const traceRadius = 2.15;
    const edgePadding = 12;
    const scale = Math.max(0, Math.min(width, height) / 2 - edgePadding) / traceRadius;
    const centerX = width / 2;
    const centerY = height / 2;
    const projected = points.map(point => {
      const x1 = point.x * cy + point.z * sy;
      const z1 = -point.x * sy + point.z * cy;
      const y2 = point.y * cx - z1 * sx;
      const z2 = point.y * sx + z1 * cx;
      const x3 = x1 * cz - y2 * sz;
      const y3 = x1 * sz + y2 * cz;
      const perspective = 5.6 / (5.6 - z2);
      return { x: centerX + x3 * scale * perspective, y: centerY + y3 * scale * perspective, z: z2, seed: point.seed };
    }).sort((a, b) => a.z - b.z);
    projected.forEach(point => {
      const depth = (point.z + 2) / 4;
      const alpha = .12 + depth * .63;
      const size = .45 + depth * .8;
      context.fillStyle = point.seed < 3 ? `rgba(139, 211, 204, ${alpha})` : `rgba(194, 213, 216, ${alpha * .7})`;
      context.beginPath();
      context.arc(point.x, point.y, size, 0, Math.PI * 2);
      context.fill();
    });
    // A fine orbital trace gives the field structure without a texture asset.
    context.save();
    context.translate(centerX, centerY);
    context.rotate(-.45);
    context.strokeStyle = "rgba(155, 195, 194, .1)";
    context.lineWidth = .6;
    context.beginPath();
    context.ellipse(0, 0, scale * traceRadius, scale * 1.16, 0, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  };

  function tick(time) {
    frameId = 0;
    if (paused || document.hidden || !heroVisible) return;
    if (time - lastFrame >= 32) {
      phase += Math.min(time - (lastFrame || time), 70) * .0003;
      lastFrame = time;
      drawOrbit();
    }
    frameId = requestAnimationFrame(tick);
  }

  syncOrbit = () => {
    if (paused || document.hidden || !heroVisible) {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      lastFrame = 0;
    } else if (!frameId) {
      lastFrame = 0;
      frameId = requestAnimationFrame(tick);
    }
  };

  document.querySelector(".hero-stage").addEventListener("pointermove", event => {
    if (event.pointerType === "touch") return;
    const rect = canvas.getBoundingClientRect();
    targetX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    targetY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
  }, { passive: true });
  document.querySelector(".hero-stage").addEventListener("pointerleave", () => { targetX = 0; targetY = 0; });
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize, { passive: true });
  resize();
  setMotion(paused);
})();
