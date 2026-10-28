export const LAYOUTS = ["split", "build", "code", "guided"];
export function initWorkspaceLayout() {
  const container = document.querySelector("#learning-layout");
  const instructions = container.querySelector(".instruction-card");
  instructions?.setAttribute("tabindex", "0");
  instructions?.setAttribute("aria-label", "Lesson instructions");
  function fitGuided() {
    if (container.dataset.layout !== "guided" || window.innerWidth <= 1100) return;
    const workspace = container.querySelector(".workspace");
    const top = Math.max(16, workspace.getBoundingClientRect().top);
    const height = Math.max(300, Math.min(900, window.innerHeight - top - 80));
    container.style.setProperty("--guided-pane-height", `${height}px`);
  }
  window.addEventListener("resize", fitGuided);
  let saved = "split";
  try {
    saved = localStorage.getItem("little-spark-layout") || saved;
  } catch {}
  function apply(layout) {
    if (!LAYOUTS.includes(layout)) layout = "split";
    container.dataset.layout = layout;
    instructions?.scrollTo({top:0,behavior:"instant"});
    document
      .querySelectorAll("#layout-controls [data-layout]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.layout === layout),
        ),
      );
    try {
      localStorage.setItem("little-spark-layout", layout);
    } catch {}
    window.dispatchEvent(new Event("resize"));
    requestAnimationFrame(fitGuided);
  }
  document
    .querySelectorAll("#layout-controls [data-layout]")
    .forEach((button) =>
      button.addEventListener("click", () => apply(button.dataset.layout)),
    );
  apply(saved);
}
