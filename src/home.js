const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const parallaxItems = [...document.querySelectorAll("[data-parallax]")];
let framePending = false;
function updateParallax() {
  framePending = false;
  for (const item of parallaxItems) {
    const rect = item.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const amount = Math.max(
      -65,
      Math.min(65, (innerHeight / 2 - center) * Number(item.dataset.parallax)),
    );
    item.style.setProperty(
      "--parallax-y",
      reducedMotion.matches || innerWidth < 761 ? "0px" : amount + "px",
    );
  }
}
function scheduleParallax() {
  if (!framePending) {
    framePending = true;
    requestAnimationFrame(updateParallax);
  }
}
addEventListener("scroll", scheduleParallax, { passive: true });
addEventListener("resize", scheduleParallax);
reducedMotion.addEventListener("change", scheduleParallax);
scheduleParallax();
const stage = document.querySelector(".story-stage");
const captions = [
  "01 / MEET YOUR BOARD",
  "02 / FOLLOW THE CONNECTIONS",
  "03 / TEST BEFORE YOU CONNECT",
];
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const index = Number(entry.target.dataset.storyStep);
      stage.dataset.active = String(index);
      stage.querySelector(".stage-caption").textContent = captions[index];
    }
  },
  { rootMargin: "-30% 0px -25% 0px", threshold: 0 },
);
document
  .querySelectorAll("[data-story-step]")
  .forEach((item) => observer.observe(item));
document.querySelectorAll("[data-delay]").forEach((button) => {
  button.addEventListener("click", () => {
    const delay = Number(button.dataset.delay);
    document
      .querySelectorAll("[data-delay]")
      .forEach((other) =>
        other.setAttribute("aria-pressed", String(other === button)),
      );
    document
      .querySelectorAll(".delay-value")
      .forEach((value) => (value.textContent = String(delay)));
    document
      .querySelector(".code-demo")
      .style.setProperty("--blink-duration", delay * 2 + "ms");
    document.querySelector(".demo-status").textContent =
      `${delay} ms on. ${delay} ms off.`;
  });
});
fetch("/api/family?action=me", {
  credentials: "same-origin",
  cache: "no-store",
})
  .then((response) => (response.ok ? response.json() : null))
  .then((result) => {
    if (!result?.user) return;
    document.querySelector("#home-signin").textContent =
      result.user.role === "parent" ? "Family" : "Your profile";
  })
  .catch(() => {});
