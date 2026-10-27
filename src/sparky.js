// Lesson-specific help. Suggestions only use the supported compiled rhythms.
export function suggestRhythm(current, goal) {
  if (![250, 500, 1000].includes(current)) return null;
  const choices = goal === "slower" ? [250, 500, 1000] : [1000, 500, 250];
  const index = choices.indexOf(current);
  return choices[Math.min(index + 1, choices.length - 1)];
}

export function initSparky({ getSpeed, changeSpeed, traffic = false }) {
  const root = document.querySelector("#sparky");
  const toggle = root.querySelector("#sparky-toggle");
  const panel = root.querySelector("#sparky-panel");
  const message = root.querySelector("#sparky-message");
  const preview = root.querySelector("#sparky-preview");
  const apply = root.querySelector("#sparky-apply");
  const undo = root.querySelector("#sparky-undo");
  let suggestion = null;
  let previous = null;
  let applied = null;
  let observed = getSpeed();

  function highlight(on) {
    document.querySelectorAll("#code .code-line").forEach((line) => {
      line.classList.toggle("sparky-line", on && line.textContent.includes("delay("));
    });
  }
  function clearPreview() {
    suggestion = null;
    preview.hidden = true;
    apply.hidden = true;
  }
  function open() {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    root.classList.add("sparky-awake");
    highlight(true);
  }
  function close() {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    root.classList.remove("sparky-awake");
    highlight(false);
    toggle.focus({ preventScroll: true });
  }
  toggle.onclick = () => panel.hidden ? open() : close();
  root.querySelector("#sparky-close").onclick = close;
  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      event.stopPropagation();
      close();
    }
  });
  root.querySelector("#sparky-hint").onclick = () => {
    clearPreview();
    message.textContent = traffic ? "Find the three glowing delay() lines. Red and green wait twice as long as yellow. Each LOW turns a light off before the next HIGH turns another on. The order is red, green, yellow." : "Find the two glowing delay() lines. Each number is a wait in milliseconds. 1000 is one second. A smaller number makes the light blink faster.";
    highlight(true);
  };
  root.querySelectorAll("[data-sparky-goal]").forEach((button) => {
    button.onclick = () => {
      const current = getSpeed();
      suggestion = suggestRhythm(current, button.dataset.sparkyGoal);
      if (suggestion === current) {
        clearPreview();
        message.textContent = "That’s already the " + (current === 250 ? "fastest" : "slowest") + " rhythm in this lesson. Try the other direction.";
        return;
      }
      message.textContent = traffic ? `Red and green: ${current*2} → ${suggestion*2} ms. Yellow: ${current} → ${suggestion} ms. The sequence stays red, green, yellow. Your code hasn’t changed yet.` : `Let’s change both waits from ${current} to ${suggestion} milliseconds. The light will blink ${suggestion < current ? "faster" : "slower"}. Your code hasn’t changed yet.`;
      preview.textContent = traffic ? `Red + green: delay(${current*2}); → delay(${suggestion*2});\nYellow: delay(${current}); → delay(${suggestion});` : `Both wait lines:\ndelay(${current}); → delay(${suggestion});`;
      preview.hidden = false;
      apply.hidden = false;
      highlight(true);
    };
  });
  apply.onclick = () => {
    if (suggestion === null) return;
    const next = suggestion;
    const before = getSpeed();
    clearPreview();
    changeSpeed(next);
    previous = before;
    applied = next;
    undo.hidden = false;
    message.textContent = traffic ? "All three waits changed. Go to step 7 and choose Test my sequence. Undo restores your old waits." : "Both waits changed. Go to step 7 and choose Test my circuit to see the new rhythm. Undo puts your old waits back.";
    root.classList.remove("sparky-cheer");
    void root.offsetWidth;
    root.classList.add("sparky-cheer");
    highlight(true);
  };
  undo.onclick = () => {
    if (previous === null || getSpeed() !== applied) return;
    const restore = previous;
    previous = applied = null;
    changeSpeed(restore);
    undo.hidden = true;
    clearPreview();
    message.textContent = "Your old waits are back. Run a fresh test in step 7 before sending code to a board.";
    highlight(true);
  };
  return {
    open,
    sync() {
      const current = getSpeed();
      if (current !== observed) {
        clearPreview();
        previous = applied = null;
        undo.hidden = true;
        message.textContent = "Your rhythm changed. Want a hint about the two wait lines?";
        observed = current;
      }
      highlight(!panel.hidden);
    },
    reset() {
      clearPreview();
      previous = applied = null;
      undo.hidden = true;
      observed = getSpeed();
      message.textContent = traffic ? "I’m Sparky. Want a hint about HIGH, LOW and the three waits?" : "I’m Sparky. Want a hint, or shall we change the blink rhythm together?";
      close();
    },
  };
}
