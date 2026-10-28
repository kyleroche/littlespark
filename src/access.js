const $ = (selector) => document.querySelector(selector);
async function api(action, data) {
  const response = await fetch("/api/family?action=" + action, {
    method: data === undefined ? "GET" : "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok)
    throw Error(result.error || "Could not sign in. Please try again.");
  return result;
}
const match = location.pathname.match(/^\/(login|parent-login)\/([^/]+)\/?$/);
if (match) {
  const kid = match[1] === "login";
  document.title =
    (kid ? "Learner login" : "Parent sign-in") + " — Little Spark";
  $("#access-form").hidden = true;
  $("#access-help").hidden = true;
  $("#access-label").textContent = kid ? "LEARNER LOGIN" : "PARENT SIGN-IN";
  $("#access-title").textContent = kid
    ? "Ready to build?"
    : "Your lab is ready.";
  $("#access-description").textContent = kid
    ? "Open your learner profile with the link your grown-up made."
    : "Confirm to sign in to your parent account.";
  $("#access-fine").textContent =
    "This link works once and expires after five minutes.";
  const confirm = $("#access-confirm");
  confirm.hidden = false;
  confirm.textContent = kid ? "Open my lab ↗" : "Sign in ↗";
  confirm.onclick = async () => {
    confirm.disabled = true;
    $("#access-status").textContent = "Checking your link…";
    try {
      await api(kid ? "consume-kid-link" : "consume-parent-link", {
        token: decodeURIComponent(match[2]),
      });
      history.replaceState(null, "", "/signin/");
      location.replace(kid ? "/learn/" : "/learn/?signin=1");
    } catch (error) {
      $("#access-status").textContent = error.message;
      confirm.disabled = false;
      $("#access-again").hidden = kid;
      if (kid)
        $("#access-fine").textContent =
          "If the link expired or was used already, ask your grown-up to make a new one.";
    }
  };
} else {
  if(new URLSearchParams(location.search).has("deleted")) $("#access-status").textContent="Your family account and saved progress were deleted.";
  api("me")
    .then((result) => {
      if (result.user)
        location.replace(
          result.user.role === "parent" ? "/learn/?signin=1" : "/learn/",
        );
    })
    .catch(() => {});
  $("#access-form").onsubmit = async (event) => {
    event.preventDefault();
    const submit = $("#access-submit");
    submit.disabled = true;
    $("#access-status").textContent = "Sending your link…";
    try {
      const result = await api("request-parent-link", {
        email: $("#access-email").value.trim(),
      });
      $("#access-title").textContent = "Check your email.";
      $("#access-description").textContent =
        "Open the sign-in link in your email to enter the lab and set up your family.";
      $("#access-status").textContent = result.message;
      $("#access-form").hidden = true;
      $("#access-again").textContent =
        "Use another email or request a new link";
      $("#access-again").hidden = false;
    } catch (error) {
      $("#access-status").textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  };
}
