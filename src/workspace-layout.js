export const LAYOUTS = ["split", "build", "code", "guided"];
export function initWorkspaceLayout() {
  const container = document.querySelector("#learning-layout");
  let saved = "split";
  try {
    saved = localStorage.getItem("little-spark-layout") || saved;
  } catch {}
  function apply(layout) {
    if (!LAYOUTS.includes(layout)) layout = "split";
    container.dataset.layout = layout;
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
  }
  document
    .querySelectorAll("#layout-controls [data-layout]")
    .forEach((button) =>
      button.addEventListener("click", () => apply(button.dataset.layout)),
    );
  apply(saved);
}
