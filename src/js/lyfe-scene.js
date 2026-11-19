/* Lightweight editorial page behavior: scroll beam, lazy video, and lightbox */
(function () {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initScrollProgress() {
    const root = document.documentElement;
    let ticking = false;

    function updateProgress() {
      ticking = false;
      const doc = document.documentElement;
      const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
      const ratio = Math.min(1, Math.max(0, window.scrollY / scrollable));
      root.style.setProperty("--scroll-progress", ratio.toFixed(4));
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateProgress);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    updateProgress();
  }

  function initInlineVideo() {
    const videos = document.querySelectorAll(".studio-video");
    if (!videos.length) return;

    if (reducedMotion) {
      videos.forEach((video) => {
        video.removeAttribute("autoplay");
        video.pause();
      });
      return;
    }

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            const p = video.play();
            if (p && typeof p.catch === "function") p.catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.2 }
    );

    videos.forEach((video) => observer.observe(video));
  }

  function initLightbox() {
    const lightbox = document.getElementById("media-lightbox");
    const backdrop = document.getElementById("lightbox-backdrop");
    const closeBtn = document.getElementById("lightbox-close");
    const imgEl = document.getElementById("lightbox-img");
    const videoEl = document.getElementById("lightbox-video");
    const captionEl = document.getElementById("lightbox-caption");

    if (!lightbox || !imgEl || !videoEl || !captionEl) return;

    let lastTrigger = null;

    function openLightbox(trigger) {
      const type = trigger.getAttribute("data-media-type") || "image";
      const src = trigger.getAttribute("data-media-src");
      const caption = trigger.getAttribute("data-media-caption") || "";
      if (!src) return;

      lastTrigger = trigger;
      captionEl.textContent = caption;

      if (type === "video") {
        imgEl.hidden = true;
        imgEl.removeAttribute("src");
        videoEl.hidden = false;
        videoEl.src = src;
        videoEl.currentTime = 0;
        const p = videoEl.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } else {
        videoEl.pause();
        videoEl.hidden = true;
        videoEl.removeAttribute("src");
        imgEl.hidden = false;
        imgEl.src = src;
        imgEl.alt = caption;
      }

      lightbox.hidden = false;
      document.body.classList.add("lightbox-open");
      if (closeBtn) closeBtn.focus();
    }

    function closeLightbox() {
      if (lightbox.hidden) return;
      lightbox.hidden = true;
      document.body.classList.remove("lightbox-open");

      videoEl.pause();
      videoEl.hidden = true;
      videoEl.removeAttribute("src");
      imgEl.hidden = true;
      imgEl.removeAttribute("src");

      if (lastTrigger && typeof lastTrigger.focus === "function") {
        lastTrigger.focus();
      }
      lastTrigger = null;
    }

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-media-src]");
      if (trigger) {
        event.preventDefault();
        openLightbox(trigger);
      }
    });

    if (backdrop) backdrop.addEventListener("click", closeLightbox);
    if (closeBtn) closeBtn.addEventListener("click", closeLightbox);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !lightbox.hidden) {
        closeLightbox();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initScrollProgress();
    initInlineVideo();
    initLightbox();
  });
})();
