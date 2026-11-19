/* Small shared enhancements. Navigation and content remain native HTML. */
(() => {
  "use strict";
  document.querySelectorAll("[data-year]").forEach(element => {
    element.textContent = new Date().getFullYear();
  });
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in-view");
      observer.unobserve(entry.target);
    });
  }, { threshold: .04 });
  document.querySelectorAll(".page-projects .featured-project, .page-projects .project-card, .page-lyfe .chapter-row").forEach(element => {
    element.classList.add("site-reveal");
    observer.observe(element);
  });
})();
