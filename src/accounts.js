const escape = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const avatars = { robot: "🤖", otter: "🦦", rocket: "🚀", fox: "🦊" };
const fresh = () => ({
  step: -1,
  speed: 500,
  color: "#d25f4d",
  completed: [],
  found: [],
});
export function initAccounts({ onProfile, onNotice = () => {}, lesson = "first-circuit" }) {
  let user = null,
    generation = 0,
    hydrating = false,
    syncBlocked = false,
    pending = null,
    timer = null,
    queue = Promise.resolve(),
    countdowns = new Map();
  const panel = document.querySelector("#family-panel"),
    button = document.querySelector("#account-button"),
    saveState = document.querySelector(".save-state");
  const storage = () => `little-spark-profile-${user?.id}${lesson === "first-circuit" ? "" : "-" + lesson}`;
  const status = (text) => {
    saveState.innerHTML = "<span></span>" + escape(text);
  };
  async function api(action, data) {
    const response = await fetch("/api/family?action=" + action + "&lesson=" + encodeURIComponent(lesson), {
      method: data === undefined ? "GET" : "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: data === undefined ? {} : { "Content-Type": "application/json" },
      body:
        data === undefined
          ? undefined
          : JSON.stringify({ ...data, profileId: user?.id }),
    });
    const result = await response.json();
    if (!response.ok) {
      const error = Error(result.error || "Could not complete the request.");
      error.status = response.status;
      error.code = result.code;
      if (result.code === "SESSION_CHANGED")
        blockSync("Profile changed", error.message);
      throw error;
    }
    return result;
  }
  function message(text) {
    document.querySelector("#family-message").textContent = text;
  }
  function blockSync(label, detail) {
    if (syncBlocked) return;
    syncBlocked = true;
    pending = null;
    clearTimeout(timer);
    status(label);
    const reload = document.createElement("button");
    reload.textContent = "Reload";
    reload.className = "sync-reload";
    reload.title = detail;
    reload.onclick = () => location.reload();
    const notice = document.createElement("aside");
    notice.className = "sync-notice";
    notice.setAttribute("role", "alert");
    const text = document.createElement("span");
    text.textContent = detail;
    notice.append(text, reload);
    document.body.append(notice);
  }
  async function load() {
    try {
      const result = await api("me");
      user = result.user;
      if (!user) {
        location.replace("/signin/");
        return;
      }
      button.textContent =
        user?.role === "parent" ? "Family" : user?.name || "Sign in";
      if (user?.role === "kid") {
        generation = result.progress?.generation || 0;
        hydrating = true;
        let progress = result.progress?.state || fresh();
        try {
          const local = JSON.parse(localStorage.getItem(storage()));
          const localGeneration = Number(
            localStorage.getItem(storage() + "-generation") || 0,
          );
          if (local && localGeneration === generation) {
            progress = {
              ...progress,
              ...local,
              completed: [
                ...new Set([
                  ...(progress.completed || []),
                  ...(local.completed || []),
                ]),
              ],
              found: [
                ...new Set([...(progress.found || []), ...(local.found || [])]),
              ],
            };
          }
        } catch {}
        onProfile(user, progress);
        hydrating = false;
        controller.saveProgress(progress);
      } else {
        onProfile(user, null);
        status("Practice saved on this device");
      }
      if (panel.open) render(result.kids || []);
    } catch {
      status("Practice saved on this device");
      button.textContent = "Sign in";
    }
  }
  function render(kids = []) {
    for (const timer of countdowns.values()) clearInterval(timer);
    countdowns.clear();
    panel.innerHTML =
      '<button class="dialog-close" id="family-close" aria-label="Close accounts">×</button><div id="family-content"></div><p id="family-message" role="status"></p>';
    document.querySelector("#family-close").onclick = () => panel.close();
    const content = document.querySelector("#family-content");
    if (!user) {
      content.innerHTML =
        '<div class="eyebrow">PARENT SIGN-IN</div><h2>Save your family’s progress</h2><p>Sign in by email to create child profiles, track lessons, and generate temporary kid links.</p><form id="parent-signin"><label for="parent-email">Your email</label><input id="parent-email" type="email" autocomplete="email" required maxlength="254"><button class="button primary" type="submit">Email me a sign-in link</button></form><p class="small-print">The email link works once and expires in five minutes. Kids don’t need an email address.</p>';
      document.querySelector("#parent-signin").onsubmit = async (e) => {
        e.preventDefault();
        const submit = e.target.querySelector("button");
        submit.disabled = true;
        try {
          const r = await api("request-parent-link", {
            email: document.querySelector("#parent-email").value,
          });
          message(r.message);
        } catch (error) {
          message(error.message);
        } finally {
          submit.disabled = false;
        }
      };
      return;
    }
    if (user.role === "kid") {
      content.innerHTML = `<div class="eyebrow">LEARNER PROFILE</div><h2>${avatars[user.avatar] || "🤖"} ${escape(user.name)}</h2><p>Your progress is saved to your profile and can follow you to another device.</p><button id="family-signout" class="button secondary">Sign out</button>`;
      document.querySelector("#family-signout").onclick = logout;
      return;
    }
    const grouped = [...new Map(kids.map((k) => [k.id, k])).values()];
    const lessons = [["first-circuit", "Blink an LED"], ["fruit-piano", "Fruit Piano"]];
    const rowsFor = (kid) => lessons.map(([id, name]) => {
      const row = kids.find((k) => k.id === kid.id && k.lesson_id === id);
      const complete = row?.state?.completed?.length || 0;
      return {name, complete, updated: row?.updated_at};
    });
    content.innerHTML = `<div class="eyebrow">PARENT DASHBOARD</div><h2>Your family</h2><p class="family-email">${escape(user.email)}</p><div class="kid-list">${grouped
      .map((k) => {
        const rows = rowsFor(k);
        const complete = rows.reduce((sum, row) => sum + row.complete, 0);
        return `<section class="kid-card"><div class="kid-heading"><span>${avatars[k.avatar] || "🤖"}</span><strong>${escape(k.name)}</strong><span class="kid-percent">${Math.round((complete / 14) * 100)}%</span></div><div class="kid-progress"><i style="width:${Math.min(100, (complete / 14) * 100)}%"></i></div>${rows.map((row) => `<p>${row.complete} of 7 steps · ${row.name}</p><p class="kid-updated">${row.updated ? "Last saved " + new Date(row.updated).toLocaleString() : "Not started"}</p>`).join("")}<button class="button secondary" data-kid-link="${k.id}">Make a 5-minute login link</button><details class="kid-edit"><summary>Edit profile</summary><form data-edit-child="${k.id}"><label>Nickname<input name="name" value="${escape(k.name)}" maxlength="32" required></label><label>Icon<select name="avatar">${Object.entries(
          avatars,
        )
          .map(
            ([v, icon]) =>
              `<option value="${v}" ${v === k.avatar ? "selected" : ""}>${icon} ${v}</option>`,
          )
          .join(
            "",
          )}</select></label><button type="submit" class="button secondary">Save profile</button></form><button class="revoke-kid" data-revoke-child="${k.id}">Sign out this child’s devices</button></details><div id="kid-link-${k.id}" class="kid-link-result" hidden></div></section>`;
      })
      .join(
        "",
      )}</div><details class="add-child" ${grouped.length === 0 ? "open" : ""}><summary>Add a child</summary><form id="add-child"><label>Nickname<input name="name" maxlength="32" autocomplete="off" required placeholder="e.g. Alex"></label><label>Icon<select name="avatar">${Object.entries(
      avatars,
    )
      .map(([v, icon]) => `<option value="${v}">${icon} ${v}</option>`)
      .join(
        "",
      )}</select></label><button class="button primary" type="submit">Create child profile</button></form></details><button id="family-signout" class="family-signout">Sign out</button>`;
    document.querySelector("#family-signout").onclick = logout;
    document.querySelector("#add-child").onsubmit = async (e) => {
      e.preventDefault();
      const data = new FormData(e.target);
      try {
        await api("add-child", {
          name: data.get("name"),
          avatar: data.get("avatar"),
        });
        await refresh();
      } catch (error) {
        message(error.message);
      }
    };
    panel.querySelectorAll("[data-edit-child]").forEach(
      (form) =>
        (form.onsubmit = async (e) => {
          e.preventDefault();
          const data = new FormData(form);
          try {
            await api("update-child", {
              id: form.dataset.editChild,
              name: data.get("name"),
              avatar: data.get("avatar"),
            });
            await refresh();
          } catch (error) {
            message(error.message);
          }
        }),
    );
    panel.querySelectorAll("[data-revoke-child]").forEach(
      (b) =>
        (b.onclick = async () => {
          try {
            await api("revoke-child", { id: b.dataset.revokeChild });
            message(
              "Child devices signed out. Existing login links were revoked.",
            );
          } catch (error) {
            message(error.message);
          }
        }),
    );
    panel.querySelectorAll("[data-kid-link]").forEach(
      (b) =>
        (b.onclick = async () => {
          b.disabled = true;
          try {
            const r = await api("kid-link", { id: b.dataset.kidLink });
            const box = document.querySelector(
              "#kid-link-" + b.dataset.kidLink,
            );
            box.hidden = false;
            box.innerHTML = `<label>Child login link<input readonly value="${escape(r.url)}"></label><button class="button secondary copy-kid-link">Copy link</button><div class="kid-qr"></div><p class="link-expiry"></p><p class="small-print">One use. A new link replaces the previous one. Open it on your child’s device; opening it here switches this browser to their profile.</p>`;
            box.querySelector(".copy-kid-link").onclick = async () => {
              try {
                await navigator.clipboard.writeText(r.url);
                message("Login link copied.");
              } catch {
                box.querySelector("input").select();
                message("Select and copy the link.");
              }
            };
            const expiry = box.querySelector(".link-expiry");
            const tick = () => {
              let seconds = Math.max(
                0,
                Math.ceil((new Date(r.expiresAt) - Date.now()) / 1000),
              );
              expiry.textContent = seconds
                ? `Expires in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
                : "Expired. Generate a new link.";
            };
            tick();
            clearInterval(countdowns.get(b.dataset.kidLink));
            countdowns.set(b.dataset.kidLink, setInterval(tick, 1000));
            const QR = await import("qrcode");
            const img = new Image();
            img.alt = "QR code for the temporary child login link";
            img.src = await (QR.default || QR).toDataURL(r.url, {
              width: 180,
              margin: 1,
              color: { dark: "#263f39", light: "#faf9f2" },
            });
            box.querySelector(".kid-qr").append(img);
          } catch (error) {
            message(error.message);
          } finally {
            b.disabled = false;
          }
        }),
    );
  }
  async function refresh() {
    const result = await api("me");
    if (
      (user && user.id !== result.user?.id) ||
      (!user && result.user?.role === "kid")
    ) {
      const detail = "The signed-in profile changed. Reload before continuing.";
      blockSync("Profile changed", detail);
      throw Error(detail);
    }
    user = result.user;
    render(result.kids || []);
  }
  async function logout() {
    await api("logout", {});
    location.assign("/signin/");
  }
  button.onclick = async () => {
    try {
      await refresh();
    } catch {
      render();
    }
    if (!panel.open) panel.show();
  };
  function flush() {
    if (!pending || !user || user.role !== "kid" || hydrating || syncBlocked)
      return;
    const current = pending;
    pending = null;
    const kidId = user.id;
    queue = queue
      .catch(() => {})
      .then(async () => {
        if (user?.id !== kidId || syncBlocked) return;
        try {
          const result = await api("save-progress", {
            state: current.state,
            generation,
            reset: current.reset,
          });
          generation = result.progress.generation;
          localStorage.setItem(storage() + "-generation", String(generation));
          status("Progress synced");
        } catch (error) {
          if (
            error.status === 401 ||
            error.code === "SESSION_CHANGED" ||
            error.code === "PROGRESS_RESET"
          ) {
            blockSync(
              error.status === 401
                ? "Sign in again"
                : error.code === "PROGRESS_RESET"
                  ? "Progress reset elsewhere"
                  : "Profile changed",
              error.message,
            );
            return;
          }
          pending ??= current;
          status("Saved here · sync pending");
          onNotice(error.message);
        }
      });
  }
  const controller = {
    saveProgress(state) {
      if (hydrating || syncBlocked || user?.role !== "kid") return;
      pending = {
        state: structuredClone(state),
        reset: pending?.reset || false,
      };
      status("Saving…");
      clearTimeout(timer);
      timer = setTimeout(flush, 650);
    },
    resetProgress(state) {
      if (syncBlocked || user?.role !== "kid") return;
      clearTimeout(timer);
      pending = { state: structuredClone(state), reset: true };
      flush();
    },
    getUser: () => user,
    async navigate(url) {
      clearTimeout(timer);
      flush();
      await queue;
      location.assign(url);
    },
  };
  document.querySelectorAll("[data-lesson-link]").forEach((link) => link.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    controller.navigate(link.href);
  }));
  window.addEventListener("online", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flush();
  });
  queueMicrotask(async () => {
    await load();
    if (new URLSearchParams(location.search).get("signin") === "1") {
      history.replaceState(null, "", "/learn/");
      button.click();
    }
  });
  return controller;
}
