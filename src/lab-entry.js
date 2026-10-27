import "./style.css";
const app = document.querySelector("#app");
const loading = document.querySelector("#lab-loading");
addEventListener("pagehide", () => {
  app.hidden = true;
});
addEventListener("pageshow", (event) => {
  if (event.persisted) location.reload();
});
try {
  const response = await fetch("/api/family?action=me", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) throw Error("Could not check your sign-in.");
  const result = await response.json();
  if (!result.user) location.replace("/signin/");
  else {
    app.hidden = false;
    if (location.pathname.startsWith("/learn/makey-makey")) await import("./makey.js");
    else await import("./app.js");
    loading.remove();
  }
} catch {
  app.hidden = true;
  loading.textContent = "We could not open the lab. ";
  const retry = document.createElement("button");
  retry.className = "button quiet";
  retry.textContent = "Try again";
  retry.onclick = () => location.reload();
  const home = document.createElement("a");
  home.href = "/";
  home.textContent = "Back to Little Spark";
  loading.append(retry, home);
}
