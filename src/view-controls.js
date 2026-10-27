export const CAMERA_HELP = {
  rotate: "Drag to turn the view. Use the turn and tilt buttons, too.",
  pan: "Choose Move, then drag to slide the view. Shift-drag or right-drag also works.",
  zoom: "Scroll or pinch to get closer. The + and − buttons do the same thing.",
  touch: "One finger turns. Two fingers move and pinch to zoom.",
  keyboard:
    "Q/E turn · arrow up/down tilt · WASD move · +/− zoom · R reset · Esc back",
};
export function orbitView(view, dx, dy) {
  view.azimuth -= dx * 0.008;
  view.elevation = Math.max(0.18, Math.min(1.42, view.elevation + dy * 0.006));
}
export function panView(view, dx, dy, height) {
  const factor = view.scale / Math.max(1, height);
  const away = dy / Math.max(0.15, Math.sin(view.elevation));
  view.x -=
    factor * (dx * Math.cos(view.azimuth) + away * Math.sin(view.azimuth));
  view.z +=
    factor * (dx * Math.sin(view.azimuth) - away * Math.cos(view.azimuth));
}
export function zoomView(view, factor) {
  view.scale = Math.max(12, Math.min(320, view.scale * factor));
}
